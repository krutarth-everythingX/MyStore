<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderShippedNotification extends Notification
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
        $trackingNumber = $this->order->tracking_number ?: 'Awaiting tracking ID';
        return (new MailMessage())
            ->subject("Your MyStore Order #{$this->order->id} Has Shipped!")
            ->markdown('emails.order_shipped', [
                'name' => $notifiable->name,
                'orderId' => $this->order->id,
                'carrier' => $this->order->shipping_carrier,
                'trackingNumber' => $trackingNumber,
                'url' => url('/orders'),
            ]);
    }
}
