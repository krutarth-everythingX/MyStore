<?php

namespace App\Services\SellerDashboardService;

use App\Models\Order;
use App\Services\SellerDashboardService\Concerns\InteractsWithDashboardData;

class FindOrderForSeller
{
    use InteractsWithDashboardData;

    public function handle(int $sellerId, int $orderId): ?Order
    {
        return $this->sellerOrdersQuery($sellerId)->find($orderId);
    }
}
