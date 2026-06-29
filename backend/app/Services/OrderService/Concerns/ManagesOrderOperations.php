<?php

namespace App\Services\OrderService\Concerns;

use App\Models\Order;
use App\Models\User;
use App\Exceptions\ServiceException;
use App\Services\InventoryService\ManageStockMovement;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;

trait ManagesOrderOperations
{
    protected function resolveStripeEvent(string $payload, ?string $signature): object
    {
        $endpointSecret = config('services.stripe.webhook_secret') ?: env('STRIPE_WEBHOOK_SECRET');

        if ($endpointSecret && $signature) {
            try {
                return Webhook::constructEvent($payload, $signature, $endpointSecret);
            } catch (\UnexpectedValueException) {
                throw ServiceException::badRequest('Invalid payload');
            } catch (\Stripe\Exception\SignatureVerificationException) {
                throw ServiceException::badRequest('Invalid signature');
            }
        }

        $data = json_decode($payload, true);
        $mockData = [
            'type' => $data['type'] ?? 'payment_intent.succeeded',
            'data' => [
                'object' => [
                    'id' => $data['data']['object']['id'] ?? $data['id'] ?? 'pi_mock_123',
                    'metadata' => [
                        'order_id' => $data['data']['object']['metadata']['order_id'] ?? $data['metadata']['order_id'] ?? null,
                    ],
                ],
            ],
        ];

        return json_decode(json_encode($mockData));
    }

    protected function restockOrderItems(Order $order): void
    {
        App::make(ManageStockMovement::class)->restockReturnedOrder($order);
    }

    protected function issueStripeRefund(Order $order, string $logPrefix): void
    {
        if (! $order->stripe_payment_intent_id) {
            return;
        }

        $stripeSecret = config('services.stripe.secret') ?: env('STRIPE_SECRET_KEY');

        if (! $stripeSecret || str_starts_with($order->stripe_payment_intent_id, 'pi_mock_')) {
            return;
        }

        try {
            \Stripe\Stripe::setApiKey($stripeSecret);
            \Stripe\Refund::create([
                'payment_intent' => $order->stripe_payment_intent_id,
            ]);
        } catch (\Exception $exception) {
            Log::error($logPrefix . ': ' . $exception->getMessage());
        }
    }

    protected function buildShipmentPayload(Order $order, User $seller): array
    {
        $weight = 0.0;
        $orderItems = [];
        $sourceCurrency = $order->currency ?: base_money_currency();
        $shippingCurrency = currency_for_country($order->country);

        foreach ($order->items as $item) {
            $product = $item->product;
            $weight += (float) ($product->weight_kg ?: 0.5) * $item->quantity;
            $orderItems[] = [
                'name' => $product->name,
                'sku' => $product->sku ?: 'SKU-' . $product->id,
                'units' => $item->quantity,
                'selling_price' => convert_money((float) $item->price, $item->currency ?: $sourceCurrency, $shippingCurrency),
            ];
        }

        return [
            'order_id' => $order->id,
            'order_date' => $order->created_at->format('Y-m-d H:i'),
            'pickup_location' => $seller->brand_name ?: 'Seller Hub',
            'billing_customer_name' => $order->buyer->name ?? 'Customer',
            'billing_last_name' => '',
            'billing_address' => $order->billing_address,
            'billing_city' => $order->city ?: 'Ahmedabad',
            'billing_pincode' => $order->postal_code ?: '380001',
            'billing_state' => $order->state ?: 'Gujarat',
            'billing_country' => $order->country ?: 'India',
            'billing_email' => $order->buyer->email ?? '',
            'billing_phone' => $order->buyer_phone ?: ($order->buyer->phone ?? '9999999999'),
            'shipping_is_billing' => true,
            'order_items' => $orderItems,
            'payment_method' => $order->payment_method === 'COD' ? 'COD' : 'Prepaid',
            'sub_total' => convert_money((float) $order->total_amount, $sourceCurrency, $shippingCurrency),
            'length' => 10,
            'width' => 10,
            'height' => 10,
            'weight' => $weight,
        ];
    }

    protected function formatCurrency(float $amount, ?string $currency = null, ?string $locale = null): string
    {
        return format_money($amount, $currency, $locale);
    }
}
