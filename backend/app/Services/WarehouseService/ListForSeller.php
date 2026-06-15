<?php

namespace App\Services\WarehouseService;

use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Collection;

class ListForSeller
{
    public function handle(int $sellerId): Collection
    {
        return Warehouse::with('zones.aisles.racks.shelves.bins')
            ->where('user_id', $sellerId)
            ->get();
    }
}
