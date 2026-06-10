<?php

namespace App\Observers;

use App\Models\Product;

class ProductObserver
{
    public function saving(Product $product): void
    {
        if (!$product->manage_stock) {
            return;
        }

        $product->stock_status = $product->stock_quantity > 0
            ? 'instock'
            : 'outofstock';
    }
}
