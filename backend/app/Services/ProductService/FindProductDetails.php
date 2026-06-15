<?php

namespace App\Services\ProductService;

use App\Models\Product;

class FindProductDetails
{
    public function handle(int $id): ?Product
    {
        $product = Product::with(['user', 'brand', 'categories', 'warehouses', 'variations'])->find($id);

        if ($product && $product->type === 'grouped') {
            $product->setRelation('grouped_products', $product->groupedProducts()->load(['user', 'brand', 'categories']));
        }

        return $product;
    }
}
