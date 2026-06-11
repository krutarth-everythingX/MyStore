<?php

namespace App\Services\WarehouseService;

use App\Models\User;
use App\Models\Warehouse;

class CreateForSeller
{
    public function handle(array $fields, User $seller): Warehouse
    {
        return Warehouse::create([
            'user_id' => $seller->id,
            'name' => $fields['name'],
            'code' => $fields['code'],
            'address' => $fields['address'] ?? null,
            'city' => $fields['city'] ?? null,
            'state' => $fields['state'] ?? null,
            'postal_code' => $fields['postal_code'] ?? null,
            'default_carrier' => $fields['default_carrier'],
        ]);
    }
}
