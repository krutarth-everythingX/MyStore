<?php

namespace App\Services\AuthService;

use App\Models\User;
use App\Services\AuthService\Concerns\HasPhoneVerificationCodes;
use Illuminate\Validation\ValidationException;

class VerifyPhone
{
    use HasPhoneVerificationCodes;

    public function handle(User $user, string $code): User
    {
        if ($user->phone_verified_at) {
            return $user;
        }

        if (! $user->phone_verification_code || ! $user->phone_verification_code_sent_at) {
            throw ValidationException::withMessages([
                'code' => ['Please send a phone verification code first.'],
            ]);
        }

        if ($this->phoneCodeExpiresAt($user)?->isPast()) {
            throw ValidationException::withMessages([
                'code' => ['Phone verification code expired. Please send a new code.'],
            ]);
        }

        if ($user->phone_verification_code !== $code) {
            throw ValidationException::withMessages([
                'code' => ['Invalid phone verification code.'],
            ]);
        }

        $user->forceFill([
            'phone_verified_at' => now(),
            'phone_verification_code' => null,
            'phone_verification_code_sent_at' => null,
        ])->save();

        return $user->refresh();
    }
}
