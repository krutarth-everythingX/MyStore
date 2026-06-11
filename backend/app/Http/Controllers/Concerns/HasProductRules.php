<?php

namespace App\Http\Controllers\Concerns;

trait HasProductRules
{
    protected function productRules(): array
    {
        return [
            'name' => 'required|string',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'regular_price' => 'required|numeric',
            'sale_price' => 'nullable|numeric',
            'sku' => 'nullable|string',
            'manage_stock' => 'boolean',
            'stock_quantity' => 'integer',
            'brand_id' => 'nullable|integer',
            'categories' => 'nullable|array',
            'new_category_name' => 'nullable|string',
            'warehouse_id' => 'nullable|integer',
            'warehouse_qty' => 'nullable|integer',
            'bin_location' => 'nullable|string',
            'type' => 'nullable|string|in:simple,variable,variation',
            'parent_id' => 'nullable|integer|exists:products,id',
            'attributes' => 'nullable|array',
            'variations' => 'nullable|array',
            'weight_kg' => 'nullable|numeric|min:0',
            'length_cm' => 'nullable|numeric|min:0',
            'width_cm' => 'nullable|numeric|min:0',
            'height_cm' => 'nullable|numeric|min:0',
        ];
    }
}
