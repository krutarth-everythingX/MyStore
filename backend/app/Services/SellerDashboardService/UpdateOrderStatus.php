<?php

namespace App\Services\SellerDashboardService;

use App\Enums\OrderStatus;
use App\Jobs\SendOrderShippedNotificationJob;
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;

class UpdateOrderStatus
{
    public function handle(Order $order, array $fields, int $sellerId): Order
    {
        $oldStatus = $order->status;

        $order->update([
            'status' => OrderStatus::from($fields['status']),
            'shipping_carrier' => $fields['shipping_carrier'] ?? $order->shipping_carrier,
            'tracking_number' => $fields['tracking_number'] ?? $order->tracking_number,
        ]);

        if ($order->status === OrderStatus::Shipped && $oldStatus !== OrderStatus::Shipped) {
            SendOrderShippedNotificationJob::dispatch($order->id);
        }

        return $order->load([
            'buyer',
            'items' => function (Builder $query) use ($sellerId) {
                $query->where('seller_id', $sellerId)->with('product');
            },
        ]);
    }
}
