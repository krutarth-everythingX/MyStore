<?php

namespace App\Services\CategoryService;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

class ListCategories
{
    public function handle(?int $sellerId = null): Collection
    {
        if ($sellerId === null) {
            return Cache::remember('categories.storefront.all', 3600, fn () => $this->query()->get());
        }

        return $this->query()
            ->when($sellerId, fn ($query) => $query->where('user_id', $sellerId))
            ->get();
    }

    public function nav(int $limit = 10): Collection
    {
        return Cache::remember("categories.storefront.nav.{$limit}", 3600, fn () => (
            Category::query()
                ->select(['id', 'name', 'slug', 'parent_id'])
                ->whereNull('parent_id')
                ->orderBy('name')
                ->take($limit)
                ->get()
        ));
    }

    private function query()
    {
        return Category::with(['user', 'children', 'parent'])
            ->withCount('products')
            ->orderBy('parent_id')
            ->orderBy('name');
    }
}
