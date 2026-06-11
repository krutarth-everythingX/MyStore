<?php

namespace App\Services\OrderService;

use App\Enums\OrderStatus;
use App\Events\OrderPlaced;
use App\Models\Order;

class ConfirmOrderPayment
{
    public function handle(Order $order): Order
    {
        if ($order->status === OrderStatus::Pending) {
            $order->update(['status' => OrderStatus::Processing]);
            event(new OrderPlaced($order->loadMissing(['buyer', 'items.product'])));
        }

        return $order->refresh();
    }
}
