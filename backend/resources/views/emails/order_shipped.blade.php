@component('mail::message')
# Hi {{ $name }},

Great news! Your order **#{{ $orderId }}** has been handed over to our shipping carrier and is on its way to you.

@component('mail::panel')
🚚 **Carrier:** {{ $carrier }}  
📦 **Tracking Number:** {{ $trackingNumber }}
@endcomponent

@component('mail::button', ['url' => $url])
Track Shipment
@endcomponent

You can monitor updates and trace the delivery progress directly from your account page.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
