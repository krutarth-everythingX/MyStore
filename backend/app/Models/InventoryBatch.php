<?php

namespace App\Models;

use App\Traits\StoresUtcTimestamps;
use Illuminate\Database\Eloquent\Model;

class InventoryBatch extends Model
{
    use StoresUtcTimestamps;

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'batch_no',
        'manufactured_at',
        'expires_at',
        'quantity',
        'status',
    ];

    protected $casts = [
        'manufactured_at' => 'date',
        'expires_at' => 'date',
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
