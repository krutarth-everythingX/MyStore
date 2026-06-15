<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryAdjustment extends Model
{
    protected $fillable = [
        'adjustment_no',
        'product_id',
        'warehouse_id',
        'warehouse_bin_id',
        'system_quantity',
        'counted_quantity',
        'variance_quantity',
        'reason',
        'status',
        'created_by',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
