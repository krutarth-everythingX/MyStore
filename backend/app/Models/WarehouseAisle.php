<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WarehouseAisle extends Model
{
    protected $fillable = [
        'warehouse_zone_id',
        'code',
        'name',
        'sort_order',
    ];

    public function zone()
    {
        return $this->belongsTo(WarehouseZone::class, 'warehouse_zone_id');
    }

    public function racks()
    {
        return $this->hasMany(WarehouseRack::class);
    }
}
