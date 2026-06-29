<?php

namespace App\Services\SellerDashboardService;

use App\Services\SellerDashboardService\ListOrdersForSeller;

class BuildOrderExportRows
{
    public function headings(): array
    {
        return [
            'Order ID',
            'Buyer Name',
            'Buyer Email',
            'Order Date',
            'Status',
            'Refund Status',
            'Payment Method',
            'Shipping Carrier',
            'Tracking Number',
            'Shipping Address',
            'Product SKU',
            'Product Name',
            'Quantity',
            'Item Price',
            'Subtotal',
        ];
    }

    public function __construct(private readonly ListOrdersForSeller $listOrdersForSeller)
    {
    }

    public function handle(int $sellerId): array
    {
        $rows = [];

        foreach ($this->listOrdersForSeller->handle($sellerId) as $order) {
            foreach ($order->items as $item) {
                $rows[] = [
                    $order->id,
                    $order->buyer->name ?? 'N/A',
                    $order->buyer->email ?? 'N/A',
                    $order->created_at->toDateTimeString(),
                    $order->status?->value,
                    $order->refund_status ?? 'None',
                    $order->payment_method,
                    $order->shipping_carrier ?? 'N/A',
                    $order->tracking_number ?? 'N/A',
                    $order->shipping_address,
                    $item->product->sku ?? 'N/A',
                    $item->product->name ?? 'Removed Product',
                    $item->quantity,
                    $item->price,
                    round($item->price * $item->quantity, 2),
                ];
            }
        }

        return $rows;
    }
}
