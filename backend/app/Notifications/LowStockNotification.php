<?php

namespace App\Notifications;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LowStockNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Product $product,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject("Inventory Alert: Low Stock Warning for '{$this->product->name}'")
            ->greeting("Hi {$notifiable->name},")
            ->line("Product '{$this->product->name}' (SKU: {$this->product->sku}) has reached its low stock warning threshold.")
            ->line("Current quantity: {$this->product->stock_quantity}")
            ->line("Low Stock Threshold: {$this->product->low_stock_amount}")
            ->line('Please update your inventory to restore stock availability.');
    }
}
