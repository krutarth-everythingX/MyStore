<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Throwable;

class SendPasswordResetLink extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        $fields = $request->validate([
            'email' => 'nullable|string|email',
        ]);

        $email = $fields['email'] ?? $user?->email;

        if (! $email) {
            return back()->with('error', 'No email address is available for this account.');
        }

        try {
            $status = Password::sendResetLink([
                'email' => $email,
            ]);
        } catch (Throwable $exception) {
            Log::error('Password reset email delivery failed.', [
                'email' => $email,
                'message' => $exception->getMessage(),
            ]);

            return back()->with('error', 'Unable to send the reset email right now. Please try again shortly.');
        }

        if ($status !== Password::RESET_LINK_SENT) {
            return back()->with('error', __($status));
        }

        return back()->with('success', 'Password reset link sent successfully.');
    }
}
