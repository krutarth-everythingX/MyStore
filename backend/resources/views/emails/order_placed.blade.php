@component('mail::message')
# Order Confirmed

Hi {{ $name }},

Your order **#{{ $orderId }}** has been placed successfully and is now in our processing queue.

@component('mail::panel')
**Invoice:** {{ $invoiceNumber ?? 'Will be generated shortly' }}  
**Order Date:** {{ $orderDate }}  
**Payment Method:** {{ $paymentMethod }}  
**Phone:** {{ $phone }}  
**Shipping Address:** {{ $address }}
@endcomponent

## Items Ordered

@foreach ($items as $item)
- **{{ $item['name'] }}**
  SKU: {{ $item['sku'] }} | Qty: {{ $item['quantity'] }} | Unit: {{ $item['price'] }} | Subtotal: {{ $item['subtotal'] }}
@endforeach

## Order Summary

- Subtotal: **{{ $subtotal }}**
- Shipping: **{{ $shippingCost }}**
@if (!empty($discountAmount) && strpos($discountAmount, '0.00') === false)
- Discount: **-{{ $discountAmount }}**
@endif
@if (!empty($cgst) && strpos($cgst, '0.00') === false)
- CGST: **{{ $cgst }}**
@endif
@if (!empty($sgst) && strpos($sgst, '0.00') === false)
- SGST: **{{ $sgst }}**
@endif
@if (!empty($igst) && strpos($igst, '0.00') === false)
- IGST: **{{ $igst }}**
@endif
- Total: **{{ $total }}**

@component('mail::button', ['url' => $url])
View My Orders
@endcomponent

@component('mail::button', ['url' => $invoiceUrl])
Open Tax Invoice
@endcomponent

We'll send another email with shipping and tracking details as soon as the seller dispatches your package.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
