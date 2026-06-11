<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderPlacedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Order $order,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject("Your MyStore Order Confirmation - Order #{$this->order->id}")
            ->markdown('emails.order_placed', [
                'name' => $notifiable->name,
                'orderId' => $this->order->id,
                'total' => $this->order->total_amount,
                'paymentMethod' => ucfirst($this->order->payment_method),
                'address' => $this->order->shipping_address,
                'url' => url('/orders'),
            ]);
    }
}
