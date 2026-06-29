<?php

namespace App\Actions;

use App\DTOs\OrderCheckoutData;
use App\Enums\OrderStatus;
use App\Events\OrderPlaced;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Notifications\LowStockNotification;
use App\Services\InventoryService\ManageStockMovement;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class PlaceOrderAction
{
    public function __construct(private readonly ManageStockMovement $manageStockMovement)
    {
    }

    public function handle(OrderCheckoutData $checkoutData, User $buyer): array
    {
        return DB::transaction(function () use ($checkoutData, $buyer) {
            $buyerCountry = country_name_for($checkoutData->country ?: $buyer->country);
            $displayCurrency = currency_for_country($buyerCountry);
            $orderCurrency = base_money_currency();
            $orderTimezone = 'UTC';
            $itemsSubtotal = 0;
            $itemsToCreate = [];
            $sellerIds = [];
            $requiresPaymentConfirmation = false;

            foreach ($checkoutData->items as $itemData) {
                $product = Product::with('warehouses')->find($itemData->productId);

                if (!$product) {
                    throw new HttpResponseException(
                        response(['message' => 'Product not found.'], 404)
                    );
                }

                if ($product->manage_stock) {
                    $availableQuantity = $product->warehouses->isEmpty()
                        ? (int) $product->stock_quantity
                        : $product->warehouses->sum(function ($warehouse) {
                            return (int) ($warehouse->pivot->available_quantity ?? max(0, ((int) $warehouse->pivot->quantity) - ((int) $warehouse->pivot->reserved_quantity)));
                        });

                    if ($availableQuantity < $itemData->quantity) {
                        throw new HttpResponseException(
                            response([
                                'message' => "Insufficient stock for product: {$product->name}. Only {$availableQuantity} remaining."
                            ], 400)
                        );
                    }
                }

                $sourceCurrency = $product->price_currency ?: currency_for_country($product->user?->country);
                $basePrice = (float) ($product->sale_price ?? $product->regular_price ?? 0);
                $price = money_to_base($basePrice, $sourceCurrency);
                $itemsSubtotal += $price * $itemData->quantity;

                $itemsToCreate[] = [
                    'product_id' => $product->id,
                    'seller_id' => $product->user_id,
                    'quantity' => $itemData->quantity,
                    'price' => $price,
                    'currency' => $orderCurrency,
                ];
                $sellerIds[] = (int) $product->user_id;
            }

            if (count(array_unique(array_filter($sellerIds))) > 1) {
                throw new HttpResponseException(
                    response([
                        'message' => 'Checkout currently supports items from one seller at a time.'
                    ], 400)
                );
            }

            $shippingCost = money_to_base($checkoutData->shippingCost, $displayCurrency);
            $discountAmount = money_to_base($checkoutData->discountAmount, $displayCurrency);
            $taxableBase = max(0.00, $itemsSubtotal + $shippingCost - $discountAmount);

            $firstProduct = Product::find($checkoutData->items[0]->productId);
            $seller = $firstProduct ? User::find($firstProduct->user_id) : null;
            $sellerCountry = country_name_for($seller?->country);
            $sellerState = $seller ? ($seller->state ?: 'Gujarat') : 'Gujarat';
            $buyerState = $checkoutData->state;
            $isIndianSeller = strcasecmp($sellerCountry, 'India') === 0;

            $cgst = 0;
            $sgst = 0;
            $igst = 0;

            if ($isIndianSeller && (
                strcasecmp(trim($sellerState), trim($buyerState)) === 0 ||
                stripos($sellerState, $buyerState) !== false ||
                stripos($buyerState, $sellerState) !== false
            )) {
                $cgst = round($taxableBase * 0.09, 2);
                $sgst = round($taxableBase * 0.09, 2);
            } elseif ($isIndianSeller) {
                $igst = round($taxableBase * 0.18, 2);
            }

            $totalAmount = $taxableBase + $cgst + $sgst + $igst;
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . mt_rand(1000, 9999);
            $initialStatus = $checkoutData->paymentMethod === 'Credit Card'
                ? OrderStatus::Pending
                : OrderStatus::Processing;

            $order = Order::create([
                'buyer_id' => $buyer->id,
                'buyer_phone' => $checkoutData->buyerPhone,
                'total_amount' => $totalAmount,
                'currency' => $orderCurrency,
                'timezone' => $orderTimezone,
                'status' => $initialStatus,
                'shipping_address' => $checkoutData->shippingAddress,
                'billing_address' => $checkoutData->billingAddress ?? $checkoutData->shippingAddress,
                'country' => $buyerCountry,
                'city' => $checkoutData->city,
                'state' => $checkoutData->state,
                'postal_code' => $checkoutData->postalCode,
                'company_name' => $checkoutData->companyName,
                'buyer_gstin' => $checkoutData->buyerGstin,
                'payment_method' => $checkoutData->paymentMethod,
                'shipping_carrier' => $checkoutData->shippingCarrier,
                'shipping_cost' => $shippingCost,
                'discount_amount' => $discountAmount,
                'cgst' => $cgst,
                'sgst' => $sgst,
                'igst' => $igst,
                'invoice_number' => $invoiceNumber,
                'refund_status' => null,
            ]);

            foreach ($itemsToCreate as $itemData) {
                $itemData['order_id'] = $order->id;
                OrderItem::create($itemData);
            }

            foreach ($checkoutData->items as $itemData) {
                $product = Product::with('warehouses', 'user')->find($itemData->productId);

                if ($product && $product->manage_stock) {
                    $this->manageStockMovement->reserveForOrder(
                        $product,
                        $itemData->quantity,
                        $order,
                        $this->extractBuyerZipCode($checkoutData->shippingAddress),
                    );

                    if ($product->fresh()->stock_quantity <= $product->low_stock_amount) {
                        try {
                            $seller = $product->user;
                            if ($seller) {
                                $seller->notify(new LowStockNotification($product));
                            }
                        } catch (\Exception $e) {
                            Log::error("Low stock notification alert failed: " . $e->getMessage());
                        }
                    }
                }
            }

            $clientSecret = null;
            if ($checkoutData->paymentMethod === 'Credit Card') {
                $stripeSecret = config('services.stripe.secret') ?: env('STRIPE_SECRET_KEY');
                $stripeAmount = convert_money($totalAmount, $orderCurrency, $displayCurrency);
                if ($stripeSecret) {
                    try {
                        Stripe::setApiKey($stripeSecret);
                        $intent = PaymentIntent::create([
                            'amount' => (int) round($stripeAmount * 100),
                            'currency' => strtolower($displayCurrency),
                            'metadata' => [
                                'order_id' => $order->id,
                                'buyer_id' => $buyer->id,
                                'currency' => $displayCurrency,
                                'base_currency' => $orderCurrency,
                            ],
                        ]);
                        $order->update(['stripe_payment_intent_id' => $intent->id]);
                        $clientSecret = $intent->client_secret;
                        $requiresPaymentConfirmation = true;
                    } catch (\Exception $e) {
                        Log::error("Stripe PaymentIntent creation failed: " . $e->getMessage());
                        $mockIntentId = 'pi_mock_' . uniqid();
                        $order->update(['stripe_payment_intent_id' => $mockIntentId]);
                        $clientSecret = $mockIntentId . '_secret_' . uniqid();
                    }
                } else {
                    $mockIntentId = 'pi_mock_' . uniqid();
                    $order->update(['stripe_payment_intent_id' => $mockIntentId]);
                    $clientSecret = $mockIntentId . '_secret_' . uniqid();
                }

                if (! $requiresPaymentConfirmation) {
                    $order->update(['status' => OrderStatus::Processing]);
                }
            }

            $loadedOrder = $order->load(['buyer', 'items.product']);
            if ($loadedOrder->status === OrderStatus::Processing) {
                event(new OrderPlaced($loadedOrder));
            }

            return [
                'order' => $loadedOrder,
                'client_secret' => $clientSecret,
                'requires_payment_confirmation' => $requiresPaymentConfirmation,
            ];
        });
    }

    private function extractBuyerZipCode(string $shippingAddress): string
    {
        $zipPattern = '/\b\d{5}(?:-\d{4})?\b/';
        preg_match($zipPattern, $shippingAddress, $matches);

        return $matches[0] ?? '10001';
    }

}
