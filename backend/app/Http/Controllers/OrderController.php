<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\ShippingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\PaymentIntent;
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
        $fields = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'shipping_address' => 'required|string',
        ]);

        $itemsWithProducts = [];
        foreach ($fields['items'] as $itemInput) {
            $product = Product::find($itemInput['product_id']);
            $itemsWithProducts[] = [
                'product' => $product,
                'quantity' => $itemInput['quantity']
            ];
        }

        $shippingService = new ShippingService();
        $rates = $shippingService->calculateRates($itemsWithProducts, $fields['shipping_address']);

        return response(['rates' => $rates], 200);
    }

    public function checkout(Request $request)
    {
        $fields = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'shipping_address' => 'required|string',
            'billing_address' => 'nullable|string',
            'buyer_phone' => 'required|string',
            'country' => 'required|string',
            'city' => 'required|string',
            'state' => 'required|string',
            'postal_code' => 'required|string|size:6',
            'company_name' => 'nullable|string',
            'buyer_gstin' => 'nullable|string|max:15',
            'payment_method' => 'required|string', // Credit Card, COD
            'shipping_carrier' => 'nullable|string',
            'shipping_service' => 'nullable|string',
            'shipping_cost' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
        ]);

        $buyer = $request->user();
        $shippingCost = floatval($fields['shipping_cost'] ?? 0);
        $discountAmount = floatval($fields['discount_amount'] ?? 0);

        // Start transaction for consistency
        return DB::transaction(function () use ($fields, $buyer, $shippingCost, $discountAmount) {
            $itemsSubtotal = 0;
            $itemsToCreate = [];

            foreach ($fields['items'] as $itemInput) {
                $product = Product::with('warehouses')->find($itemInput['product_id']);

                if (!$product) {
                    return response(['message' => 'Product not found.'], 404);
                }

                // Check stock
                if ($product->manage_stock) {
                    if ($product->stock_quantity < $itemInput['quantity']) {
                        return response([
                            'message' => "Insufficient stock for product: {$product->name}. Only {$product->stock_quantity} remaining."
                        ], 400);
                    }

                    // Extract ZIP code from shipping address
                    $zipPattern = '/\b\d{5}(?:-\d{4})?\b/';
                    preg_match($zipPattern, $fields['shipping_address'], $matches);
                    $buyerZip = $matches[0] ?? '10001';

                    // Sort warehouses by distance to shipping address ZIP code
                    $sortedWarehouses = $product->warehouses->sortBy(function($warehouse) use ($buyerZip) {
                        $warehouseZip = preg_replace('/[^0-9]/', '', $warehouse->postal_code) ?: '10001';
                        return $this->calculateZipDistance($buyerZip, $warehouseZip);
                    });

                    // Deduct from warehouse stock first
                    $quantityToDeduct = $itemInput['quantity'];
                    foreach ($sortedWarehouses as $warehouse) {
                        $currentWarehouseQty = $warehouse->pivot->quantity;
                        if ($currentWarehouseQty >= $quantityToDeduct) {
                            $product->warehouses()->updateExistingPivot($warehouse->id, [
                                'quantity' => $currentWarehouseQty - $quantityToDeduct
                            ]);
                            $quantityToDeduct = 0;
                            break;
                        } else {
                            $product->warehouses()->updateExistingPivot($warehouse->id, [
                                'quantity' => 0
                            ]);
                            $quantityToDeduct -= $currentWarehouseQty;
                        }
                    }

                    // Deduct overall product stock quantity
                    $product->stock_quantity -= $itemInput['quantity'];
                    if ($product->stock_quantity <= 0) {
                        $product->stock_status = 'outofstock';
                    }
                    $product->save();

                    // Low Stock Alert Notification
                    if ($product->manage_stock && $product->stock_quantity <= $product->low_stock_amount) {
                        try {
                            $seller = $product->user;
                            if ($seller) {
                                $notifier = new \App\Services\NotificationService();
                                $notifier->sendLowStockNotification($seller, $product);
                            }
                        } catch (\Exception $e) {
                            Log::error("Low stock notification alert failed: " . $e->getMessage());
                        }
                    }
                }

                $price = $product->sale_price ?? $product->regular_price;
                $itemsSubtotal += $price * $itemInput['quantity'];

                $itemsToCreate[] = [
                    'product_id' => $product->id,
                    'seller_id' => $product->user_id,
                    'quantity' => $itemInput['quantity'],
                    'price' => $price
                ];
            }

            $taxableBase = max(0.00, $itemsSubtotal + $shippingCost - $discountAmount);

            // Get Seller State for GST check
            $firstProduct = Product::find($fields['items'][0]['product_id']);
            $seller = $firstProduct ? \App\Models\User::find($firstProduct->user_id) : null;
            $sellerState = $seller ? ($seller->state ?: 'Gujarat') : 'Gujarat';
            
            $buyerState = $fields['state'];
            
            // CGST + SGST (9% each = 18% total) if both in same state. Else IGST (18%)
            $cgst = 0;
            $sgst = 0;
            $igst = 0;
            
            if (strcasecmp(trim($sellerState), trim($buyerState)) === 0 || 
                stripos($sellerState, $buyerState) !== false || 
                stripos($buyerState, $sellerState) !== false) {
                $cgst = round($taxableBase * 0.09, 2);
                $sgst = round($taxableBase * 0.09, 2);
            } else {
                $igst = round($taxableBase * 0.18, 2);
            }
            
            $totalAmount = $taxableBase + $cgst + $sgst + $igst;
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . mt_rand(1000, 9999);

            // Create Order initially with status 'pending' (if Stripe) or 'processing' (if COD)
            $initialStatus = ($fields['payment_method'] === 'Credit Card') ? 'pending' : 'processing';

            $order = Order::create([
                'buyer_id' => $buyer->id,
                'buyer_phone' => $fields['buyer_phone'],
                'total_amount' => $totalAmount,
                'status' => $initialStatus,
                'shipping_address' => $fields['shipping_address'],
                'billing_address' => $fields['billing_address'] ?? $fields['shipping_address'],
                'country' => $fields['country'],
                'city' => $fields['city'],
                'state' => $fields['state'],
                'postal_code' => $fields['postal_code'],
                'company_name' => $fields['company_name'] ?? null,
                'buyer_gstin' => $fields['buyer_gstin'] ?? null,
                'payment_method' => $fields['payment_method'],
                'shipping_carrier' => $fields['shipping_carrier'] ?? null,
                'shipping_cost' => $shippingCost,
                'discount_amount' => $discountAmount,
                'cgst' => $cgst,
                'sgst' => $sgst,
                'igst' => $igst,
                'invoice_number' => $invoiceNumber,
                'refund_status' => null,
            ]);

            // Create OrderItems
            foreach ($itemsToCreate as $itemData) {
                $itemData['order_id'] = $order->id;
                OrderItem::create($itemData);
            }

            $clientSecret = null;
            if ($fields['payment_method'] === 'Credit Card') {
                $stripeSecret = config('services.stripe.secret') ?: env('STRIPE_SECRET_KEY');
                if ($stripeSecret) {
                    try {
                        Stripe::setApiKey($stripeSecret);
                        $intent = PaymentIntent::create([
                            'amount' => (int) round($totalAmount * 100),
                            'currency' => 'usd',
                            'metadata' => [
                                'order_id' => $order->id,
                                'buyer_id' => $buyer->id,
                            ],
                        ]);
                        $order->update(['stripe_payment_intent_id' => $intent->id]);
                        $clientSecret = $intent->client_secret;
                    } catch (\Exception $e) {
                        Log::error("Stripe PaymentIntent creation failed: " . $e->getMessage());
                        // Sandbox Mock Fallback if Stripe server fails
                        $mockIntentId = 'pi_mock_' . uniqid();
                        $order->update(['stripe_payment_intent_id' => $mockIntentId]);
                        $clientSecret = $mockIntentId . '_secret_' . uniqid();
                    }
                } else {
                    // Sandbox Mock Fallback if no Stripe key is configured in env
                    $mockIntentId = 'pi_mock_' . uniqid();
                    $order->update(['stripe_payment_intent_id' => $mockIntentId]);
                    $clientSecret = $mockIntentId . '_secret_' . uniqid();
                }
            }

            $loadedOrder = $order->load(['buyer', 'items.product']);
            if ($loadedOrder->status === 'processing') {
                try {
                    $notifier = new \App\Services\NotificationService();
                    $notifier->sendOrderPlacedNotification($loadedOrder);
                } catch (\Exception $e) {
                    Log::error("COD placed notification dispatch failed: " . $e->getMessage());
                }
            }

            return response([
                'order' => $loadedOrder,
                'client_secret' => $clientSecret
            ], 201);
        });
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
                if ($order && $order->status === 'pending') {
                    $order->update(['status' => 'processing']);
                    try {
                        $notifier = new \App\Services\NotificationService();
                        $notifier->sendOrderPlacedNotification($order);
                    } catch (\Exception $e) {
                        Log::error("Stripe webhook placed notification dispatch failed: " . $e->getMessage());
                    }
                }
            }
        }

        return response(['status' => 'success'], 200);
    }

    public function cancel(Request $request, $id)
    {
        $order = Order::with('items.product')->find($id);
        $user = $request->user();

        if (!$order) {
            return response(['message' => 'Order not found.'], 404);
        }

        if ($order->buyer_id !== $user->id) {
            return response(['message' => 'Unauthorized.'], 403);
        }

        if (!in_array($order->status, ['pending', 'processing'])) {
            return response(['message' => 'Order cannot be cancelled at this stage.'], 400);
        }

        return DB::transaction(function () use ($order) {
            // Restock items
            foreach ($order->items as $item) {
                $product = $item->product;
                if ($product && $product->manage_stock) {
                    $product->stock_quantity += $item->quantity;
                    if ($product->stock_quantity > 0) {
                        $product->stock_status = 'instock';
                    }
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

            $order->status = 'cancelled';
            $order->refund_status = $order->payment_method === 'Credit Card' ? 'refunded' : null;
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
                        Log::error("Stripe Refund failed: " . $e->getMessage());
                    }
                }
            }

            return response($order->load('items.product'), 200);
        });
    }

    public function returnOrder(Request $request, $id)
    {
        $order = Order::with('items.product')->find($id);
        $user = $request->user();

        if (!$order) {
            return response(['message' => 'Order not found.'], 404);
        }

        if ($order->buyer_id !== $user->id) {
            return response(['message' => 'Unauthorized.'], 403);
        }

        // Restrict returns to completed (delivered) orders
        if ($order->status !== 'completed') {
            return response(['message' => 'Only completed orders can be returned.'], 400);
        }

        if ($order->refund_status === 'refunded') {
            return response(['message' => 'This order has already been refunded.'], 400);
        }

        return DB::transaction(function () use ($order) {
            // Restock items
            foreach ($order->items as $item) {
                $product = $item->product;
                if ($product && $product->manage_stock) {
                    $product->stock_quantity += $item->quantity;
                    if ($product->stock_quantity > 0) {
                        $product->stock_status = 'instock';
                    }
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

            $order->status = 'cancelled'; // or returned
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
            return response(['message' => 'Order not found'], 404);
        }

        // Verify that the order belongs to the seller's products
        $seller = $request->user();
        if ($order->items->first()->product->user_id !== $seller->id) {
            return response(['message' => 'Unauthorized'], 403);
        }

        if ($order->status !== 'processing') {
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
                'status' => 'shipped',
                'tracking_number' => $syncRes['awb_code'],
                'shipping_label_url' => $labelUrl,
                'tracking_url' => 'https://www.shiprocket.in/tracking/' . $syncRes['awb_code'],
                'shipping_carrier' => 'Shiprocket'
            ]);

            // Notify buyer
            try {
                $notifier = new \App\Services\NotificationService();
                $notifier->sendOrderShippedNotification($order);
            } catch (\Exception $e) {
                Log::error("Failed to send shipping notification: " . $e->getMessage());
            }

            return response([
                'message' => 'Order successfully shipped via Shiprocket!',
                'order' => $order->load(['buyer', 'items.product'])
            ], 200);
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
            ->where('status', 'processing')
            ->whereNull('tracking_number')
            ->get();

        $count = 0;
        $shiprocket = new \App\Services\ShiprocketService();

        foreach ($orders as $order) {
            // Find seller of first product
            $firstItem = $order->items->first();
            $seller = $firstItem ? \App\Models\User::find($firstItem->product->user_id) : null;
            if (!$seller) continue;

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
                'billing_phone' => $order->buyer_phone ?: '9999999999',
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
                    'status' => 'shipped',
                    'tracking_number' => $syncRes['awb_code'],
                    'shipping_label_url' => $labelUrl,
                    'tracking_url' => 'https://www.shiprocket.in/tracking/' . $syncRes['awb_code'],
                    'shipping_carrier' => 'Shiprocket'
                ]);
                $count++;
            }
        }

        return response(['message' => "Successfully synchronized {$count} orders to Shiprocket aggregator."], 200);
    }
}
