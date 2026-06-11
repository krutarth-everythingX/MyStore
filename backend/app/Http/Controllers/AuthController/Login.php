<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use App\Services\AuthService\Authenticate;
use App\Services\AuthService\IssueToken;
use Illuminate\Http\Request;

class Login extends Controller
{
    public function __construct(
        private readonly Authenticate $authenticate,
        private readonly IssueToken $issueToken,
    ) {
    }

    public function __invoke(Request $request)
    {
        $fields = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = $this->authenticate->handle($fields);

        return response([
            'user' => $user,
            'token' => $this->issueToken->handle($user),
        ], 200);
    }
}
