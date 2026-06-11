<?php

namespace App\Services\ProductService;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

class ListSellerProducts
{
    public function handle(int $sellerId): Collection
    {
        return Product::with(['user', 'brand', 'categories', 'variations', 'warehouses'])
            ->where('user_id', $sellerId)
            ->where('type', '!=', 'variation')
            ->latest()
            ->get();
    }
}
