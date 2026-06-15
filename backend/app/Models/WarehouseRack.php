<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WarehouseRack extends Model
{
    protected $fillable = [
        'warehouse_aisle_id',
        'code',
        'name',
        'sort_order',
    ];

    public function aisle()
    {
        return $this->belongsTo(WarehouseAisle::class, 'warehouse_aisle_id');
    }

    public function shelves()
    {
        return $this->hasMany(WarehouseShelf::class);
    }
}
