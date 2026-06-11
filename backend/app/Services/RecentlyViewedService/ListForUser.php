<?php

namespace App\Services\RecentlyViewedService;

use App\Models\RecentlyViewed;
use Illuminate\Database\Eloquent\Collection;

class ListForUser
{
    public function handle(int $userId, int $limit = 5): Collection
    {
        return RecentlyViewed::with('product.brand', 'product.user')
            ->where('user_id', $userId)
            ->orderByDesc('viewed_at')
            ->limit($limit)
            ->get();
    }
}
