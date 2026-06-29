<?php

namespace App\Models;

use App\Traits\StoresUtcTimestamps;
use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    use StoresUtcTimestamps;

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'warehouse_bin_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'type',
        'quantity',
        'quantity_after',
        'reference_type',
        'reference_no',
        'reason',
        'unit_cost',
        'created_by',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function fromWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }
}
