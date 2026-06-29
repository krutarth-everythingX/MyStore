<?php

namespace App\Services\CategoryService;

use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class CreateForSeller
{
    public function handle(array $fields, User $seller): Category
    {
        if (! empty($fields['parent_id'])) {
            Category::where('user_id', $seller->id)->findOrFail($fields['parent_id']);
        }

        $category = Category::create([
            'user_id' => $seller->id,
            'name' => $fields['name'],
            'parent_id' => $fields['parent_id'] ?? null,
            'type' => $fields['type'] ?? 'product',
            'description' => $fields['description'] ?? null,
            'image' => $fields['image'] ?? null,
            'is_active' => (bool) ($fields['is_active'] ?? true),
        ]);

        Cache::forget('categories.storefront.all');
        Cache::forget('categories.storefront.nav.10');

        return $category->load('parent');
    }
}
