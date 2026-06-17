<?php

namespace App\Services\ProductService;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

class RelatedProducts
{
    public function __construct(private readonly CustomersAlsoBought $customersAlsoBought)
    {
    }

    public function handle(Product $product, int $limit = 4): Collection
    {
        return $this->customersAlsoBought->handle($product, $limit);
    }
}
