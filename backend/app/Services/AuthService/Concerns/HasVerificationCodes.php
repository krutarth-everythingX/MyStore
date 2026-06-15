<?php

namespace App\Services\AuthService\Concerns;

use App\Models\User;
use App\Notifications\VerificationCodeNotification;
use Illuminate\Support\Facades\Log;

trait HasVerificationCodes
{
    protected int $verificationCodeExpiresInMinutes = 30;

    protected function generateVerificationCode(): string
    {
        return str_pad((string) mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    protected function codeExpiresAt(User $user): ?\Carbon\CarbonInterface
    {
        return $user->verification_code_sent_at
            ? $user->verification_code_sent_at->copy()->addMinutes($this->verificationCodeExpiresInMinutes)
            : null;
    }

    protected function sendVerificationCode(User $user, string $logMessage): void
    {
        try {
            $user->notify(new VerificationCodeNotification());
        } catch (\Exception $exception) {
            Log::error($logMessage . ': ' . $exception->getMessage());
        }
    }
}
