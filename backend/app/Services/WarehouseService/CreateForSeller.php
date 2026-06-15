<?php

namespace App\Services\WarehouseService;

use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class CreateForSeller
{
    public function handle(array $fields, User $seller): Warehouse
    {
        return DB::transaction(function () use ($fields, $seller) {
            $warehouse = Warehouse::create([
                'user_id' => $seller->id,
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
                'status' => 'active',
            ]);

            $zone = $warehouse->zones()->create([
                'code' => 'Z-01',
                'name' => 'Primary Storage',
                'type' => 'storage',
                'capacity_units' => $fields['capacity_units'] ?? null,
                'status' => 'active',
            ]);

            $aisle = $zone->aisles()->create(['code' => 'A-01', 'name' => 'Aisle 01']);
            $rack = $aisle->racks()->create(['code' => 'R-01', 'name' => 'Rack 01']);
            $shelf = $rack->shelves()->create(['code' => 'S-01', 'name' => 'Shelf 01']);
            $shelf->bins()->create([
                'code' => 'BIN-01',
                'name' => 'Default Pick Bin',
                'type' => 'pick',
                'capacity_units' => $fields['capacity_units'] ?? null,
                'status' => 'active',
            ]);

            return $warehouse->load('zones.aisles.racks.shelves.bins');
        });
    }
}
