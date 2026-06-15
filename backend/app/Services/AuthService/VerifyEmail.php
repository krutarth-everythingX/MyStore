<?php

namespace App\Services\AuthService;

use App\Models\User;
use App\Services\AuthService\Concerns\HasVerificationCodes;
use Illuminate\Validation\ValidationException;

class VerifyEmail
{
    use HasVerificationCodes;

    public function handle(User $user, string $code): array
    {
        if ($user->email_verified_at) {
            return [
                'user' => $user,
                'already_verified' => true,
            ];
        }

        if (! $user->verification_code || ! $user->verification_code_sent_at) {
            throw ValidationException::withMessages([
                'code' => ['Please send a verification code first.'],
            ]);
        }

        if ($this->codeExpiresAt($user)?->isPast()) {
            throw ValidationException::withMessages([
                'code' => ['Verification code expired. Please resend a new code.'],
            ]);
        }

        if ($user->verification_code !== $code) {
            throw ValidationException::withMessages([
                'code' => ['Invalid verification code.'],
            ]);
        }

        $user->forceFill([
            'email_verified_at' => now(),
            'verification_code' => null,
            'verification_code_sent_at' => null,
        ])->save();

        try {
            $user->notify(new \App\Notifications\WelcomeNotification());
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send welcome notification: ' . $e->getMessage());
        }

        return [
            'user' => $user->refresh(),
            'already_verified' => false,
        ];
    }
}
