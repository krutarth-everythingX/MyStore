<?php

namespace App\Services\OrderService;

use App\Models\Order;
use App\Models\User;
use App\Services\OrderService\Concerns\ManagesOrderOperations;

class GenerateInvoiceHtml
{
    use ManagesOrderOperations;

    public function handle(Order $order, ?User $viewer = null): string
    {
        $order->loadMissing(['buyer', 'items.product.user']);

        $firstItem = $order->items->first();
        $seller = $firstItem?->product?->user;
        $viewer ??= $order->buyer;
        $subtotal = $order->items->sum(fn ($item) => (float) $item->price * $item->quantity);
        $sourceCurrency = $order->currency ?: ($firstItem?->currency ?: base_money_currency());
        $viewerCountry = country_name_for($viewer?->country ?: $order->country);
        $currency = currency_for_country($viewerCountry);
        $locale = locale_for_country($viewerCountry);

        $sellerName = e((string) ($seller?->brand_name ?: 'MyStore Seller'));
        $sellerAddressPlain = trim((string) ($seller?->address ?? 'Seller address not configured'));
        $sellerAddress = nl2br(e($sellerAddressPlain));
        $sellerGstin = e((string) ($seller?->gst_number ?: 'Not Configured'));
        $sellerPhone = e((string) ($seller?->phone ?? 'Not available'));
        $sellerEmail = e((string) ($seller?->email ?? 'Not available'));

        $buyerName = e((string) ($order->buyer?->name ?? 'Customer'));
        $buyerPhone = e((string) ($order->buyer_phone ?: ($order->buyer?->phone ?? '')));
        $buyerEmail = e((string) ($order->buyer?->email ?? ''));
        $buyerGstin = e((string) ($order->buyer_gstin ?? ''));
        $companyName = e((string) ($order->company_name ?? ''));
        $shippingAddressPlain = trim((string) $order->shipping_address);
        $billingAddressPlain = trim((string) ($order->billing_address ?: $order->shipping_address));
        $shippingAddress = nl2br(e($shippingAddressPlain));
        $billingAddress = nl2br(e($billingAddressPlain));

        $invoiceNumber = e((string) ($order->invoice_number ?: "INV-{$order->id}"));
        $orderDate = e((string) to_user_timezone($order->created_at, $viewer, 'd M Y, h:i A'));
        $orderId = e((string) $order->id);
        $paymentMethod = e((string) ($order->payment_method ?: 'Not specified'));
        $shippingCarrier = e((string) ($order->shipping_carrier ?: 'Standard delivery'));
        $placeOfSupply = e(trim(($order->state ?: '') . ($order->country ? ", {$order->country}" : '')));
        $supplyStateCode = e((string) ($order->postal_code ?: 'N/A'));

        $shippingCostValue = (float) $order->shipping_cost;
        $discountValue = (float) $order->discount_amount;
        $cgstValue = (float) $order->cgst;
        $sgstValue = (float) $order->sgst;
        $igstValue = (float) $order->igst;
        $grandTotalValue = (float) $order->total_amount;
        $taxableValue = max(0, $subtotal + $shippingCostValue - $discountValue);
        $taxTotalValue = $cgstValue + $sgstValue + $igstValue;

        $shippingCost = $this->formatCurrency(convert_money($shippingCostValue, $sourceCurrency, $currency), $currency, $locale);
        $discountAmount = $this->formatCurrency(convert_money($discountValue, $sourceCurrency, $currency), $currency, $locale);
        $totalAmount = $this->formatCurrency(convert_money($grandTotalValue, $sourceCurrency, $currency), $currency, $locale);
        $subtotalAmount = $this->formatCurrency(convert_money((float) $subtotal, $sourceCurrency, $currency), $currency, $locale);
        $taxableAmount = $this->formatCurrency(convert_money($taxableValue, $sourceCurrency, $currency), $currency, $locale);
        $taxAmount = $this->formatCurrency(convert_money($taxTotalValue, $sourceCurrency, $currency), $currency, $locale);

        $itemRows = '';
        foreach ($order->items as $index => $item) {
            $productName = e((string) ($item->product?->name ?: 'Removed Product'));
            $sku = e((string) ($item->product?->sku ?: 'N/A'));
            $qty = (int) $item->quantity;
            $unitPriceValue = (float) $item->price;
            $lineTotalValue = $unitPriceValue * $qty;

            $itemSourceCurrency = $item->currency ?: $sourceCurrency;
            $unitPrice = $this->formatCurrency(convert_money($unitPriceValue, $itemSourceCurrency, $currency), $currency, $locale);
            $itemTotal = $this->formatCurrency(convert_money($lineTotalValue, $itemSourceCurrency, $currency), $currency, $locale);

            $itemRows .= "
                <tr>
                    <td class='cell-center'>" . ($index + 1) . "</td>
                    <td>
                        <div class='item-name'>{$productName}</div>
                        <div class='item-meta'>SKU / HSN: {$sku}</div>
                    </td>
                    <td class='cell-right'>{$unitPrice}</td>
                    <td class='cell-center'>{$qty}</td>
                    <td class='cell-right'>{$itemTotal}</td>
                </tr>
            ";
        }

        $taxBreakupRows = '';
        if ($cgstValue > 0 || $sgstValue > 0) {
            $taxBreakupRows .= "
                <tr>
                    <td>CGST</td>
                    <td class='cell-center'>9%</td>
                    <td class='cell-right'>" . $this->formatCurrency(convert_money($cgstValue, $sourceCurrency, $currency), $currency, $locale) . "</td>
                </tr>
                <tr>
                    <td>SGST</td>
                    <td class='cell-center'>9%</td>
                    <td class='cell-right'>" . $this->formatCurrency(convert_money($sgstValue, $sourceCurrency, $currency), $currency, $locale) . "</td>
                </tr>
            ";
        }

        if ($igstValue > 0) {
            $taxBreakupRows .= "
                <tr>
                    <td>IGST</td>
                    <td class='cell-center'>18%</td>
                    <td class='cell-right'>" . $this->formatCurrency(convert_money($igstValue, $sourceCurrency, $currency), $currency, $locale) . "</td>
                </tr>
            ";
        }

        if ($taxBreakupRows === '') {
            $taxBreakupRows = "
                <tr>
                    <td>Tax</td>
                    <td class='cell-center'>0%</td>
                    <td class='cell-right'>" . $this->formatCurrency(0, $currency, $locale) . "</td>
                </tr>
            ";
        }

        $discountRow = '';
        if ($discountValue > 0) {
            $discountRow = "
                <tr>
                    <td>Discount</td>
                    <td class='cell-right accent-negative'>-{$discountAmount}</td>
                </tr>
            ";
        }

        $companyBlock = $companyName !== ''
            ? "<div class='detail-row'><span>Company</span><strong>{$companyName}</strong></div>"
            : '';

        $buyerTaxBlock = $buyerGstin !== ''
            ? "<div class='detail-row'><span>GSTIN</span><strong>{$buyerGstin}</strong></div>"
            : '';

        return <<<HTML
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Tax Invoice - {$invoiceNumber}</title>
    <style>
        * { box-sizing: border-box; }
        :root {
            --ink: #14213d;
            --muted: #5f6c80;
            --line: #cfd8e3;
            --soft: #eef3f8;
            --soft-2: #f8fafc;
            --accent: #0f4c81;
            --accent-2: #eaf4ff;
            --danger: #b42318;
        }
        body {
            margin: 0;
            background: #edf2f7;
            color: var(--ink);
            font-family: "Segoe UI", Arial, sans-serif;
            font-size: 13px;
            line-height: 1.45;
            padding: 20px;
        }
        .invoice {
            max-width: 1080px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #b9c7d6;
            box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
        }
        .topbar {
            height: 12px;
            background: linear-gradient(90deg, #123c69 0%, #0f4c81 55%, #3282b8 100%);
        }
        .header {
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
            gap: 18px;
            padding: 24px 26px 20px;
            border-bottom: 1px solid var(--line);
        }
        .eyebrow {
            display: inline-block;
            margin-bottom: 8px;
            color: var(--accent);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
        }
        .title {
            margin: 0;
            font-size: 31px;
            font-weight: 800;
            letter-spacing: 0.02em;
            color: #111827;
        }
        .subtitle {
            margin: 8px 0 0;
            max-width: 640px;
            color: var(--muted);
            font-size: 12px;
        }
        .seller-panel {
            border: 1px solid var(--line);
            background: var(--soft-2);
            padding: 16px 18px;
        }
        .seller-panel h2 {
            margin: 0 0 8px;
            font-size: 17px;
            font-weight: 800;
        }
        .seller-panel .mini {
            color: var(--muted);
            font-size: 12px;
            line-height: 1.6;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            border-bottom: 1px solid var(--line);
        }
        .meta-box {
            min-height: 82px;
            padding: 14px 16px;
            border-right: 1px solid var(--line);
        }
        .meta-box:last-child {
            border-right: 0;
        }
        .meta-label {
            color: var(--muted);
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.11em;
            text-transform: uppercase;
            margin-bottom: 7px;
        }
        .meta-value {
            color: #111827;
            font-size: 14px;
            font-weight: 700;
        }
        .party-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            border-bottom: 1px solid var(--line);
        }
        .party-box {
            padding: 18px 20px;
            min-height: 185px;
        }
        .party-box + .party-box {
            border-left: 1px solid var(--line);
        }
        .section-label {
            margin: 0 0 12px;
            color: var(--accent);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
        }
        .party-name {
            font-size: 16px;
            font-weight: 800;
            margin-bottom: 8px;
        }
        .party-address {
            color: #223046;
            line-height: 1.65;
            margin-bottom: 12px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            padding: 4px 0;
            border-bottom: 1px dashed #dbe3ec;
        }
        .detail-row:last-child {
            border-bottom: 0;
        }
        .detail-row span {
            color: var(--muted);
        }
        .detail-row strong {
            color: #0f172a;
            text-align: right;
        }
        .body-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.8fr);
            gap: 0;
        }
        .table-wrap {
            border-right: 1px solid var(--line);
        }
        .block-title {
            padding: 14px 18px;
            background: var(--soft);
            border-bottom: 1px solid var(--line);
            color: #0f172a;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.11em;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px 14px;
            border-bottom: 1px solid #dde6ef;
            vertical-align: top;
        }
        th {
            background: #fbfdff;
            color: var(--muted);
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }
        td {
            font-size: 12px;
            color: #162335;
        }
        .cell-right {
            text-align: right;
            white-space: nowrap;
        }
        .cell-center {
            text-align: center;
            white-space: nowrap;
        }
        .item-name {
            font-size: 13px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 3px;
        }
        .item-meta {
            color: var(--muted);
            font-size: 11px;
        }
        .side-panel {
            display: grid;
            grid-template-rows: auto auto 1fr;
        }
        .totals-card,
        .tax-card,
        .notes-card {
            border-bottom: 1px solid var(--line);
        }
        .totals-table td,
        .tax-table td,
        .tax-table th {
            padding: 10px 14px;
        }
        .totals-table td:first-child {
            color: var(--muted);
            font-weight: 600;
        }
        .totals-table td:last-child {
            font-weight: 700;
            text-align: right;
        }
        .grand-row td {
            background: var(--accent-2);
            color: #0f172a;
            font-size: 16px;
            font-weight: 800;
            border-top: 2px solid #9ec5eb;
        }
        .accent-negative {
            color: var(--danger);
        }
        .notes-card {
            padding: 16px 18px;
            background: #fff;
        }
        .notes-card p {
            margin: 0 0 10px;
            color: #314155;
            font-size: 12px;
            line-height: 1.7;
        }
        .signature {
            margin-top: 22px;
            text-align: right;
        }
        .signature-line {
            width: 170px;
            margin-left: auto;
            border-top: 1px solid #8ea0b6;
            padding-top: 8px;
            color: var(--muted);
            font-size: 11px;
        }
        .footer {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 18px;
            background: #f8fafc;
            color: var(--muted);
            font-size: 11px;
        }
        .footer strong {
            color: #243244;
        }
        @media print {
            body {
                padding: 0;
                background: #fff;
            }
            .invoice {
                box-shadow: none;
                border: 0;
            }
        }
        @media (max-width: 860px) {
            .header,
            .body-grid,
            .party-grid,
            .meta-grid {
                grid-template-columns: 1fr;
            }
            .meta-box,
            .party-box,
            .table-wrap {
                border-right: 0;
                border-left: 0;
            }
            .meta-box,
            .party-box + .party-box {
                border-top: 1px solid var(--line);
            }
            .footer {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <section class="invoice">
        <div class="topbar"></div>

        <header class="header">
            <div>
                <span class="eyebrow">Tax Invoice</span>
                <h1 class="title">TAX INVOICE</h1>
                <p class="subtitle">Original for recipient. Generated for tax compliance, settlement, fulfillment tracking, and customer purchase records.</p>
            </div>

            <aside class="seller-panel">
                <h2>{$sellerName}</h2>
                <div class="mini">{$sellerAddress}</div>
                <div class="mini" style="margin-top: 8px;"><strong>GSTIN:</strong> {$sellerGstin}</div>
                <div class="mini"><strong>Email:</strong> {$sellerEmail}</div>
                <div class="mini"><strong>Phone:</strong> {$sellerPhone}</div>
            </aside>
        </header>

        <section class="meta-grid">
            <article class="meta-box">
                <div class="meta-label">Invoice Number</div>
                <div class="meta-value">{$invoiceNumber}</div>
            </article>
            <article class="meta-box">
                <div class="meta-label">Invoice Date</div>
                <div class="meta-value">{$orderDate}</div>
            </article>
            <article class="meta-box">
                <div class="meta-label">Order Reference</div>
                <div class="meta-value">#{$orderId}</div>
            </article>
            <article class="meta-box">
                <div class="meta-label">Place of Supply</div>
                <div class="meta-value">{$placeOfSupply}</div>
            </article>
        </section>

        <section class="party-grid">
            <article class="party-box">
                <h2 class="section-label">Supplier / Seller</h2>
                <div class="party-name">{$sellerName}</div>
                <div class="party-address">{$sellerAddress}</div>
                <div class="detail-row"><span>GSTIN</span><strong>{$sellerGstin}</strong></div>
                <div class="detail-row"><span>Order ID</span><strong>#{$orderId}</strong></div>
                <div class="detail-row"><span>Shipping Carrier</span><strong>{$shippingCarrier}</strong></div>
                <div class="detail-row"><span>Payment Method</span><strong>{$paymentMethod}</strong></div>
            </article>

            <article class="party-box">
                <h2 class="section-label">Bill To / Ship To</h2>
                <div class="party-name">{$buyerName}</div>
                <div class="party-address">{$billingAddress}</div>
                <div class="detail-row"><span>Shipping Address</span><strong style="white-space: normal;">{$shippingAddress}</strong></div>
                <div class="detail-row"><span>Phone</span><strong>{$buyerPhone}</strong></div>
                <div class="detail-row"><span>Email</span><strong>{$buyerEmail}</strong></div>
                {$companyBlock}
                {$buyerTaxBlock}
            </article>
        </section>

        <section class="body-grid">
            <div class="table-wrap">
                <div class="block-title">Item Details</div>
                <table>
                    <thead>
                        <tr>
                            <th class="cell-center" style="width: 56px;">#</th>
                            <th>Item Description</th>
                            <th class="cell-right" style="width: 140px;">Unit Price</th>
                            <th class="cell-center" style="width: 80px;">Qty</th>
                            <th class="cell-right" style="width: 150px;">Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {$itemRows}
                    </tbody>
                </table>
            </div>

            <aside class="side-panel">
                <section class="totals-card">
                    <div class="block-title">Invoice Summary</div>
                    <table class="totals-table">
                        <tbody>
                            <tr>
                                <td>Items Subtotal</td>
                                <td>{$subtotalAmount}</td>
                            </tr>
                            {$discountRow}
                            <tr>
                                <td>Shipping Charges</td>
                                <td>{$shippingCost}</td>
                            </tr>
                            <tr>
                                <td>Taxable Amount</td>
                                <td>{$taxableAmount}</td>
                            </tr>
                            <tr>
                                <td>Total Tax</td>
                                <td>{$taxAmount}</td>
                            </tr>
                            <tr class="grand-row">
                                <td>Grand Total</td>
                                <td>{$totalAmount}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section class="tax-card">
                    <div class="block-title">Tax Breakup</div>
                    <table class="tax-table">
                        <thead>
                            <tr>
                                <th>Tax Type</th>
                                <th class="cell-center">Rate</th>
                                <th class="cell-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {$taxBreakupRows}
                        </tbody>
                    </table>
                </section>

                <section class="notes-card">
                    <p><strong>Declaration:</strong> This document is a computer-generated tax invoice and is valid without physical signature.</p>
                    <p><strong>State / Postal Reference:</strong> {$placeOfSupply} {$supplyStateCode}</p>
                    <p><strong>Billing Note:</strong> Keep this invoice for accounting, warranty, return processing, and statutory tax records.</p>

                    <div class="signature">
                        <div class="signature-line">For {$sellerName}<br>Authorized Signatory</div>
                    </div>
                </section>
            </aside>
        </section>

        <footer class="footer">
            <div><strong>Invoice Ref:</strong> {$invoiceNumber}</div>
            <div><strong>MyStore</strong> marketplace generated document</div>
        </footer>
    </section>
</body>
</html>
HTML;
    }
}
