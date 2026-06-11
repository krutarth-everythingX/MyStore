<?php

namespace App\Services\RecentlyViewedService;

use App\Models\RecentlyViewed;

class TrackProduct
{
    public function handle(int $userId, int $productId): void
    {
        RecentlyViewed::updateOrCreate(
            [
                'user_id' => $userId,
                'product_id' => $productId,
            ],
            [
                'viewed_at' => now(),
            ],
        );
    }
}
