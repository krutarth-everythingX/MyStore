<?php

namespace App\Services\ProductService;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;

class SearchSuggestions
{
    public function __construct(private readonly MeilisearchProductSearch $meilisearch)
    {
    }

    public function handle(string $query, int $limit = 8): array
    {
        $query = trim($query);

        if ($query === '') {
            return [];
        }

        $meilisearchSuggestions = $this->meilisearch->suggestions($query, $limit);

        if ($meilisearchSuggestions !== []) {
            return $meilisearchSuggestions;
        }

        $products = Product::query()
            ->with('brand')
            ->where('status', 'published')
            ->where('type', '!=', 'variation')
            ->where(function ($subQuery) use ($query) {
                $subQuery->where('name', 'like', "%{$query}%")
                    ->orWhere('manufacturer', 'like', "%{$query}%")
                    ->orWhere('product_type', 'like', "%{$query}%");
            })
            ->latest()
            ->take($limit)
            ->get()
            ->map(fn (Product $product) => [
                'type' => 'product',
                'id' => $product->id,
                'label' => $product->name,
                'subtitle' => $product->brand?->name,
                'image_url' => $product->image_url,
                'price' => (float) ($product->sale_price ?? $product->regular_price ?? 0),
                'url' => '/products/'.$product->id,
            ]);

        $remaining = max(0, $limit - $products->count());

        $categories = Category::query()
            ->where('name', 'like', "%{$query}%")
            ->orderBy('name')
            ->take($remaining)
            ->get(['id', 'name'])
            ->map(fn (Category $category) => [
                'type' => 'category',
                'id' => $category->id,
                'label' => $category->name,
                'subtitle' => 'Category',
                'image_url' => null,
                'price' => null,
                'url' => '/categories/'.$category->id,
            ]);

        $remaining = max(0, $remaining - $categories->count());

        $brands = Brand::query()
            ->where('name', 'like', "%{$query}%")
            ->orderBy('name')
            ->take($remaining)
            ->get(['id', 'name'])
            ->map(fn (Brand $brand) => [
                'type' => 'brand',
                'id' => $brand->id,
                'label' => $brand->name,
                'subtitle' => 'Brand',
                'image_url' => null,
                'price' => null,
                'url' => '/categories?brand_id='.$brand->id.'&search='.urlencode($brand->name),
            ]);

        return $products
            ->concat($categories)
            ->concat($brands)
            ->take($limit)
            ->values()
            ->all();
    }
}
