<?php

namespace App\Services\OrderService;

use App\Exceptions\ServiceException;
use App\Models\Order;

class RejectReturnRequest
{
    public function handle(Order $order, ?string $reviewNote = null): Order
    {
        if ($order->return_request_status !== 'requested') {
            throw ServiceException::badRequest('No buyer return request is pending for this order.');
        }

        $order->forceFill([
            'return_request_status' => 'rejected',
            'return_review_note' => $reviewNote,
            'return_reviewed_at' => now(),
        ])->save();

        return $order->fresh(['buyer', 'items.product']);
    }
}
