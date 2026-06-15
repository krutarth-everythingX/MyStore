<?php

namespace App\Services\OrderService;

use App\Enums\OrderStatus;
use App\Exceptions\ServiceException;
use App\Jobs\SendOrderShippedNotificationJob;
use App\Models\Order;
use App\Models\User;
use App\Services\InventoryService\ManageStockMovement;

class ShipOrder
{
    public function __construct(private readonly ManageStockMovement $manageStockMovement)
    {
    }

    public function handle(Order $order, User $seller): Order
    {
        $order->loadMissing(['buyer', 'items.product']);

        if ($order->status !== OrderStatus::Processing) {
            throw ServiceException::badRequest('Only processing orders can be shipped');
        }

        $channel = $seller->default_fulfillment_channel ?: 'Seller Fulfilled';

        $order->update([
            'status' => OrderStatus::Shipped,
            'shipping_carrier' => $channel,
            'fulfillment_channel' => $channel,
            'seller_shipping_acceptance_time' => $seller->shipping_acceptance_time,
        ]);

        $this->manageStockMovement->shipOrderReservations($order);

        SendOrderShippedNotificationJob::dispatch($order->id);

        return $order->load(['buyer', 'items.product']);
    }
}
