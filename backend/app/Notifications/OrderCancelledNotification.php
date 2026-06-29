<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderCancelledNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Order $order,
        public string $reason,
        public ?string $note = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject("Order #{$this->order->id} was cancelled by the buyer")
            ->markdown('emails.order_cancelled', [
                'sellerName' => $notifiable->name,
                'buyerName' => $this->order->buyer?->name ?: 'Buyer',
                'orderId' => $this->order->id,
                'reason' => $this->reason,
                'note' => $this->note,
                'cancelledAt' => optional($this->order->cancelled_at)?->format('d M Y, h:i A'),
                'orderUrl' => url('/seller/orders'),
            ]);
    }
}
