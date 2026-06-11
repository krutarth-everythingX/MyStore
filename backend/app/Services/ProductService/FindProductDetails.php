<?php

namespace App\Services\ProductService;

use App\Models\Product;

class FindProductDetails
{
    public function handle(int $id): ?Product
    {
        return Product::with(['user', 'brand', 'categories', 'warehouses', 'variations'])->find($id);
    }
}
