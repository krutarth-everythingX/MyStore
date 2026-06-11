<?php

namespace App\Services\OrderService;

use App\Models\Order;
use App\Services\OrderService\Concerns\ManagesOrderOperations;

class GenerateInvoiceHtml
{
    use ManagesOrderOperations;

    public function handle(Order $order): string
    {
        $order->loadMissing(['buyer', 'items.product.user']);

        $firstItem = $order->items->first();
        $seller = $firstItem?->product?->user;
        $subtotal = $order->items->sum(fn ($item) => (float) $item->price * $item->quantity);

        $itemRows = '';
        foreach ($order->items as $item) {
            $itemTotal = (float) $item->price * $item->quantity;
            $itemRows .= "
                    <tr class='item'>
                        <td>{$item->product->name}<br><small>SKU: " . ($item->product->sku ?: 'N/A') . "</small></td>
                        <td class='text-right'>" . $this->formatCurrency((float) $item->price) . "</td>
                        <td class='text-right'>{$item->quantity}</td>
                        <td class='text-right'>" . $this->formatCurrency($itemTotal) . "</td>
                    </tr>";
        }

        $discountRow = '';
        if ((float) $order->discount_amount > 0) {
            $discountRow = "
                    <tr>
                        <td colspan='2'></td>
                        <td>Discount:</td>
                        <td class='text-right'>-" . $this->formatCurrency((float) $order->discount_amount) . "</td>
                    </tr>";
        }

        $taxRows = '';
        if ((float) $order->cgst > 0 || (float) $order->sgst > 0) {
            $taxRows = "
                    <tr>
                        <td colspan='2'></td>
                        <td>CGST (9%):</td>
                        <td class='text-right'>" . $this->formatCurrency((float) $order->cgst) . "</td>
                    </tr>
                    <tr>
                        <td colspan='2'></td>
                        <td>SGST (9%):</td>
                        <td class='text-right'>" . $this->formatCurrency((float) $order->sgst) . "</td>
                    </tr>";
        } elseif ((float) $order->igst > 0) {
            $taxRows = "
                    <tr>
                        <td colspan='2'></td>
                        <td>IGST (18%):</td>
                        <td class='text-right'>" . $this->formatCurrency((float) $order->igst) . "</td>
                    </tr>";
        }

        $sellerName = $seller?->brand_name ?: 'MyStore Seller';
        $sellerAddress = nl2br((string) ($seller?->address ?? ''));
        $sellerGstin = $seller?->gst_number ?: 'Not Configured';
        $buyerName = $order->buyer?->name ?? 'Customer';
        $buyerPhone = $order->buyer_phone ?? '';
        $buyerGstin = $order->buyer_gstin
            ? "<strong>GSTIN:</strong> {$order->buyer_gstin}"
            : '';
        $companyName = $order->company_name
            ? "{$order->company_name}<br>"
            : '';
        $shippingAddress = nl2br((string) $order->shipping_address);
        $invoiceNumber = $order->invoice_number;
        $orderDate = $order->created_at->format('d-M-Y');
        $orderId = $order->id;
        $city = $order->city;
        $state = $order->state;
        $postalCode = $order->postal_code;
        $country = $order->country;
        $shippingCost = $this->formatCurrency((float) $order->shipping_cost);
        $totalAmount = $this->formatCurrency((float) $order->total_amount);
        $subtotalAmount = $this->formatCurrency((float) $subtotal);

        return "
        <html>
        <head>
            <title>Tax Invoice - {$invoiceNumber}</title>
            <style>
                body { font-family: 'Outfit', sans-serif; color: #333; margin: 40px; }
                .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 2px solid #000; box-shadow: none; font-size: 14px; line-height: 24px; }
                .invoice-box table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
                .invoice-box table td { padding: 8px; vertical-align: top; }
                .invoice-box table tr.top table td { padding-bottom: 20px; }
                .invoice-box table tr.information table td { padding-bottom: 40px; }
                .invoice-box table tr.heading td { background: #eee; border: 1px solid #000; font-weight: bold; }
                .invoice-box table tr.details td { padding-bottom: 20px; }
                .invoice-box table tr.item td { border: 1px solid #000; }
                .invoice-box table tr.total td { border-top: 2px solid #000; font-weight: bold; }
                .text-right { text-align: right; }
                .flat-border { border: 1px solid #000 !important; }
            </style>
        </head>
        <body>
            <div class='invoice-box flat-border'>
                <table>
                    <tr class='top'>
                        <td colspan='4'>
                            <table>
                                <tr>
                                    <td>
                                        <h2>TAX INVOICE</h2>
                                        <strong>Invoice #:</strong> {$invoiceNumber}<br>
                                        <strong>Date:</strong> {$orderDate}<br>
                                        <strong>Order ID:</strong> #{$orderId}
                                    </td>
                                    <td class='text-right'>
                                        <h3>{$sellerName}</h3>
                                        {$sellerAddress}<br>
                                        <strong>GSTIN:</strong> {$sellerGstin}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr class='information'>
                        <td colspan='4'>
                            <table>
                                <tr>
                                    <td>
                                        <strong>Bill To:</strong><br>
                                        {$buyerName}<br>
                                        {$companyName}
                                        {$shippingAddress}<br>
                                        {$city}, {$state} - {$postalCode}<br>
                                        <strong>Phone:</strong> {$buyerPhone}<br>
                                        {$buyerGstin}
                                    </td>
                                    <td class='text-right'>
                                        <strong>Place of Supply:</strong><br>
                                        {$state}, {$country}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr class='heading'>
                        <td>Item / Description</td>
                        <td class='text-right'>Unit Price</td>
                        <td class='text-right'>Qty</td>
                        <td class='text-right'>Total</td>
                    </tr>
                    {$itemRows}
                    <tr class='total'>
                        <td colspan='2'></td>
                        <td>Subtotal:</td>
                        <td class='text-right'>{$subtotalAmount}</td>
                    </tr>
                    {$discountRow}
                    <tr>
                        <td colspan='2'></td>
                        <td>Shipping:</td>
                        <td class='text-right'>{$shippingCost}</td>
                    </tr>
                    {$taxRows}
                    <tr style='font-size: 16px; font-weight: bold;'>
                        <td colspan='2'></td>
                        <td>Total:</td>
                        <td class='text-right'>{$totalAmount}</td>
                    </tr>
                </table>
                <div style='margin-top: 50px; text-align: center; font-size: 12px; color: #777;'>
                    This is a computer-generated tax invoice and does not require signatures. Thank you for shopping with us!
                </div>
            </div>
        </body>
        </html>";
    }
}
