@component('mail::message')
# Hi {{ $name }},

Thank you for registering at MyStore! To complete your account activation, please use the following 6-digit verification code:

@component('mail::panel')
<div style="text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 0.15em; color: #4f46e5; padding: 8px 0; font-family: 'Inter', sans-serif;">
{{ $code }}
</div>
@endcomponent

Enter this code on the verification screen to proceed.

If you did not initiate this registration, you can safely ignore this email.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
