<?php

namespace App\Services\AuthService;

use App\Models\User;
use App\Services\AuthService\Concerns\HasPhoneVerificationCodes;
use App\Services\SmsService\SendSms;
use Illuminate\Validation\ValidationException;

class SendPhoneVerification
{
    use HasPhoneVerificationCodes;

    public function __construct(private readonly SendSms $sendSms)
    {
    }

    public function handle(User $user, ?string $countryCode = null, ?string $phone = null): User
    {
        $nextPhone = $phone ?? $user->phone;
        $nextCountryCode = $countryCode ?? $user->country_code;
        $phoneChanged = $nextPhone !== $user->phone || $nextCountryCode !== $user->country_code;

        if ($phone !== null || $countryCode !== null) {
            $user->forceFill([
                'phone' => $nextPhone,
                'country_code' => $nextCountryCode,
                'phone_verified_at' => null,
                'phone_verification_code' => $phoneChanged ? null : $user->phone_verification_code,
                'phone_verification_code_sent_at' => $phoneChanged ? null : $user->phone_verification_code_sent_at,
            ])->save();
        }

        $normalizedPhone = $this->normalizePhoneNumber($user->country_code, $user->phone);

        if ($normalizedPhone === '') {
            throw ValidationException::withMessages([
                'phone' => ['Please enter a country code and phone number first.'],
            ]);
        }

        $user->forceFill([
            'phone_verification_code' => $this->generatePhoneVerificationCode(),
            'phone_verification_code_sent_at' => now(),
            'phone_verified_at' => null,
        ])->save();

        $this->sendSms->handle(
            $normalizedPhone,
            "Your MyStore phone verification code is {$user->phone_verification_code}. It expires in 30 minutes.",
        );

        return $user->refresh();
    }
}
