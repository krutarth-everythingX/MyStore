<?php

namespace App\Http\Controllers\AuthController;

use App\Http\Controllers\Controller;
use App\Services\AuthService\RegisterUser;
use App\Services\AuthService\IssueToken;
use Illuminate\Http\Request;

class Register extends Controller
{
    public function __construct(
        private readonly RegisterUser $registerUser,
        private readonly IssueToken $issueToken,
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

        return response([
            'user' => $user,
            'token' => $this->issueToken->handle($user),
        ], 210);
    }
}
