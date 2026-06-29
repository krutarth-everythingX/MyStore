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
        $currency = currency_for_country($notifiable->country);
        $sourceCurrency = $this->order->currency ?: base_money_currency();
        $items = $this->order->items->map(function ($item) use ($currency, $sourceCurrency, $notifiable) {
            return [
                'name' => $item->product?->name ?: 'Removed Product',
                'sku' => $item->product?->sku ?: 'N/A',
                'quantity' => (int) $item->quantity,
                'price' => $this->money((float) $item->price, $item->currency ?: $sourceCurrency, $notifiable->country, $currency),
                'subtotal' => $this->money((float) $item->price * (int) $item->quantity, $item->currency ?: $sourceCurrency, $notifiable->country, $currency),
            ];
        })->all();

        return (new MailMessage())
            ->subject("Your MyStore Order Confirmation - Order #{$this->order->id}")
            ->markdown('emails.order_placed', [
                'name' => $notifiable->name,
                'orderId' => $this->order->id,
                'invoiceNumber' => $this->order->invoice_number,
                'orderDate' => (string) to_user_timezone($this->order->created_at, $notifiable, 'd M Y, h:i A'),
                'total' => $this->money((float) $this->order->total_amount, $sourceCurrency, $notifiable->country, $currency),
                'subtotal' => $this->money((float) $this->order->items->sum(fn ($item) => (float) $item->price * (int) $item->quantity), $sourceCurrency, $notifiable->country, $currency),
                'shippingCost' => $this->money((float) $this->order->shipping_cost, $sourceCurrency, $notifiable->country, $currency),
                'discountAmount' => $this->money((float) $this->order->discount_amount, $sourceCurrency, $notifiable->country, $currency),
                'cgst' => $this->money((float) $this->order->cgst, $sourceCurrency, $notifiable->country, $currency),
                'sgst' => $this->money((float) $this->order->sgst, $sourceCurrency, $notifiable->country, $currency),
                'igst' => $this->money((float) $this->order->igst, $sourceCurrency, $notifiable->country, $currency),
                'paymentMethod' => ucfirst($this->order->payment_method),
                'address' => $this->order->shipping_address,
                'phone' => $this->order->buyer_phone ?: ($this->order->buyer?->phone ?: 'Not provided'),
                'items' => $items,
                'url' => url("/profile/orders/my-orders/{$this->order->id}"),
                'invoiceUrl' => url("/orders/{$this->order->id}/invoice"),
            ]);
    }

    private function money(float $amount, ?string $sourceCurrency, ?string $country, ?string $currency = null): string
    {
        return localized_money_format($amount, $sourceCurrency, $country, $currency);
    }
}
