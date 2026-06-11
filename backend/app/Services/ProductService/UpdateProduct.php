<?php

namespace App\Services\ProductService;

use App\Models\Product;
use App\Models\User;
use App\Services\ProductService\Concerns\ManagesProductRelations;
use Illuminate\Support\Facades\DB;

class UpdateProduct
{
    use ManagesProductRelations;

    public function handle(Product $product, array $fields, User $seller): Product
    {
        return DB::transaction(function () use ($product, $fields, $seller) {
            $preparedFields = $this->prepareProductFields($fields, $seller, false);
            $product->update($preparedFields);

            $this->syncCategories($product, $fields, $seller);
            $this->syncWarehouseAllocation($product, $fields, true);
            $this->syncVariations($product, $fields, $seller, true);

            return $this->loadRelations($product);
        });
    }
}
