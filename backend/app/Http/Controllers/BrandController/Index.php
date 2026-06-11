<?php

namespace App\Http\Controllers\BrandController;

use App\Http\Controllers\Controller;
use App\Services\BrandService\ListBrands;

class Index extends Controller
{
    public function __construct(private readonly ListBrands $listBrands)
    {
    }

    public function __invoke()
    {
        return response($this->listBrands->handle(), 200);
    }
}
