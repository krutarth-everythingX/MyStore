<?php

namespace App\Services\BrandService;

use App\Models\Brand;
use Illuminate\Database\Eloquent\Collection;

class ListBrands
{
    public function handle(): Collection
    {
        return Brand::with('user')->get();
    }
}
