<?php

namespace App\Services\WishlistService;

use App\Models\Wishlist;
use Illuminate\Database\Eloquent\Collection;

class ListForUser
{
    public function handle(int $userId): Collection
    {
        return Wishlist::with('product.brand', 'product.user')
            ->where('user_id', $userId)
            ->latest()
            ->get();
    }
}
