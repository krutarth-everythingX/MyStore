<?php

namespace App\Services\BrandService;

use App\Models\Brand;
use App\Models\User;

class CreateForSeller
{
    public function handle(array $fields, User $seller): Brand
    {
        return Brand::create([
            'user_id' => $seller->id,
            'name' => $fields['name'],
            'logo' => $fields['logo'] ?? null,
            'website_url' => $fields['website_url'] ?? null,
        ]);
    }
}
