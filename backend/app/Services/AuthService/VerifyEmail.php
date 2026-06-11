<?php

namespace App\Services\AuthService;

use App\Models\User;
use Illuminate\Validation\ValidationException;

class VerifyEmail
{
    public function handle(User $user, string $code): array
    {
        if ($user->email_verified_at) {
            return [
                'user' => $user,
                'already_verified' => true,
            ];
        }

        if ($user->verification_code !== $code) {
            throw ValidationException::withMessages([
                'code' => ['Invalid verification code.'],
            ]);
        }

        $user->forceFill([
            'email_verified_at' => now(),
            'verification_code' => null,
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
