<?php

namespace App\Http\Controllers\CategoryController;

use App\Http\Controllers\Controller;
use App\Services\CategoryService\ListCategories;

class Index extends Controller
{
    public function __construct(private readonly ListCategories $listCategories)
    {
    }

    public function __invoke()
    {
        return response($this->listCategories->handle(), 200);
    }
}
