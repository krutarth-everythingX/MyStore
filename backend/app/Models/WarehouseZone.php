<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WarehouseZone extends Model
{
    protected $fillable = [
        'warehouse_id',
        'code',
        'name',
        'type',
        'capacity_units',
        'status',
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function aisles()
    {
        return $this->hasMany(WarehouseAisle::class);
    }
}
