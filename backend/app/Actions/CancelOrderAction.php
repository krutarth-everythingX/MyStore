<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;

class CancelOrderAction
{
    public function handle(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                $product = $item->product;
                if ($product && $product->manage_stock) {
                    $product->stock_quantity += $item->quantity;
                    $product->save();

                    $warehouse = $product->warehouses()->first();
                    if ($warehouse) {
                        $product->warehouses()->updateExistingPivot($warehouse->id, [
                            'quantity' => $warehouse->pivot->quantity + $item->quantity
                        ]);
                    }
                }
            }

            $order->status = OrderStatus::Cancelled;
            $order->refund_status = $order->payment_method === 'Credit Card' ? 'refunded' : null;
            $order->save();

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

            return $order->load('items.product');
        });
    }
}
