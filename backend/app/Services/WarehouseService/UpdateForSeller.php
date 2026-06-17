<?php

namespace App\Services\WarehouseService;

use App\Models\User;
use App\Models\Warehouse;

class UpdateForSeller
{
    public function handle(Warehouse $warehouse, array $fields, User $seller): Warehouse
    {
        $warehouse->update([
            'name' => $fields['name'],
            'code' => $fields['code'],
            'type' => $fields['type'] ?? 'fulfillment',
            'address' => $fields['address'] ?? null,
            'city' => $fields['city'] ?? null,
            'state' => $fields['state'] ?? null,
            'postal_code' => $fields['postal_code'] ?? null,
            'country' => $fields['country'] ?? $seller->country,
            'timezone' => $fields['timezone'] ?? null,
            'capacity_units' => $fields['capacity_units'] ?? null,
            'notes' => $fields['notes'] ?? null,
            'default_carrier' => $fields['default_carrier'],
        ]);

        return $warehouse;
    }
}
