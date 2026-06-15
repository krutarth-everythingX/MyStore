<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryReservation extends Model
{
    protected $fillable = [
        'product_id',
        'warehouse_id',
        'order_id',
        'quantity',
        'status',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
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
