<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use App\Services\AuthService\Authenticate;
use App\Services\AuthService\RedirectPath;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginWeb extends Controller
{
    public function __construct(
        private readonly Authenticate $authenticate,
        private readonly RedirectPath $redirectPath,
    ) {
    }

    public function __invoke(Request $request)
    {
        $fields = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = $this->authenticate->handle($fields);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect($this->redirectPath->handle($request->input('redirect'), $user));
    }
}
