@component('mail::message')
# Account deletion scheduled

Hi {{ $name }},

We received a request to delete your MyStore account. You have been signed out, and your account is scheduled to be deleted in 7 days.

Scheduled deletion time: **{{ $scheduledFor }}**

If this was not you, please contact support before the scheduled date.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
