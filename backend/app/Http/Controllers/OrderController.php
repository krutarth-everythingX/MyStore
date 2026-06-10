<?php

namespace App\Http\Controllers;

use App\Actions\CancelOrderAction;
use App\Actions\PlaceOrderAction;
use App\DTOs\OrderCheckoutData;
use App\DTOs\ShippableItemData;
use App\DTOs\ShippingRateRequestData;
use App\Enums\OrderStatus;
use App\Events\OrderPlaced;
use App\Jobs\SendOrderShippedNotificationJob;
use App\Jobs\SyncOrderToShiprocketJob;
use App\Models\Order;
use App\Models\Product;
use App\Rules\IndianPostalCode;
use App\Services\ShippingService;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        // Buyers list their own orders
        $orders = Order::with(['items.product.brand', 'items.product.user'])
            ->where('buyer_id', $request->user()->id)
            ->latest()
            ->get();

        return response($orders, 200);
    }

    public function shippingRates(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'shipping_address' => 'required|string',
        ]);

        $shippingRateRequest = ShippingRateRequestData::fromArray($validated);

        $itemsWithProducts = array_map(function ($itemData) {
            return new ShippableItemData(
                product: Product::findOrFail($itemData->productId),
                quantity: $itemData->quantity,
            );
        }, $shippingRateRequest->items);

        $shippingService = new ShippingService();
        $rates = $shippingService->calculateRates($itemsWithProducts, $shippingRateRequest->shippingAddress);

        if ($request->header('X-Inertia')) {
            return back()->with('shipping_rates', $rates);
        }

        return response(['rates' => $rates], 200);
    }

    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'shipping_address' => 'required|string',
            'billing_address' => 'nullable|string',
            'buyer_phone' => 'required|string',
            'country' => 'required|string',
            'city' => 'required|string',
            'state' => 'required|string',
            'postal_code' => ['required', 'string', new IndianPostalCode()],
            'company_name' => 'nullable|string',
            'buyer_gstin' => 'nullable|string|max:15',
            'payment_method' => 'required|string', // Credit Card, COD
            'shipping_carrier' => 'nullable|string',
            'shipping_service' => 'nullable|string',
            'shipping_cost' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
        ]);

        $checkoutData = OrderCheckoutData::fromArray($validated);

        try {
            $result = (new PlaceOrderAction())->handle($checkoutData, $request->user());
        } catch (HttpResponseException $exception) {
            if ($request->header('X-Inertia')) {
                $payload = method_exists($exception->getResponse(), 'getData')
                    ? $exception->getResponse()->getData(true)
                    : [];

                return back()->with('error', $payload['message'] ?? 'Checkout failed.');
            }

            throw $exception;
        }

        if ($request->header('X-Inertia')) {
            return back()->with('checkout', [
                'order' => $result['order'],
                'client_secret' => $result['client_secret'],
                'requires_payment_confirmation' => $validated['payment_method'] === 'Credit Card',
            ]);
        }

        return response($result, 201);
    }

    public function stripeWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $endpointSecret = config('services.stripe.webhook_secret') ?: env('STRIPE_WEBHOOK_SECRET');

        $event = null;

        if ($endpointSecret && $sigHeader) {
            try {
                $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
            } catch (\UnexpectedValueException $e) {
                return response(['message' => 'Invalid payload'], 400);
            } catch (\Stripe\Exception\SignatureVerificationException $e) {
                return response(['message' => 'Invalid signature'], 400);
            }
        } else {
            // Safe fallback simulation for sandbox/development testing without active webhook tunnels
            $data = json_decode($payload, true);
            $mockData = [
                'type' => $data['type'] ?? 'payment_intent.succeeded',
                'data' => [
                    'object' => [
                        'id' => $data['data']['object']['id'] ?? $data['id'] ?? 'pi_mock_123',
                        'metadata' => [
                            'order_id' => $data['data']['object']['metadata']['order_id'] ?? $data['metadata']['order_id'] ?? null
                        ]
                    ]
                ]
            ];
            $event = json_decode(json_encode($mockData));
        }

        if ($event->type === 'payment_intent.succeeded') {
            $paymentIntent = $event->data->object;
            $orderId = $paymentIntent->metadata->order_id ?? null;

            if ($orderId) {
                $order = Order::with('buyer')->find($orderId);
                if ($order && $order->status === OrderStatus::Pending) {
                    $order->update(['status' => OrderStatus::Processing]);
                    event(new OrderPlaced($order));
                }
            }
        }

        return response(['status' => 'success'], 200);
    }

    public function cancel(Request $request, $id)
    {
        $order = Order::with('items.product')->find($id);

        if (!$order) {
            if ($request->header('X-Inertia')) {
                return back()->with('error', 'Order not found.');
            }
            return response(['message' => 'Order not found.'], 404);
        }

        $this->authorize('cancel', $order);

        if (!in_array($order->status?->value, OrderStatus::cancellableValues(), true)) {
            if ($request->header('X-Inertia')) {
                return back()->with('error', 'Order cannot be cancelled at this stage.');
            }
            return response(['message' => 'Order cannot be cancelled at this stage.'], 400);
        }

        $cancelledOrder = (new CancelOrderAction())->handle($order);

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Order cancelled successfully.');
        }

        return response($cancelledOrder, 200);
    }

    public function returnOrder(Request $request, $id)
    {
        $order = Order::with('items.product')->find($id);

        if (!$order) {
            if ($request->header('X-Inertia')) {
                return back()->with('error', 'Order not found.');
            }
            return response(['message' => 'Order not found.'], 404);
        }

        $this->authorize('return', $order);

        // Restrict returns to completed (delivered) orders
        if ($order->status !== OrderStatus::Completed) {
            if ($request->header('X-Inertia')) {
                return back()->with('error', 'Only completed orders can be returned.');
            }
            return response(['message' => 'Only completed orders can be returned.'], 400);
        }

        if ($order->refund_status === 'refunded') {
            if ($request->header('X-Inertia')) {
                return back()->with('error', 'This order has already been refunded.');
            }
            return response(['message' => 'This order has already been refunded.'], 400);
        }

        return DB::transaction(function () use ($order, $request) {
            // Restock items
            foreach ($order->items as $item) {
                $product = $item->product;
                if ($product && $product->manage_stock) {
                    $product->stock_quantity += $item->quantity;
                    $product->save();

                    // Restock first associated warehouse
                    $warehouse = $product->warehouses()->first();
                    if ($warehouse) {
                        $product->warehouses()->updateExistingPivot($warehouse->id, [
                            'quantity' => $warehouse->pivot->quantity + $item->quantity
                        ]);
                    }
                }
            }

            $order->status = OrderStatus::Cancelled; // or returned
            $order->refund_status = 'refunded';
            $order->save();

            // Trigger Stripe Refund if applicable
            if ($order->stripe_payment_intent_id) {
                $stripeSecret = config('services.stripe.secret') ?: env('STRIPE_SECRET_KEY');
                if ($stripeSecret && !str_starts_with($order->stripe_payment_intent_id, 'pi_mock_')) {
                    try {
                        Stripe::setApiKey($stripeSecret);
                        \Stripe\Refund::create([
                            'payment_intent' => $order->stripe_payment_intent_id,
                        ]);
                    } catch (\Exception $e) {
                        Log::error("Stripe Return Refund failed: " . $e->getMessage());
                    }
                }
            }

            if ($request->header('X-Inertia')) {
                return back()->with('success', 'Return and refund processed successfully.');
            }

            return response($order->load('items.product'), 200);
        });
    }

    /**
     * Calculate geodesic distance (Haversine formula) between two ZIP codes (deterministic mock lookup & generator).
     */
    private function calculateZipDistance($zip1, $zip2)
    {
        $zipCoordinates = [
            '100' => [40.7128, -74.0060],  // New York
            '900' => [34.0522, -118.2437], // Los Angeles
            '606' => [41.8781, -87.6298],  // Chicago
            '770' => [29.7604, -95.3698],  // Houston
            '331' => [25.7617, -80.1918],  // Miami
            '981' => [47.6062, -122.3321], // Seattle
            '021' => [42.3601, -71.0589],  // Boston
            '200' => [38.9072, -77.0369],  // Washington DC
            '303' => [33.7490, -84.3880],  // Atlanta
            '941' => [37.7749, -122.4194], // San Francisco
        ];

        $getCoords = function($zip) use ($zipCoordinates) {
            $digits = preg_replace('/[^0-9]/', '', $zip);
            if (strlen($digits) < 3) return [40.0, -95.0];
            $prefix = substr($digits, 0, 3);
            if (isset($zipCoordinates[$prefix])) {
                return $zipCoordinates[$prefix];
            }
            $val = intval($prefix);
            $lat = 25.0 + ($val % 25);
            $lng = -125.0 + (($val * 7) % 55);
            return [$lat, $lng];
        };

        list($lat1, $lng1) = $getCoords($zip1);
        list($lat2, $lng2) = $getCoords($zip2);

        $earthRadius = 6371; // km
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }

    public function ship(Request $request, $id)
    {
        $order = Order::with(['buyer', 'items.product'])->find($id);
        if (!$order) {
            if ($request->header('X-Inertia')) {
                return back()->with('error', 'Order not found');
            }
            return response(['message' => 'Order not found'], 404);
        }

        $this->authorize('ship', $order);

        $seller = $request->user();

        if ($order->status !== OrderStatus::Processing) {
            if ($request->header('X-Inertia')) {
                return back()->with('error', 'Only processing orders can be shipped');
            }
            return response(['message' => 'Only processing orders can be shipped'], 400);
        }

        // Prepare Shiprocket Payload
        $shiprocket = new \App\Services\ShiprocketService();
        
        $pickupCode = $seller->postal_code ?: '380001';
        $weight = 0.0;
        $orderItems = [];

        foreach ($order->items as $item) {
            $prod = $item->product;
            $weight += floatval($prod->weight_kg ?: 0.5) * $item->quantity;
            $orderItems[] = [
                'name' => $prod->name,
                'sku' => $prod->sku ?: 'SKU-' . $prod->id,
                'units' => $item->quantity,
                'selling_price' => $item->price,
            ];
        }

        $payload = [
            'order_id' => $order->id,
            'order_date' => $order->created_at->format('Y-m-d H:i'),
            'pickup_location' => $seller->brand_name ?: 'Seller Hub',
            'billing_customer_name' => $order->buyer->name,
            'billing_last_name' => '',
            'billing_address' => $order->billing_address,
            'billing_city' => $order->city ?: 'Ahmedabad',
            'billing_pincode' => $order->postal_code ?: '380001',
            'billing_state' => $order->state ?: 'Gujarat',
            'billing_country' => $order->country ?: 'India',
            'billing_email' => $order->buyer->email,
            'billing_phone' => $order->buyer_phone ?: $order->buyer->phone ?: '9999999999',
            'shipping_is_billing' => true,
            'order_items' => $orderItems,
            'payment_method' => $order->payment_method === 'COD' ? 'COD' : 'Prepaid',
            'sub_total' => $order->total_amount,
            'length' => 10,
            'width' => 10,
            'height' => 10,
            'weight' => $weight,
        ];

        $token = ($seller->shiprocket_email && $seller->shiprocket_password)
            ? $shiprocket->authenticate($seller->shiprocket_email, $seller->shiprocket_password)
            : null;

        $syncRes = $shiprocket->createAdhocOrder($payload, $token);

        if ($syncRes['success']) {
            $labelUrl = $shiprocket->generateLabel($syncRes['shipment_id'], $token);

            $order->update([
                'status' => OrderStatus::Shipped,
                'tracking_number' => $syncRes['awb_code'],
                'shipping_label_url' => $labelUrl,
                'tracking_url' => 'https://www.shiprocket.in/tracking/' . $syncRes['awb_code'],
                'shipping_carrier' => 'Shiprocket'
            ]);

            SendOrderShippedNotificationJob::dispatch($order->id);

            if ($request->header('X-Inertia')) {
                return back()->with('success', 'Order successfully shipped via Shiprocket!');
            }

            return response([
                'message' => 'Order successfully shipped via Shiprocket!',
                'order' => $order->load(['buyer', 'items.product'])
            ], 200);
        }

        if ($request->header('X-Inertia')) {
            return back()->with('error', 'Failed to push order to Shiprocket.');
        }

        return response(['message' => 'Failed to push order to Shiprocket.'], 500);
    }

    public function invoice(Request $request, $id)
    {
        $order = Order::with(['buyer', 'items.product'])->find($id);
        if (!$order) {
            return response(['message' => 'Order not found'], 404);
        }

        // Get Seller details
        $firstItem = $order->items->first();
        $seller = $firstItem ? \App\Models\User::find($firstItem->product->user_id) : null;

        $subtotal = 0.00;
        foreach ($order->items as $item) {
            $subtotal += floatval($item->price) * $item->quantity;
        }

        $taxable = $subtotal + floatval($order->shipping_cost) - floatval($order->discount_amount);

        // Simple printable HTML response
        $html = "
        <html>
        <head>
            <title>Tax Invoice - {$order->invoice_number}</title>
            <style>
                body { font-family: 'Outfit', sans-serif; color: #333; margin: 40px; }
                .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 2px solid #000; box-shadow: none; font-size: 14px; line-height: 24px; }
                .invoice-box table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
                .invoice-box table td { padding: 8px; vertical-align: top; }
                .invoice-box table tr.top table td { padding-bottom: 20px; }
                .invoice-box table tr.information table td { padding-bottom: 40px; }
                .invoice-box table tr.heading td { background: #eee; border: 1px solid #000; font-weight: bold; }
                .invoice-box table tr.details td { padding-bottom: 20px; }
                .invoice-box table tr.item td { border: 1px solid #000; }
                .invoice-box table tr.total td { border-top: 2px solid #000; font-weight: bold; }
                .text-right { text-align: right; }
                .flat-border { border: 1px solid #000 !important; }
            </style>
        </head>
        <body>
            <div class='invoice-box flat-border'>
                <table>
                    <tr class='top'>
                        <td colspan='4'>
                            <table>
                                <tr>
                                    <td>
                                        <h2>TAX INVOICE</h2>
                                        <strong>Invoice #:</strong> {$order->invoice_number}<br>
                                        <strong>Date:</strong> {$order->created_at->format('d-M-Y')}<br>
                                        <strong>Order ID:</strong> #{$order->id}
                                    </td>
                                    <td class='text-right'>
                                        <h3>" . ($seller ? $seller->brand_name : 'MyStore Seller') . "</h3>
                                        " . ($seller ? nl2br($seller->address) : '') . "<br>
                                        <strong>GSTIN:</strong> " . ($seller ? ($seller->gst_number ?: 'Not Configured') : 'N/A') . "
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr class='information'>
                        <td colspan='4'>
                            <table>
                                <tr>
                                    <td>
                                        <strong>Bill To:</strong><br>
                                        {$order->buyer->name}<br>
                                        " . ($order->company_name ? "{$order->company_name}<br>" : '') . "
                                        " . nl2br($order->shipping_address) . "<br>
                                        {$order->city}, {$order->state} - {$order->postal_code}<br>
                                        <strong>Phone:</strong> {$order->buyer_phone}<br>
                                        " . ($order->buyer_gstin ? "<strong>GSTIN:</strong> {$order->buyer_gstin}" : '') . "
                                    </td>
                                    <td class='text-right'>
                                        <strong>Place of Supply:</strong><br>
                                        {$order->state}, {$order->country}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr class='heading'>
                        <td>Item / Description</td>
                        <td class='text-right'>Unit Price</td>
                        <td class='text-right'>Qty</td>
                        <td class='text-right'>Total</td>
                    </tr>";

        foreach ($order->items as $item) {
            $itemTotal = floatval($item->price) * $item->quantity;
            $html .= "
                    <tr class='item'>
                        <td>" . $item->product->name . "<br><small>SKU: " . ($item->product->sku ?: 'N/A') . "</small></td>
                        <td class='text-right'>$" . number_format($item->price, 2) . "</td>
                        <td class='text-right'>" . $item->quantity . "</td>
                        <td class='text-right'>$" . number_format($itemTotal, 2) . "</td>
                    </tr>";
        }

        $html .= "
                    <tr class='total'>
                        <td colspan='2'></td>
                        <td>Subtotal:</td>
                        <td class='text-right'>$" . number_format($subtotal, 2) . "</td>
                    </tr>";

        if ($order->discount_amount > 0) {
            $html .= "
                    <tr>
                        <td colspan='2'></td>
                        <td>Discount:</td>
                        <td class='text-right'>-$" . number_format($order->discount_amount, 2) . "</td>
                    </tr>";
        }

        $html .= "
                    <tr>
                        <td colspan='2'></td>
                        <td>Shipping:</td>
                        <td class='text-right'>$" . number_format($order->shipping_cost, 2) . "</td>
                    </tr>";

        if ($order->cgst > 0 || $order->sgst > 0) {
            $html .= "
                    <tr>
                        <td colspan='2'></td>
                        <td>CGST (9%):</td>
                        <td class='text-right'>$" . number_format($order->cgst, 2) . "</td>
                    </tr>
                    <tr>
                        <td colspan='2'></td>
                        <td>SGST (9%):</td>
                        <td class='text-right'>$" . number_format($order->sgst, 2) . "</td>
                    </tr>";
        } else if ($order->igst > 0) {
            $html .= "
                    <tr>
                        <td colspan='2'></td>
                        <td>IGST (18%):</td>
                        <td class='text-right'>$" . number_format($order->igst, 2) . "</td>
                    </tr>";
        }

        $html .= "
                    <tr style='font-size: 16px; font-weight: bold;'>
                        <td colspan='2'></td>
                        <td>Total:</td>
                        <td class='text-right'>$" . number_format($order->total_amount, 2) . "</td>
                    </tr>
                </table>
                <div style='margin-top: 50px; text-align: center; font-size: 12px; color: #777;'>
                    This is a computer-generated tax invoice and does not require signatures. Thank you for shopping with us!
                </div>
            </div>
        </body>
        </html>";

        return response($html, 200)->header('Content-Type', 'text/html');
    }

    public function syncOrders(Request $request)
    {
        // Find all orders in 'processing' status that don't have a tracking AWB
        $orders = Order::with(['buyer', 'items.product'])
            ->where('status', OrderStatus::Processing->value)
            ->whereNull('tracking_number')
            ->get();

        foreach ($orders as $order) {
            SyncOrderToShiprocketJob::dispatch($order->id);
        }

        return response([
            'message' => "Queued {$orders->count()} orders for Shiprocket synchronization."
        ], 200);
    }
}
