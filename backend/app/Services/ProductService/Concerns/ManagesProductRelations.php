<?php

namespace App\Services\ProductService\Concerns;

use App\Models\Brand;
use App\Models\Category;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Str;

trait ManagesProductRelations
{
    protected function prepareProductFields(array $fields, User $seller, bool $isNew): array
    {
        $fields['brand_id'] = $this->resolveSellerBrand($seller)->id;
        $fields['country_of_origin'] = filled($fields['country_of_origin'] ?? null)
            ? $fields['country_of_origin']
            : $seller->country;
        $fields['fulfillment_channel'] = filled($fields['fulfillment_channel'] ?? null)
            ? $fields['fulfillment_channel']
            : $seller->default_fulfillment_channel;

        foreach (['gallery_images', 'bullet_points', 'seo_search_terms', 'whats_inside_box', 'tags'] as $key) {
            if (array_key_exists($key, $fields) && is_array($fields[$key])) {
                $fields[$key] = array_values(array_filter($fields[$key], function ($item) use ($key) {
                    if (is_array($item)) {
                        return filled($item['title'] ?? null) || filled($item['value'] ?? null);
                    }

                    return filled($item);
                }));
            }
        }

        if (array_key_exists('safety_compliance', $fields) && is_array($fields['safety_compliance'])) {
            $fields['safety_compliance'] = array_filter($fields['safety_compliance'], fn ($value) => filled($value));
        }

        if (array_key_exists('size_chart', $fields) && is_array($fields['size_chart'])) {
            $fields['size_chart'] = array_filter($fields['size_chart'], fn ($value) => filled($value));
        }

        // Keep numeric product fields compatible with the current SQLite schema defaults.
        if (! filled($fields['weight_kg'] ?? null)) {
            $fields['weight_kg'] = 0.5;
        }

        $type = $fields['type'] ?? 'simple';

        if ($type !== 'variable') {
            $fields['parent_sku_id'] = null;
            $fields['attributes'] = null;
        } elseif (blank($fields['parent_sku_id'] ?? null)) {
            $fields['parent_sku_id'] = 'PSKU-' . Str::upper(Str::random(8));
        }

        if ($type !== 'grouped') {
            $fields['grouped_product_ids'] = [];
        } elseif (array_key_exists('grouped_product_ids', $fields) && is_array($fields['grouped_product_ids'])) {
            $fields['grouped_product_ids'] = array_values(array_unique(array_map('intval', array_filter($fields['grouped_product_ids']))));
        }

        if ($type !== 'external') {
            $fields['external_url'] = null;
            $fields['external_button_text'] = null;
        }

        if ($isNew) {
            $fields['user_id'] = $seller->id;
            $fields['slug'] = Str::slug($fields['name']) . '-' . uniqid();
            $fields['status'] = $fields['status'] ?? 'published';
        } elseif (array_key_exists('status', $fields) && blank($fields['status'])) {
            unset($fields['status']);
        }

        return $fields;
    }

    protected function resolveSellerBrand(User $seller): Brand
    {
        return Brand::firstOrCreate(
            ['user_id' => $seller->id],
            ['name' => seller_brand_name($seller->brand_name, $seller->name)],
        );
    }

    protected function attachCategories(Product $product, array $fields, User $seller): void
    {
        $categoryIds = $this->resolveCategoryIds($fields, $seller);

        if ($categoryIds !== []) {
            $product->categories()->attach($categoryIds);
        }
    }

    protected function syncCategories(Product $product, array $fields, User $seller): void
    {
        if (! array_key_exists('categories', $fields)) {
            return;
        }

        $product->categories()->sync($this->resolveCategoryIds($fields, $seller));
    }

    protected function resolveCategoryIds(array $fields, User $seller): array
    {
        $categoryIds = $fields['categories'] ?? [];

        if (filled($fields['new_category_name'] ?? null)) {
            $newCat = Category::create([
                'user_id' => $seller->id,
                'name' => $fields['new_category_name'],
                'slug' => Str::slug($fields['new_category_name']) . '-' . uniqid(),
                'parent_id' => $fields['new_category_parent_id'] ?? null,
            ]);
            $categoryIds[] = $newCat->id;
        }

        if ($categoryIds === []) {
            return [];
        }

        return Category::where('user_id', $seller->id)
            ->whereIn('id', array_values(array_unique($categoryIds)))
            ->pluck('id')
            ->all();
    }

    protected function syncWarehouseAllocation(Product $product, array $fields, bool $replaceExisting): void
    {
        if (empty($fields['warehouse_id'])) {
            return;
        }

        $warehouseId = (int) $fields['warehouse_id'];
        $existing = $product->warehouses()->where('warehouse_id', $warehouseId)->first();
        $previousQuantity = (int) ($existing?->pivot?->quantity ?? 0);
        $previousReserved = (int) ($existing?->pivot?->reserved_quantity ?? 0);
        $quantity = (int) ($fields['warehouse_qty'] ?? ($fields['stock_quantity'] ?? 0));
        $availableQuantity = max(0, $quantity - $previousReserved);

        $allocation = [
            'quantity' => $quantity,
            'reserved_quantity' => $previousReserved,
            'available_quantity' => $availableQuantity,
            'safety_stock' => (int) ($fields['safety_stock'] ?? $existing?->pivot?->safety_stock ?? 0),
            'bin_location' => $fields['bin_location'] ?? $existing?->pivot?->bin_location,
            'unit_cost' => $fields['unit_cost'] ?? $existing?->pivot?->unit_cost,
            'stock_status' => $availableQuantity > 0 ? 'available' : 'out_of_stock',
        ];

        if ($replaceExisting) {
            $product->warehouses()->sync([
                $warehouseId => $allocation,
            ]);
        } else {
            $product->warehouses()->attach($warehouseId, $allocation);
        }

        $variance = $quantity - $previousQuantity;

        if ($variance !== 0) {
            InventoryTransaction::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouseId,
                'type' => $variance > 0 ? 'stock_in' : 'stock_out',
                'quantity' => $variance,
                'quantity_after' => $quantity,
                'reference_type' => $replaceExisting ? 'product_update' : 'product_create',
                'reference_no' => $product->sku ?: $product->mystore_product_id,
                'reason' => $replaceExisting ? 'Product inventory update' : 'Opening stock',
                'unit_cost' => $allocation['unit_cost'],
                'created_by' => $product->user_id,
            ]);
        }

        if (($fields['manage_stock'] ?? $product->manage_stock) === true) {
            $product->update([
                'stock_quantity' => (int) $product->warehouses()->sum('warehouse_product.available_quantity'),
                'stock_status' => $product->warehouses()->sum('warehouse_product.available_quantity') > 0 ? 'instock' : 'outofstock',
            ]);
        }
    }

    protected function syncVariations(Product $product, array $fields, User $seller, bool $isUpdate): void
    {
        $type = $fields['type'] ?? $product->type ?? 'simple';

        if ($type !== 'variable') {
            if ($isUpdate) {
                Product::where('parent_id', $product->id)->delete();
            }

            return;
        }

        if (! array_key_exists('variations', $fields)) {
            return;
        }

        $keepVariationIds = [];

        foreach ($fields['variations'] ?? [] as $variationInput) {
            $variation = $this->upsertVariation($product, $variationInput, $seller, $isUpdate);
            $keepVariationIds[] = $variation->id;

            if (! empty($fields['warehouse_id'])) {
                $variationQuantity = (int) ($variationInput['stock_quantity'] ?? 0);
                $variation->warehouses()->sync([
                    $fields['warehouse_id'] => [
                        'quantity' => $variationQuantity,
                        'reserved_quantity' => 0,
                        'available_quantity' => $variationQuantity,
                        'safety_stock' => 0,
                        'bin_location' => $fields['bin_location'] ?? null,
                        'unit_cost' => $fields['unit_cost'] ?? null,
                        'stock_status' => $variationQuantity > 0 ? 'available' : 'out_of_stock',
                    ],
                ]);
            }
        }

        if ($isUpdate) {
            $query = Product::where('parent_id', $product->id);

            if ($keepVariationIds !== []) {
                $query->whereNotIn('id', $keepVariationIds);
            }

            $query->delete();
        }
    }

    protected function upsertVariation(Product $product, array $variationInput, User $seller, bool $isUpdate): Product
    {
        $attributes = $variationInput['attributes'] ?? [];
        $variationData = [
            'user_id' => $seller->id,
            'name' => $product->name . ' - ' . implode(', ', $attributes),
            'description' => $product->description,
            'regular_price' => $variationInput['regular_price'] ?? $product->regular_price,
            'sale_price' => $variationInput['sale_price'] ?? null,
            'sku' => $variationInput['sku'] ?? null,
            'parent_sku_id' => $product->parent_sku_id ?: ($product->sku ?: $product->mystore_product_id),
            'manage_stock' => $variationInput['manage_stock'] ?? false,
            'stock_quantity' => $variationInput['stock_quantity'] ?? 0,
            'type' => 'variation',
            'parent_id' => $product->id,
            'attributes' => $attributes,
            'status' => 'published',
            'brand_id' => $product->brand_id,
            'manufacturer' => $product->manufacturer,
            'model_number' => $product->model_number,
            'country_of_origin' => $product->country_of_origin,
            'product_type' => $product->product_type,
            'product_type_keyword' => $product->product_type_keyword,
            'target_gender' => $product->target_gender,
            'recommended_age' => $product->recommended_age,
            'condition' => $product->condition,
            'fulfillment_channel' => $product->fulfillment_channel,
        ];

        if ($isUpdate && ! empty($variationInput['id'])) {
            $variation = Product::find($variationInput['id']);

            if ($variation && $variation->parent_id === $product->id) {
                $variation->update($variationData);

                return $variation;
            }
        }

        $variationData['slug'] = $product->slug . '-' . Str::slug(implode('-', $attributes)) . '-' . uniqid();

        return Product::create($variationData);
    }

    protected function loadRelations(Product $product): Product
    {
        return $product->load(['brand', 'categories', 'warehouses', 'variations', 'user']);
    }
}
