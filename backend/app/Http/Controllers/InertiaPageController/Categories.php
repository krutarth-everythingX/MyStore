<?php

namespace App\Http\Controllers\InertiaPageController;

use App\Http\Controllers\Controller;
use App\Services\CategoryService\ListCategories;
use Inertia\Inertia;

class Categories extends Controller
{
    public function __construct(private readonly ListCategories $listCategories)
    {
    }

    public function __invoke()
    {
        return Inertia::render('AllCategories', [
            'categories' => $this->listCategories->handle(),
        ]);
    }
}
