<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WarehouseBin extends Model
{
    protected $fillable = [
        'warehouse_shelf_id',
        'code',
        'name',
        'type',
        'capacity_units',
        'status',
    ];

    public function shelf()
    {
        return $this->belongsTo(WarehouseShelf::class, 'warehouse_shelf_id');
    }
}
