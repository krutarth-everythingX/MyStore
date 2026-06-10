<?php

namespace App\Jobs;

use App\Models\Order;
use App\Notifications\OrderShippedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendOrderShippedNotificationJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $orderId,
    ) {
    }

    public function handle(): void
    {
        $order = Order::with('buyer', 'items.product')->find($this->orderId);

        if (!$order || !$order->buyer) {
            return;
        }

        $order->buyer->notify(new OrderShippedNotification($order));
    }
}
