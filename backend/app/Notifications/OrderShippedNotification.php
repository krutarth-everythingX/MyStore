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
        return (new MailMessage())
            ->subject("Your MyStore Order #{$this->order->id} Has Shipped!")
            ->greeting("Hi {$notifiable->name},")
            ->line("Great news! Your order #{$this->order->id} has been shipped via {$this->order->shipping_carrier}.")
            ->line('Tracking Number: ' . ($this->order->tracking_number ?: 'Awaiting tracking ID'))
            ->line('You can track the package status directly inside your MyStore orders history portal.');
    }
}
