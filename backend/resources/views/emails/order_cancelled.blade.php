<x-mail::message>
# Order #{{ $orderId }} Cancelled

Hello {{ $sellerName }},

The buyer {{ $buyerName }} cancelled this order.

<x-mail::panel>
Reason: {{ $reason }}
@if($note)

Additional note: {{ $note }}
@endif
@if($cancelledAt)

Cancelled at: {{ $cancelledAt }}
@endif
</x-mail::panel>

<x-mail::button :url="$orderUrl">
View Seller Orders
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
