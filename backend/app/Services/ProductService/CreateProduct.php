<?php

namespace App\Services\ProductService;

use App\Models\Product;
use App\Models\User;
use App\Services\ProductService\Concerns\ManagesProductRelations;
use Illuminate\Support\Facades\DB;

class CreateProduct
{
    use ManagesProductRelations;

    public function handle(array $fields, User $seller): Product
    {
        return DB::transaction(function () use ($fields, $seller) {
            $preparedFields = $this->prepareProductFields($fields, $seller, true);
            $product = Product::create($preparedFields);

            $this->attachCategories($product, $fields, $seller);
            $this->syncWarehouseAllocation($product, $fields, false);
            $this->syncVariations($product, $fields, $seller, false);

            return $this->loadRelations($product);
        });
    }
}
