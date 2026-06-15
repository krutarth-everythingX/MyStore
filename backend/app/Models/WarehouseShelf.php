<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WarehouseShelf extends Model
{
    protected $fillable = [
        'warehouse_rack_id',
        'code',
        'name',
        'sort_order',
    ];

    public function rack()
    {
        return $this->belongsTo(WarehouseRack::class, 'warehouse_rack_id');
    }

    public function bins()
    {
        return $this->hasMany(WarehouseBin::class);
    }
}
