<?php

namespace App\Jobs;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncOrderToShiprocketJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $orderId,
    ) {
    }

    public function handle(): void
    {
        $order = Order::with(['items.product'])->find($this->orderId);

        if (! $order || $order->status !== OrderStatus::Processing || $order->tracking_number) {
            return;
        }

        $firstItem = $order->items->first();
        $seller = $firstItem ? User::find($firstItem->product?->user_id) : null;

        if (! $seller) {
            return;
        }

        $channel = $seller->default_fulfillment_channel ?: 'Seller Fulfilled';

        $order->update([
            'fulfillment_channel' => $channel,
            'shipping_carrier' => $order->shipping_carrier ?: $channel,
            'seller_shipping_acceptance_time' => $seller->shipping_acceptance_time,
        ]);
    }
}
