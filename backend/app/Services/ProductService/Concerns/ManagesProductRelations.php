<?php

namespace App\Services\ProductService\Concerns;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Notifications\LowStockNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

trait ManagesProductRelations
{
    protected function prepareProductFields(array $fields, User $seller, bool $isNew): array
    {
        $fields['brand_id'] = $this->resolveSellerBrand($seller)->id;

        if ($isNew) {
            $fields['user_id'] = $seller->id;
            $fields['slug'] = Str::slug($fields['name']) . '-' . uniqid();
            $fields['status'] = 'published';
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
        if (! array_key_exists('categories', $fields) && empty($fields['new_category_name'])) {
            return;
        }

        $product->categories()->sync($this->resolveCategoryIds($fields, $seller));
    }

    protected function resolveCategoryIds(array $fields, User $seller): array
    {
        $categoryIds = $fields['categories'] ?? [];

        if (! empty($fields['new_category_name'])) {
            $newCategory = Category::firstOrCreate(
                ['name' => $fields['new_category_name']],
                [
                    'user_id' => $seller->id,
                    'parent_id' => null,
                ],
            );

            $categoryIds[] = $newCategory->id;
        }

        return array_values(array_unique($categoryIds));
    }

    protected function syncWarehouseAllocation(Product $product, array $fields, bool $replaceExisting): void
    {
        if (empty($fields['warehouse_id'])) {
            return;
        }

        $quantity = $fields['warehouse_qty'] ?? ($fields['stock_quantity'] ?? 0);
        $allocation = [
            'quantity' => $quantity,
            'bin_location' => $fields['bin_location'] ?? null,
        ];

        if ($replaceExisting) {
            $product->warehouses()->sync([
                $fields['warehouse_id'] => $allocation,
            ]);
        } else {
            $product->warehouses()->attach($fields['warehouse_id'], $allocation);
        }

        if (($fields['manage_stock'] ?? $product->manage_stock) === true) {
            $product->update(['stock_quantity' => $quantity]);
        }
    }

    protected function syncVariations(Product $product, array $fields, User $seller, bool $isUpdate): void
    {
        $type = $fields['type'] ?? $product->type ?? 'simple';

        if ($type !== 'variable' || ! array_key_exists('variations', $fields)) {
            return;
        }

        $keepVariationIds = [];

        foreach ($fields['variations'] ?? [] as $variationInput) {
            $variation = $this->upsertVariation($product, $variationInput, $seller, $isUpdate);
            $keepVariationIds[] = $variation->id;

            if (! empty($fields['warehouse_id'])) {
                $variation->warehouses()->sync([
                    $fields['warehouse_id'] => [
                        'quantity' => $variationInput['stock_quantity'] ?? 0,
                        'bin_location' => $fields['bin_location'] ?? null,
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
            'manage_stock' => $variationInput['manage_stock'] ?? false,
            'stock_quantity' => $variationInput['stock_quantity'] ?? 0,
            'type' => 'variation',
            'parent_id' => $product->id,
            'attributes' => $attributes,
            'status' => 'published',
            'brand_id' => $product->brand_id,
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
        return $product->load(['brand', 'categories', 'warehouses', 'variations']);
    }
}
