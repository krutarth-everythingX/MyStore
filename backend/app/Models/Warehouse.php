<?php

namespace App\Models;

use App\Traits\StoresUtcTimestamps;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use StoresUtcTimestamps;

    protected $fillable = [
        'user_id',
        'name',
        'code',
        'type',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'timezone',
        'working_hours',
        'capacity_units',
        'notes',
        'default_carrier',
        'status',
    ];

    protected $casts = [
        'working_hours' => 'array',
        'capacity_units' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'warehouse_product')
                    ->withPivot(
                        'quantity',
                        'reserved_quantity',
                        'available_quantity',
                        'safety_stock',
                        'bin_location',
                        'warehouse_bin_id',
                        'unit_cost',
                        'stock_status',
                    )
                    ->withTimestamps();
    }

    public function zones()
    {
        return $this->hasMany(WarehouseZone::class);
    }

    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class);
    }
}
