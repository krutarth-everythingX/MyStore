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
            ->greeting("Hi {$notifiable->name},")
            ->line("Thank you for shopping at MyStore! Your order #{$this->order->id} has been received.")
            ->line("Total Amount: \${$this->order->total_amount}")
            ->line("Payment Method: {$this->order->payment_method}")
            ->line("Shipping Address: {$this->order->shipping_address}")
            ->line('We will notify you once your package is shipped.');
    }
}
