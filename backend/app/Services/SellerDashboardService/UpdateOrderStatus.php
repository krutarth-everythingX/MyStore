<?php

namespace App\Services\SellerDashboardService;

use App\Enums\OrderStatus;
use App\Jobs\SendOrderShippedNotificationJob;
use App\Models\Order;
use App\Services\InventoryService\ManageStockMovement;
use Illuminate\Database\Eloquent\Builder;

class UpdateOrderStatus
{
    public function __construct(private readonly ManageStockMovement $manageStockMovement)
    {
    }

    public function handle(Order $order, array $fields, int $sellerId): Order
    {
        $oldStatus = $order->status;

        $order->update([
            'status' => OrderStatus::from($fields['status']),
            'shipping_carrier' => $fields['shipping_carrier']
                ?? $fields['fulfillment_channel']
                ?? $order->shipping_carrier,
            'tracking_number' => $fields['tracking_number'] ?? $order->tracking_number,
            'fulfillment_channel' => $fields['fulfillment_channel']
                ?? $fields['shipping_carrier']
                ?? $order->fulfillment_channel,
            'seller_shipping_acceptance_time' => $fields['seller_shipping_acceptance_time']
                ?? $order->seller_shipping_acceptance_time,
        ]);

        if ($order->status === OrderStatus::Shipped && $oldStatus !== OrderStatus::Shipped) {
            $this->manageStockMovement->shipOrderReservations($order);
            SendOrderShippedNotificationJob::dispatch($order->id);
        }

        return $order->load([
            'buyer',
            'items' => function ($query) use ($sellerId) {
                $query->where('seller_id', $sellerId)->with('product');
            },
        ]);
    }
}
