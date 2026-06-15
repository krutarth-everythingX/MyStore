<?php

namespace App\Services\CategoryService;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

class ListCategories
{
    public function handle(?int $sellerId = null): Collection
    {
        return Category::with(['user', 'children', 'parent'])
            ->when($sellerId, fn ($query) => $query->where('user_id', $sellerId))
            ->orderBy('parent_id')
            ->orderBy('name')
            ->get();
    }
}
