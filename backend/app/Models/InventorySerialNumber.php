<?php

namespace App\Models;

use App\Traits\StoresUtcTimestamps;
use Illuminate\Database\Eloquent\Model;

class InventorySerialNumber extends Model
{
    use StoresUtcTimestamps;

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'inventory_batch_id',
        'serial_no',
        'status',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function batch()
    {
        return $this->belongsTo(InventoryBatch::class, 'inventory_batch_id');
    }
}
