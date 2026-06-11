<?php

namespace App\Services\WishlistService;

use App\Models\Wishlist;

class ToggleProduct
{
    public function handle(int $userId, int $productId): bool
    {
        $existing = Wishlist::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if ($existing) {
            $existing->delete();

            return false;
        }

        Wishlist::create([
            'user_id' => $userId,
            'product_id' => $productId,
        ]);

        return true;
    }
}
