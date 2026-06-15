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

        if ($user->role === 'seller' && ! seller_setup_complete($user)) {
            return '/seller/setup';
        }

        return $user->role === 'seller' ? '/seller' : '/';
    }
}
