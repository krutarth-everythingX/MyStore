<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function create(User $user): bool
    {
        return $user->role === 'seller';
    }

    public function update(User $user, Product $product): bool
    {
        return $user->role === 'seller' && $product->user_id === $user->id;
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->role === 'seller' && $product->user_id === $user->id;
    }
}
