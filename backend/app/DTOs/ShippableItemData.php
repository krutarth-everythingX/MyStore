<?php

namespace App\DTOs;

use App\Models\Product;

final class ShippableItemData
{
    public function __construct(
        public readonly Product $product,
        public readonly int $quantity,
    ) {
    }
}
