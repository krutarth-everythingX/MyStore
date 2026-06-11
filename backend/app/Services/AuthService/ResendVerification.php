<?php

namespace App\Services\AuthService;

use App\Models\User;
use App\Services\AuthService\Concerns\HasVerificationCodes;

class ResendVerification
{
    use HasVerificationCodes;

    public function handle(User $user): bool
    {
        if ($user->email_verified_at) {
            return false;
        }

        $user->verification_code = $this->generateVerificationCode();
        $user->save();

        $this->sendVerificationCode($user, 'Failed to resend verification code');

        return true;
    }
}
