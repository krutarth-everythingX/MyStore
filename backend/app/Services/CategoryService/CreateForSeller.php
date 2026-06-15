<?php

namespace App\Services\CategoryService;

use App\Models\Category;
use App\Models\User;

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
        ]);

        return $category->load('parent');
    }
}
