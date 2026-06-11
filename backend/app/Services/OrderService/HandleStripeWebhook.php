<?php

namespace App\Services\OrderService;

use App\Models\Order;
use App\Services\OrderService\Concerns\ManagesOrderOperations;
use App\Services\OrderService\ConfirmOrderPayment;

class HandleStripeWebhook
{
    use ManagesOrderOperations;

    public function __construct(private readonly ConfirmOrderPayment $confirmOrderPayment)
    {
    }

    public function handle(string $payload, ?string $signature): void
    {
        $event = $this->resolveStripeEvent($payload, $signature);

        if ($event->type !== 'payment_intent.succeeded') {
            return;
        }

        $paymentIntent = $event->data->object;
        $orderId = $paymentIntent->metadata->order_id ?? null;

        if (! $orderId) {
            return;
        }

        $order = Order::with('buyer')->find($orderId);

        if ($order) {
            $this->confirmOrderPayment->handle($order);
        }
    }
}
