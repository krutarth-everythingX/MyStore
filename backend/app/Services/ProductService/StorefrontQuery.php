<?php

namespace App\Services\ProductService;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;

class StorefrontQuery
{
    public function handle(array $filters = []): Builder
    {
        $query = Product::with(['user', 'brand', 'categories', 'variations', 'warehouses'])
            ->where('status', 'published')
            ->where('type', '!=', 'variation');

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $query->where(function (Builder $subQuery) use ($search) {
                $subQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('manufacturer', 'like', "%{$search}%")
                    ->orWhere('model_number', 'like', "%{$search}%")
                    ->orWhere('product_type', 'like', "%{$search}%")
                    ->orWhere('product_type_keyword', 'like', "%{$search}%")
                    ->orWhere('seo_search_terms', 'like', "%{$search}%")
                    ->orWhere('tags', 'like', "%{$search}%")
                    ->orWhereHas('categories', function (Builder $cQuery) use ($search) {
                        $cQuery->where('categories.name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('brand', function (Builder $bQuery) use ($search) {
                        $bQuery->where('brands.name', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['category_id'])) {
            $categoryId = $filters['category_id'];
            $query->whereHas('categories', function (Builder $subQuery) use ($categoryId) {
                $subQuery->where('categories.id', $categoryId)
                    ->orWhere('categories.parent_id', $categoryId);
            });
        }

        if (! empty($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        if (! empty($filters['seller_id'])) {
            $query->where('user_id', $filters['seller_id']);
        }

        if (! empty($filters['stock_status'])) {
            $query->where('stock_status', $filters['stock_status']);
        }

        if (! empty($filters['in_stock']) || ! empty($filters['only_in_stock'])) {
            $query->where('stock_status', 'instock');
        }

        if (isset($filters['min_price']) && $filters['min_price'] !== '') {
            $query->whereRaw('COALESCE(sale_price, regular_price) >= ?', [(float) $filters['min_price']]);
        }

        if (isset($filters['max_price']) && $filters['max_price'] !== '') {
            $query->whereRaw('COALESCE(sale_price, regular_price) <= ?', [(float) $filters['max_price']]);
        }

        return $query;
    }
}
