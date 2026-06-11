<?php

namespace App\Services\AuthService;

use App\Models\User;

class IssueToken
{
    public function handle(User $user, string $tokenName = 'mystoretoken'): string
    {
        return $user->createToken($tokenName)->plainTextToken;
    }
}
