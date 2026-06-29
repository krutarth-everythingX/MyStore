<?php

namespace App\Services\OrderService;

use App\Models\Order;
use Illuminate\Database\Eloquent\Collection;

class ListBuyerOrders
{
    public function handle(int $buyerId): Collection
    {
        return Order::with(['buyer', 'items.product.brand', 'items.product.user'])
            ->where('buyer_id', $buyerId)
            ->latest()
            ->get();
    }
}
