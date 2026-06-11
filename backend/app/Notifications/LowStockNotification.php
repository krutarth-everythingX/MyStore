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
            ->error()
            ->subject("Inventory Alert: Low Stock Warning for '{$this->product->name}'")
            ->markdown('emails.low_stock', [
                'name' => $notifiable->name,
                'productName' => $this->product->name,
                'sku' => $this->product->sku,
                'stockQuantity' => $this->product->stock_quantity,
                'lowStockAmount' => $this->product->low_stock_amount,
                'url' => url('/seller/inventory'),
            ]);
    }
}
