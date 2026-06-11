<?php

namespace App\Services\CategoryService;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

class ListCategories
{
    public function handle(): Collection
    {
        return Category::with(['user', 'children', 'parent'])->get();
    }
}
