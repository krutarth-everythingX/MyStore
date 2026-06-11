@component('mail::message')
# Welcome, {{ $name }}!

We are thrilled to have you here. Your email verification is complete, and your MyStore account is now fully activated.

{{ $roleMessage }}

@component('mail::button', ['url' => $url])
Start Exploring MyStore
@endcomponent

If you have any questions, feel free to reply to this email. Our support team is always here to help!

Thanks,<br>
{{ config('app.name') }}
@endcomponent
