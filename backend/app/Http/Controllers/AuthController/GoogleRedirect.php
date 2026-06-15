<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class GoogleRedirect extends Controller
{
    public function __invoke(Request $request)
    {
        $request->validate([
            'role' => 'nullable|string|in:buyer,seller',
            'redirect' => 'nullable|string',
        ]);

        $request->session()->put('google_auth_role', $request->input('role', 'buyer'));
        $request->session()->put('google_auth_redirect', $request->input('redirect'));

        return Socialite::driver('google')->redirect();
    }
}
