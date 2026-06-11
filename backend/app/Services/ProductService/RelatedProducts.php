<?php

namespace App\Services\ProductService;

use App\Models\Product;
use App\Services\ProductService\StorefrontQuery;
use Illuminate\Database\Eloquent\Collection;

class RelatedProducts
{
    public function __construct(private readonly StorefrontQuery $storefrontQuery)
    {
    }

    public function handle(Product $product, int $limit = 4): Collection
    {
        $product->loadMissing('categories');

        $filters = [];
        if ($product->categories->isNotEmpty()) {
            $filters['category_id'] = $product->categories->first()->id;
        }

        return $this->storefrontQuery->handle($filters)
            ->where('products.id', '!=', $product->id)
            ->latest()
            ->take($limit)
            ->get();
    }
}
