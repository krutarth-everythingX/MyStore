<?php

namespace App\Jobs;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use App\Services\ShiprocketService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncOrderToShiprocketJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $orderId,
    ) {
    }

    public function handle(ShiprocketService $shiprocket): void
    {
        $order = Order::with(['buyer', 'items.product'])->find($this->orderId);

        if (!$order || $order->status !== OrderStatus::Processing || $order->tracking_number) {
            return;
        }

        $firstItem = $order->items->first();
        $seller = $firstItem ? User::find($firstItem->product->user_id) : null;
        if (!$seller) {
            return;
        }

        $weight = 0.0;
        $orderItems = [];

        foreach ($order->items as $item) {
            $product = $item->product;
            $weight += (float) ($product->weight_kg ?: 0.5) * $item->quantity;
            $orderItems[] = [
                'name' => $product->name,
                'sku' => $product->sku ?: 'SKU-' . $product->id,
                'units' => $item->quantity,
                'selling_price' => $item->price,
            ];
        }

        $payload = [
            'order_id' => $order->id,
            'order_date' => $order->created_at->format('Y-m-d H:i'),
            'pickup_location' => $seller->brand_name ?: 'Seller Hub',
            'billing_customer_name' => $order->buyer->name,
            'billing_last_name' => '',
            'billing_address' => $order->billing_address,
            'billing_city' => $order->city ?: 'Ahmedabad',
            'billing_pincode' => $order->postal_code ?: '380001',
            'billing_state' => $order->state ?: 'Gujarat',
            'billing_country' => $order->country ?: 'India',
            'billing_email' => $order->buyer->email,
            'billing_phone' => $order->buyer_phone ?: '9999999999',
            'shipping_is_billing' => true,
            'order_items' => $orderItems,
            'payment_method' => $order->payment_method === 'COD' ? 'COD' : 'Prepaid',
            'sub_total' => $order->total_amount,
            'length' => 10,
            'width' => 10,
            'height' => 10,
            'weight' => $weight,
        ];

        $token = ($seller->shiprocket_email && $seller->shiprocket_password)
            ? $shiprocket->authenticate($seller->shiprocket_email, $seller->shiprocket_password)
            : null;

        $syncRes = $shiprocket->createAdhocOrder($payload, $token);

        if (!$syncRes['success']) {
            return;
        }

        $labelUrl = $shiprocket->generateLabel((string) $syncRes['shipment_id'], $token);

        $order->update([
            'status' => OrderStatus::Shipped,
            'tracking_number' => $syncRes['awb_code'],
            'shipping_label_url' => $labelUrl,
            'tracking_url' => 'https://www.shiprocket.in/tracking/' . $syncRes['awb_code'],
            'shipping_carrier' => 'Shiprocket',
        ]);

        SendOrderShippedNotificationJob::dispatch($order->id);
    }
}
