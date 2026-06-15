<?php

namespace App\Console\Commands;

use App\Models\Warehouse;
use Illuminate\Console\Command;

class BackfillWarehouseHierarchy extends Command
{
    protected $signature = 'wms:backfill-warehouse-hierarchy';

    protected $description = 'Create a default WMS zone, aisle, rack, shelf, and bin for warehouses that do not have locations yet.';

    public function handle(): int
    {
        $count = 0;

        Warehouse::with('zones')->chunkById(50, function ($warehouses) use (&$count) {
            foreach ($warehouses as $warehouse) {
                if ($warehouse->zones->isNotEmpty()) {
                    continue;
                }

                $zone = $warehouse->zones()->create([
                    'code' => 'Z-01',
                    'name' => 'Primary Storage',
                    'type' => 'storage',
                    'capacity_units' => $warehouse->capacity_units,
                    'status' => 'active',
                ]);

                $aisle = $zone->aisles()->create(['code' => 'A-01', 'name' => 'Aisle 01']);
                $rack = $aisle->racks()->create(['code' => 'R-01', 'name' => 'Rack 01']);
                $shelf = $rack->shelves()->create(['code' => 'S-01', 'name' => 'Shelf 01']);
                $shelf->bins()->create([
                    'code' => 'BIN-01',
                    'name' => 'Default Pick Bin',
                    'type' => 'pick',
                    'capacity_units' => $warehouse->capacity_units,
                    'status' => 'active',
                ]);

                $count++;
            }
        });

        $this->info("Backfilled {$count} warehouse hierarchy records.");

        return self::SUCCESS;
    }
}
