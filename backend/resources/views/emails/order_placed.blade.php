@component('mail::message')
# Hi {{ $name }},

Thank you for shopping at MyStore! We have received your order **#{{ $orderId }}** and are preparing it for shipment.

@component('mail::panel')
💰 **Total Amount:** ${{ $total }}  
💳 **Payment Method:** {{ $paymentMethod }}  
📍 **Shipping Address:** {{ $address }}
@endcomponent

@component('mail::button', ['url' => $url])
Track Order Status
@endcomponent

We will send you another update with tracking information as soon as your package ships.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
