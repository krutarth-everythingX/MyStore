<?php

namespace App\Services\AuthService;

use App\Models\User;

class RedirectPath
{
    public function handle(?string $redirect, User $user): string
    {
        if ($redirect === 'checkout' && $user->role === 'buyer') {
            return '/checkout';
        }

        return $user->role === 'seller' ? '/seller' : '/';
    }
}
