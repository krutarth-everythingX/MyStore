<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class ResetPassword extends Controller
{
    public function __invoke(Request $request)
    {
        $fields = $request->validate([
            'token' => 'required|string',
            'email' => 'required|string|email',
            'password' => 'required|string|min:6|confirmed',
            'source' => 'nullable|string|in:forgot,profile',
        ]);

        $source = $fields['source'] ?? 'forgot';

        $status = Password::reset(
            $fields,
            function ($user, $password) use ($source) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));

                if ($source === 'profile') {
                    Auth::login($user);
                }
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return back()->with('error', __($status));
        }

        if ($source === 'profile') {
            $request->session()->regenerate();

            return redirect('/password-reset-complete')->with('success', 'Password changed successfully.');
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login')->with('success', 'Password changed successfully. Please log in with your new password.');
    }
}
