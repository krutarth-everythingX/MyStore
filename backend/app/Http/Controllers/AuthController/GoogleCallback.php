<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuthService\RedirectPath;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleCallback extends Controller
{
    public function __construct(
        private readonly RedirectPath $redirectPath,
    ) {
    }

    public function __invoke()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable) {
            return redirect('/login')->with('error', 'Google sign-in failed. Please try again.');
        }

        if (! $googleUser->getEmail()) {
            return redirect('/login')->with('error', 'Google did not return an email address.');
        }

        $role = session()->pull('google_auth_role', 'buyer');
        $redirect = session()->pull('google_auth_redirect');

        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if ($user) {
            $user->forceFill([
                'google_id' => $user->google_id ?: $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'auth_provider' => 'google',
                'email_verified_at' => $user->email_verified_at ?: now(),
                'verification_code' => null,
            ])->save();
        } else {
            $user = User::create([
                'name' => $googleUser->getName() ?: Str::before($googleUser->getEmail(), '@'),
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'auth_provider' => 'google',
                'password' => Hash::make(Str::random(32)),
                'role' => $role,
                'brand_name' => null,
                'email_verified_at' => now(),
                'verification_code' => null,
            ]);
        }

        Auth::login($user);
        request()->session()->regenerate();

        return redirect($this->redirectPath->handle($redirect, $user));
    }
}
