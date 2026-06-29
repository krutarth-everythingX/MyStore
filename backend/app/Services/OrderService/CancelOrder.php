<?php

namespace App\Services\OrderService;

use App\Actions\CancelOrderAction;
use App\Enums\OrderStatus;
use App\Exceptions\ServiceException;
use App\Models\Order;

class CancelOrder
{
    public function __construct(private readonly CancelOrderAction $cancelOrderAction)
    {
    }

    public function handle(Order $order, ?string $reason = null, ?string $note = null): Order
    {
        if (! in_array($order->status?->value, OrderStatus::cancellableValues(), true)) {
            throw ServiceException::badRequest('Order cannot be cancelled at this stage.');
        }

        return $this->cancelOrderAction->handle($order, $reason, $note);
    }
}
