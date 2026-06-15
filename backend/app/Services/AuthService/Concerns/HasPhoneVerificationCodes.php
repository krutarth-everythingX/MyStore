<?php

namespace App\Services\AuthService\Concerns;

use App\Models\User;

trait HasPhoneVerificationCodes
{
    protected int $phoneVerificationCodeExpiresInMinutes = 30;

    protected function generatePhoneVerificationCode(): string
    {
        return str_pad((string) mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    protected function phoneCodeExpiresAt(User $user): ?\Carbon\CarbonInterface
    {
        return $user->phone_verification_code_sent_at
            ? $user->phone_verification_code_sent_at->copy()->addMinutes($this->phoneVerificationCodeExpiresInMinutes)
            : null;
    }

    protected function normalizePhoneNumber(?string $countryCode, ?string $phone): string
    {
        $countryCode = preg_replace('/\D+/', '', (string) $countryCode);
        $phone = preg_replace('/\D+/', '', (string) $phone);

        if ($countryCode === '' || $phone === '') {
            return '';
        }

        return '+' . $countryCode . $phone;
    }
}
