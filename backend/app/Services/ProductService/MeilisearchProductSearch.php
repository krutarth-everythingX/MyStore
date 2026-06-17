<?php

namespace App\Services\ProductService;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Throwable;

class MeilisearchProductSearch
{
    public function enabled(): bool
    {
        return config('search.driver') === 'meilisearch'
            && filled(config('search.meilisearch.host'));
    }

    public function search(array $filters = [], ?int $limit = null): ?array
    {
        if (! $this->enabled()) {
            return null;
        }

        $payload = [
            'q' => trim((string) ($filters['search'] ?? '')),
            'limit' => $limit ?? config('search.defaults.limit'),
            'filter' => $this->buildFilter($filters),
            'facets' => ['brand_id', 'category_ids', 'stock_status'],
            'sort' => $this->buildSort($filters),
        ];

        try {
            $response = $this->request()
                ->post($this->indexUrl().'/search', array_filter($payload, static fn ($value) => $value !== [] && $value !== ''));
        } catch (Throwable $exception) {
            report($exception);

            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $body = $response->json();
        $ids = collect($body['hits'] ?? [])
            ->pluck('id')
            ->filter()
            ->map(static fn ($id) => (int) $id)
            ->values();

        return [
            'products' => $this->loadProductsInSearchOrder($ids),
            'facets' => $body['facetDistribution'] ?? [],
            'total' => (int) ($body['estimatedTotalHits'] ?? $ids->count()),
            'processing_time_ms' => $body['processingTimeMs'] ?? null,
        ];
    }

    public function suggestions(string $query, int $limit = 6): array
    {
        if (! $this->enabled() || trim($query) === '') {
            return [];
        }

        try {
            $response = $this->request()->post($this->indexUrl().'/search', [
                'q' => $query,
                'limit' => $limit,
                'attributesToRetrieve' => ['id', 'name', 'brand_name', 'categories', 'image_url', 'price'],
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return [];
        }

        if (! $response->successful()) {
            return [];
        }

        return collect($response->json('hits', []))
            ->map(static fn (array $hit) => [
                'type' => 'product',
                'id' => $hit['id'] ?? null,
                'label' => $hit['name'] ?? '',
                'subtitle' => $hit['brand_name'] ?? collect($hit['categories'] ?? [])->first(),
                'image_url' => $hit['image_url'] ?? null,
                'price' => $hit['price'] ?? null,
                'url' => isset($hit['id']) ? '/products/'.$hit['id'] : null,
            ])
            ->filter(fn (array $item) => filled($item['id']) && filled($item['label']))
            ->values()
            ->all();
    }

    public function upsert(Product $product): bool
    {
        if (! $this->enabled()) {
            return false;
        }

        try {
            $response = $this->request()->post($this->indexUrl().'/documents?primaryKey=id', [
                $this->documentFor($product),
            ]);

            return $response->successful();
        } catch (Throwable $exception) {
            report($exception);

            return false;
        }
    }

    public function delete(int $productId): bool
    {
        if (! $this->enabled()) {
            return false;
        }

        try {
            $response = $this->request()->delete($this->indexUrl().'/documents/'.$productId);

            return $response->successful();
        } catch (Throwable $exception) {
            report($exception);

            return false;
        }
    }

    public function configureIndex(): bool
    {
        if (! $this->enabled()) {
            return false;
        }

        try {
            $this->ensureIndexExists();

            $response = $this->request()->patch($this->indexUrl().'/settings', [
                'searchableAttributes' => [
                    'name',
                    'brand_name',
                    'categories',
                    'manufacturer',
                    'model_number',
                    'product_type',
                    'product_type_keyword',
                    'tags',
                    'seo_search_terms',
                    'description',
                    'short_description',
                ],
                'filterableAttributes' => [
                    'status',
                    'type',
                    'brand_id',
                    'category_ids',
                    'seller_id',
                    'stock_status',
                    'price',
                ],
                'sortableAttributes' => ['price', 'created_at', 'updated_at'],
                'displayedAttributes' => ['*'],
                'typoTolerance' => [
                    'enabled' => true,
                    'minWordSizeForTypos' => [
                        'oneTypo' => 4,
                        'twoTypos' => 8,
                    ],
                ],
            ]);

            return $response->successful();
        } catch (Throwable $exception) {
            report($exception);

            return false;
        }
    }

    public function documentFor(Product $product): array
    {
        $product->loadMissing(['user', 'brand', 'categories']);

        $price = (float) ($product->sale_price ?? $product->regular_price ?? 0);

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            'short_description' => $product->short_description,
            'status' => $product->status,
            'type' => $product->type,
            'image_url' => $product->image_url,
            'brand_id' => $product->brand_id,
            'brand_name' => $product->brand?->name,
            'seller_id' => $product->user_id,
            'seller_name' => $product->user?->brand_name ?: $product->user?->name,
            'category_ids' => $product->categories->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
            'categories' => $product->categories->pluck('name')->values()->all(),
            'manufacturer' => $product->manufacturer,
            'model_number' => $product->model_number,
            'product_type' => $product->product_type,
            'product_type_keyword' => $product->product_type_keyword,
            'tags' => $this->stringList($product->tags),
            'seo_search_terms' => $this->stringList($product->seo_search_terms),
            'attributes' => $this->attributeTerms($product->attributes),
            'regular_price' => (float) ($product->regular_price ?? 0),
            'sale_price' => $product->sale_price === null ? null : (float) $product->sale_price,
            'price' => $price,
            'stock_status' => $product->stock_status,
            'created_at' => optional($product->created_at)->timestamp,
            'updated_at' => optional($product->updated_at)->timestamp,
        ];
    }

    private function loadProductsInSearchOrder(Collection $ids): EloquentCollection
    {
        if ($ids->isEmpty()) {
            return new EloquentCollection();
        }

        $products = Product::with(['user', 'brand', 'categories', 'variations', 'warehouses'])
            ->whereIn('id', $ids->all())
            ->get()
            ->keyBy('id');

        return new EloquentCollection($ids
            ->map(fn (int $id) => $products->get($id))
            ->filter()
            ->values()
            ->all());
    }

    private function buildFilter(array $filters): array
    {
        $filter = [
            'status = "published"',
            'type != "variation"',
        ];

        if (filled($filters['category_id'] ?? null)) {
            $categoryIds = Category::query()
                ->where('id', (int) $filters['category_id'])
                ->orWhere('parent_id', (int) $filters['category_id'])
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->values()
                ->all();

            if ($categoryIds !== []) {
                $filter[] = '('.collect($categoryIds)
                    ->map(fn (int $id) => 'category_ids = '.$id)
                    ->implode(' OR ').')';
            }
        }

        if (filled($filters['brand_id'] ?? null)) {
            $filter[] = 'brand_id = '.(int) $filters['brand_id'];
        }

        if (filled($filters['seller_id'] ?? null)) {
            $filter[] = 'seller_id = '.(int) $filters['seller_id'];
        }

        if (filled($filters['stock_status'] ?? null)) {
            $filter[] = 'stock_status = "'.$this->escapeFilterValue((string) $filters['stock_status']).'"';
        }

        if (($filters['in_stock'] ?? false) || ($filters['only_in_stock'] ?? false)) {
            $filter[] = 'stock_status = "instock"';
        }

        if (filled($filters['min_price'] ?? null)) {
            $filter[] = 'price >= '.(float) $filters['min_price'];
        }

        if (filled($filters['max_price'] ?? null)) {
            $filter[] = 'price <= '.(float) $filters['max_price'];
        }

        return $filter;
    }

    private function buildSort(array $filters): array
    {
        return match ($filters['sort'] ?? 'latest') {
            'price-asc' => ['price:asc'],
            'price-desc' => ['price:desc'],
            'oldest' => ['created_at:asc'],
            default => ['created_at:desc'],
        };
    }

    private function request()
    {
        $request = Http::timeout(config('search.defaults.timeout'));

        if (filled(config('search.meilisearch.key'))) {
            $request = $request->withToken(config('search.meilisearch.key'));
        }

        return $request;
    }

    private function ensureIndexExists(): void
    {
        $response = $this->request()->post(rtrim(config('search.meilisearch.host'), '/').'/indexes', [
            'uid' => config('search.meilisearch.products_index'),
            'primaryKey' => 'id',
        ]);

        if (! $response->successful() && $response->status() !== 400) {
            $response->throw();
        }
    }

    private function indexUrl(): string
    {
        return rtrim(config('search.meilisearch.host'), '/').'/indexes/'.config('search.meilisearch.products_index');
    }

    private function stringList(mixed $value): array
    {
        if (! is_array($value)) {
            return filled($value) ? [(string) $value] : [];
        }

        return collect($value)
            ->flatten()
            ->filter(fn ($item) => filled($item))
            ->map(fn ($item) => (string) $item)
            ->values()
            ->all();
    }

    private function attributeTerms(mixed $attributes): array
    {
        if (! is_array($attributes)) {
            return [];
        }

        return collect($attributes)
            ->flatMap(function ($attribute) {
                if (is_array($attribute)) {
                    return collect($attribute)->flatten();
                }

                return [$attribute];
            })
            ->filter(fn ($item) => filled($item))
            ->map(fn ($item) => (string) $item)
            ->values()
            ->all();
    }

    private function escapeFilterValue(string $value): string
    {
        return str_replace('"', '\"', $value);
    }
}
