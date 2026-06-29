@component('mail::message')
# Your Order Has Shipped

Hi {{ $name }},

Good news. Your order **#{{ $orderId }}** has been shipped by the seller.

@component('mail::panel')
**Carrier:** {{ $carrier }}  
**Tracking ID:** {{ $trackingNumber }}  
**Acceptance Time:** {{ $acceptanceTime }}  
**Shipping Address:** {{ $shippingAddress }}
@endcomponent

## Items In This Shipment

@foreach ($items as $item)
- **{{ $item['name'] }}**
  SKU: {{ $item['sku'] }} | Qty: {{ $item['quantity'] }} | Value: {{ $item['subtotal'] }}
@endforeach

@component('mail::button', ['url' => $url])
Track My Order
@endcomponent

Your order page will also show the same tracking details inside MyStore.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
