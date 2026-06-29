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
        $currency = currency_for_country($notifiable->country);
        $sourceCurrency = $this->order->currency ?: base_money_currency();
        $trackingNumber = $this->order->tracking_number ?: 'Awaiting tracking ID';
        $items = $this->order->items->map(function ($item) use ($currency, $sourceCurrency, $notifiable) {
            return [
                'name' => $item->product?->name ?: 'Removed Product',
                'sku' => $item->product?->sku ?: 'N/A',
                'quantity' => (int) $item->quantity,
                'subtotal' => $this->money((float) $item->price * (int) $item->quantity, $item->currency ?: $sourceCurrency, $notifiable->country, $currency),
            ];
        })->all();

        return (new MailMessage())
            ->subject("Your MyStore Order #{$this->order->id} Has Shipped!")
            ->markdown('emails.order_shipped', [
                'name' => $notifiable->name,
                'orderId' => $this->order->id,
                'carrier' => $this->order->shipping_carrier ?: ($this->order->fulfillment_channel ?: 'Seller Fulfilled'),
                'trackingNumber' => $trackingNumber,
                'acceptanceTime' => $this->order->seller_shipping_acceptance_time ?: 'Seller updated shipment',
                'shippingAddress' => $this->order->shipping_address,
                'items' => $items,
                'url' => url('/orders'),
            ]);
    }

    private function money(float $amount, ?string $sourceCurrency, ?string $country, ?string $currency = null): string
    {
        return localized_money_format($amount, $sourceCurrency, $country, $currency);
    }
}
