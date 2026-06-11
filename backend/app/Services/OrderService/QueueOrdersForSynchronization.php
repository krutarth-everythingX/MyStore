<?php

namespace App\Services\OrderService;

use App\Enums\OrderStatus;
use App\Jobs\SyncOrderToShiprocketJob;
use App\Models\Order;

class QueueOrdersForSynchronization
{
    public function handle(): int
    {
        $orders = Order::with(['buyer', 'items.product'])
            ->where('status', OrderStatus::Processing->value)
            ->whereNull('tracking_number')
            ->get();

        foreach ($orders as $order) {
            SyncOrderToShiprocketJob::dispatch($order->id);
        }

        return $orders->count();
    }
}
