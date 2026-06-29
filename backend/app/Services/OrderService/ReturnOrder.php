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

    public function handle(Order $order, ?string $reviewNote = null): Order
    {
        $order->loadMissing('items.product');

        if ($order->return_request_status !== 'requested') {
            throw ServiceException::badRequest('No buyer return request is pending for this order.');
        }

        if ($order->refund_status === 'refunded') {
            throw ServiceException::badRequest('This order has already been refunded.');
        }

        return DB::transaction(function () use ($order, $reviewNote) {
            $this->restockOrderItems($order);

            $order->forceFill([
                'status' => OrderStatus::Cancelled,
                'refund_status' => 'refunded',
                'return_request_status' => 'approved',
                'return_review_note' => $reviewNote,
                'return_reviewed_at' => now(),
            ])->save();

            $this->issueStripeRefund($order, 'Stripe Return Refund failed');

            return $order->load('items.product');
        });
    }
}
