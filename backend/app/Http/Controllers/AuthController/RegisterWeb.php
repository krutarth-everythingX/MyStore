<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use App\Services\AuthService\RegisterUser;
use App\Services\AuthService\RedirectPath;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RegisterWeb extends Controller
{
    public function __construct(
        private readonly RegisterUser $registerUser,
        private readonly RedirectPath $redirectPath,
    ) {
    }

    public function __invoke(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string',
            'email' => 'required|string|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:buyer,seller',
            'brand_name' => 'nullable|string',
        ]);

        $user = $this->registerUser->handle($fields);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect($this->redirectPath->handle($request->input('redirect'), $user));
    }
}
