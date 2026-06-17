<?php

namespace App\Services\ProductService;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class SearchStorefrontProducts
{
    public function __construct(
        private readonly StorefrontQuery $storefrontQuery,
        private readonly MeilisearchProductSearch $meilisearch,
    ) {
    }

    public function handle(array $filters = [], ?int $limit = null): array
    {
        $limit ??= (int) config('search.defaults.limit');

        if ($this->meilisearch->enabled()) {
            $meilisearchResult = $this->meilisearch->search($filters, $limit);

            if ($meilisearchResult !== null) {
                return [
                    'products' => $meilisearchResult['products'],
                    'meta' => [
                        'engine' => 'meilisearch',
                        'fallback' => false,
                        'total' => $meilisearchResult['total'],
                        'limit' => $limit,
                        'facets' => $this->formatMeilisearchFacets($meilisearchResult['facets']),
                        'processing_time_ms' => $meilisearchResult['processing_time_ms'],
                    ],
                ];
            }
        }

        return $this->databaseSearch($filters, $limit);
    }

    private function databaseSearch(array $filters, int $limit): array
    {
        $query = $this->storefrontQuery->handle($filters);

        $total = (clone $query)->count();
        $facets = $this->databaseFacets(clone $query);

        $this->applySort($query, $filters['sort'] ?? 'latest');

        return [
            'products' => $query->take($limit)->get(),
            'meta' => [
                'engine' => 'database',
                'fallback' => $this->meilisearch->enabled(),
                'total' => $total,
                'limit' => $limit,
                'facets' => $facets,
                'processing_time_ms' => null,
            ],
        ];
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'price-asc' => $query->orderByRaw('COALESCE(sale_price, regular_price) ASC'),
            'price-desc' => $query->orderByRaw('COALESCE(sale_price, regular_price) DESC'),
            'oldest' => $query->oldest('products.created_at'),
            default => $query->latest('products.created_at'),
        };
    }

    private function databaseFacets(Builder $query): array
    {
        $productIds = (clone $query)
            ->limit(5000)
            ->pluck('products.id')
            ->map(fn ($id) => (int) $id);

        if ($productIds->isEmpty()) {
            return [
                'brands' => [],
                'categories' => [],
                'stock_status' => [],
                'price' => ['min' => null, 'max' => null],
            ];
        }

        $brandCounts = Product::query()
            ->whereIn('id', $productIds)
            ->whereNotNull('brand_id')
            ->select('brand_id', DB::raw('COUNT(*) as aggregate'))
            ->groupBy('brand_id')
            ->pluck('aggregate', 'brand_id');

        $brands = Brand::query()
            ->whereIn('id', $brandCounts->keys())
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Brand $brand) => [
                'id' => $brand->id,
                'name' => $brand->name,
                'count' => (int) $brandCounts->get($brand->id, 0),
            ])
            ->values()
            ->all();

        $categoryCounts = DB::table('category_product')
            ->whereIn('product_id', $productIds)
            ->select('category_id', DB::raw('COUNT(*) as aggregate'))
            ->groupBy('category_id')
            ->pluck('aggregate', 'category_id');

        $categories = Category::query()
            ->whereIn('id', $categoryCounts->keys())
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id'])
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'parent_id' => $category->parent_id,
                'count' => (int) $categoryCounts->get($category->id, 0),
            ])
            ->values()
            ->all();

        $stockStatus = Product::query()
            ->whereIn('id', $productIds)
            ->select('stock_status', DB::raw('COUNT(*) as aggregate'))
            ->groupBy('stock_status')
            ->pluck('aggregate', 'stock_status')
            ->map(fn ($count) => (int) $count)
            ->all();

        $price = Product::query()
            ->whereIn('id', $productIds)
            ->selectRaw('MIN(COALESCE(sale_price, regular_price)) as min_price, MAX(COALESCE(sale_price, regular_price)) as max_price')
            ->first();

        return [
            'brands' => $brands,
            'categories' => $categories,
            'stock_status' => $stockStatus,
            'price' => [
                'min' => $price?->min_price === null ? null : (float) $price->min_price,
                'max' => $price?->max_price === null ? null : (float) $price->max_price,
            ],
        ];
    }

    private function formatMeilisearchFacets(array $facets): array
    {
        $brandCounts = collect($facets['brand_id'] ?? []);
        $categoryCounts = collect($facets['category_ids'] ?? []);

        return [
            'brands' => Brand::query()
                ->whereIn('id', $brandCounts->keys()->map(fn ($id) => (int) $id))
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Brand $brand) => [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'count' => (int) $brandCounts->get((string) $brand->id, 0),
                ])
                ->values()
                ->all(),
            'categories' => Category::query()
                ->whereIn('id', $categoryCounts->keys()->map(fn ($id) => (int) $id))
                ->orderBy('name')
                ->get(['id', 'name', 'parent_id'])
                ->map(fn (Category $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'parent_id' => $category->parent_id,
                    'count' => (int) $categoryCounts->get((string) $category->id, 0),
                ])
                ->values()
                ->all(),
            'stock_status' => collect($facets['stock_status'] ?? [])
                ->map(fn ($count) => (int) $count)
                ->all(),
            'price' => ['min' => null, 'max' => null],
        ];
    }
}
