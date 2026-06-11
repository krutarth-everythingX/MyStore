<?php

namespace App\Services\SellerDashboardService;

use App\Services\SellerDashboardService\Concerns\InteractsWithDashboardData;
use Illuminate\Database\Eloquent\Collection;

class ListOrdersForSeller
{
    use InteractsWithDashboardData;

    public function handle(int $sellerId): Collection
    {
        return $this->sellerOrdersQuery($sellerId)
            ->latest()
            ->get();
    }
}
