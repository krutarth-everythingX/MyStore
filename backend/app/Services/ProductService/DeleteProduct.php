<?php

namespace App\Services\ProductService;

use App\Models\Product;

class DeleteProduct
{
    public function handle(Product $product): void
    {
        $product->delete();
    }
}
