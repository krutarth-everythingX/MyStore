<?php

namespace App\Services\OrderService;

use App\Enums\OrderStatus;
use App\Exceptions\ServiceException;
use App\Models\Order;

class RequestReturn
{
    public function handle(
        Order $order,
        string $reason,
        ?string $note = null,
        ?string $imageUrl = null,
    ): Order {
        if ($order->status !== OrderStatus::Completed) {
            throw ServiceException::badRequest('Only completed orders can be returned.');
        }

        if ($order->refund_status === 'refunded') {
            throw ServiceException::badRequest('This order has already been refunded.');
        }

        if ($order->return_request_status === 'requested') {
            throw ServiceException::badRequest('A return request is already pending for this order.');
        }

        $order->forceFill([
            'return_request_status' => 'requested',
            'return_request_reason' => $reason,
            'return_request_note' => $note,
            'return_request_image_url' => $imageUrl,
            'return_requested_at' => now(),
            'return_reviewed_at' => null,
            'return_review_note' => null,
        ])->save();

        return $order->fresh(['buyer', 'items.product']);
    }
}
