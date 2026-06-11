<?php

namespace App\Services\OrderService;

use App\Enums\OrderStatus;
use App\Exceptions\ServiceException;
use App\Models\Order;
use App\Services\OrderService\Concerns\ManagesOrderOperations;
use Illuminate\Support\Facades\DB;

class ReturnOrder
{
    use ManagesOrderOperations;

    public function handle(Order $order): Order
    {
        $order->loadMissing('items.product');

        if ($order->status !== OrderStatus::Completed) {
            throw ServiceException::badRequest('Only completed orders can be returned.');
        }

        if ($order->refund_status === 'refunded') {
            throw ServiceException::badRequest('This order has already been refunded.');
        }

        return DB::transaction(function () use ($order) {
            $this->restockOrderItems($order);

            $order->forceFill([
                'status' => OrderStatus::Cancelled,
                'refund_status' => 'refunded',
            ])->save();

            $this->issueStripeRefund($order, 'Stripe Return Refund failed');

            return $order->load('items.product');
        });
    }
}
