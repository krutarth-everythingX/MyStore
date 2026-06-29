<?php

namespace App\Services\OrderService;

use App\Models\Order;

class GenerateShippingSlipHtml
{
    public function handle(Order $order): string
    {
        $order->loadMissing(['buyer', 'items.product.user']);

        $firstItem = $order->items->first();
        $seller = $firstItem?->product?->user;
        $buyer = $order->buyer;
        $itemsCount = $order->items->sum('quantity');
        $shipTo = nl2br(e((string) $order->shipping_address));
        $sellerAddress = nl2br(e((string) ($seller?->address ?? 'Seller address not configured')));
        $status = strtoupper(str_replace('_', ' ', (string) $order->status?->value));
        $orderDate = e((string) to_user_timezone($order->created_at, $buyer, 'd-M-Y h:i A'));
        $carrier = e((string) ($order->shipping_carrier ?: $order->fulfillment_channel ?: 'Seller Fulfilled'));
        $tracking = e((string) ($order->tracking_number ?: 'Will be assigned when shipped'));
        $buyerName = e((string) ($buyer?->name ?: 'Customer'));
        $buyerPhone = e((string) ($order->buyer_phone ?: $buyer?->phone ?: 'Not provided'));
        $sellerName = e((string) ($seller?->brand_name ?: $seller?->name ?: 'MyStore Seller'));
        $invoiceNumber = e((string) ($order->invoice_number ?: "ORD-{$order->id}"));

        $itemRows = '';
        foreach ($order->items as $item) {
            $productName = e((string) ($item->product?->name ?: 'Removed Product'));
            $sku = e((string) ($item->product?->sku ?: 'N/A'));
            $qty = (int) $item->quantity;

            $itemRows .= "
                <tr>
                    <td>{$productName}</td>
                    <td>{$sku}</td>
                    <td class='text-right'>{$qty}</td>
                </tr>
            ";
        }

        return <<<HTML
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Shipping Slip - Order #{$order->id}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 24px;
            font-family: Arial, sans-serif;
            color: #111827;
            background: #f8fafc;
        }
        .sheet {
            max-width: 920px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #dbe4f0;
            border-radius: 18px;
            padding: 28px;
        }
        .head {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            padding-bottom: 18px;
            border-bottom: 2px solid #0f172a;
        }
        .brand {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.02em;
        }
        .muted {
            color: #475569;
            font-size: 13px;
            line-height: 1.6;
        }
        .pill {
            display: inline-block;
            padding: 8px 12px;
            border-radius: 999px;
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-top: 22px;
        }
        .meta-card,
        .address-card,
        .items-card {
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            background: #ffffff;
        }
        .meta-card {
            padding: 14px 16px;
        }
        .meta-label {
            font-size: 10px;
            color: #64748b;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 6px;
        }
        .meta-value {
            font-size: 14px;
            font-weight: 700;
            line-height: 1.45;
        }
        .address-wrap {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 18px;
        }
        .address-card,
        .items-card {
            padding: 18px;
        }
        .address-title,
        .items-title {
            margin: 0 0 10px;
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #0f172a;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px 10px;
            border-bottom: 1px solid #e2e8f0;
            text-align: left;
            font-size: 13px;
        }
        th {
            background: #f8fafc;
            color: #64748b;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }
        .text-right { text-align: right; }
        .footer {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px dashed #cbd5e1;
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: center;
            font-size: 12px;
            color: #475569;
        }
        @media print {
            body {
                background: #ffffff;
                padding: 0;
            }
            .sheet {
                border: 0;
                border-radius: 0;
                padding: 0;
            }
        }
        @media (max-width: 760px) {
            .meta-grid,
            .address-wrap {
                grid-template-columns: 1fr;
            }
            .head,
            .footer {
                flex-direction: column;
                align-items: flex-start;
            }
        }
    </style>
</head>
<body>
    <section class="sheet">
        <header class="head">
            <div>
                <div class="brand">MyStore Shipping Slip</div>
                <div class="muted">Packing and fulfillment document for seller dispatch and buyer delivery confirmation.</div>
            </div>
            <div>
                <span class="pill">{$status}</span>
            </div>
        </header>

        <section class="meta-grid">
            <article class="meta-card">
                <div class="meta-label">Order ID</div>
                <div class="meta-value">#{$order->id}</div>
            </article>
            <article class="meta-card">
                <div class="meta-label">Invoice Ref</div>
                <div class="meta-value">{$invoiceNumber}</div>
            </article>
            <article class="meta-card">
                <div class="meta-label">Carrier</div>
                <div class="meta-value">{$carrier}</div>
            </article>
            <article class="meta-card">
                <div class="meta-label">Tracking</div>
                <div class="meta-value">{$tracking}</div>
            </article>
        </section>

        <section class="meta-grid">
            <article class="meta-card">
                <div class="meta-label">Buyer</div>
                <div class="meta-value">{$buyerName}</div>
            </article>
            <article class="meta-card">
                <div class="meta-label">Buyer Phone</div>
                <div class="meta-value">{$buyerPhone}</div>
            </article>
            <article class="meta-card">
                <div class="meta-label">Order Date</div>
                <div class="meta-value">{$orderDate}</div>
            </article>
            <article class="meta-card">
                <div class="meta-label">Units</div>
                <div class="meta-value">{$itemsCount}</div>
            </article>
        </section>

        <section class="address-wrap">
            <article class="address-card">
                <h2 class="address-title">Ship From</h2>
                <div class="muted"><strong>{$sellerName}</strong><br>{$sellerAddress}</div>
            </article>
            <article class="address-card">
                <h2 class="address-title">Ship To</h2>
                <div class="muted"><strong>{$buyerName}</strong><br>{$shipTo}</div>
            </article>
        </section>

        <section class="items-card" style="margin-top: 18px;">
            <h2 class="items-title">Packed Items</h2>
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th class="text-right">Qty</th>
                    </tr>
                </thead>
                <tbody>
                    {$itemRows}
                </tbody>
            </table>
        </section>

        <footer class="footer">
            <span>This shipping slip can be printed by both buyer and seller for dispatch reference.</span>
            <span>Generated by MyStore</span>
        </footer>
    </section>
</body>
</html>
HTML;
    }
}
