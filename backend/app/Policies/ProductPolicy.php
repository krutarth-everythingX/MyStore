<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function create(User $user): bool
    {
        return $user->role === 'seller' && seller_setup_complete($user);
    }

    public function update(User $user, Product $product): bool
    {
        return $user->role === 'seller'
            && seller_setup_complete($user)
            && $product->user_id === $user->id;
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->role === 'seller'
            && seller_setup_complete($user)
            && $product->user_id === $user->id;
    }
}
