<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    protected $fillable = ['user_id', 'name', 'code', 'address', 'city', 'state', 'postal_code', 'default_carrier'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'warehouse_product')
                    ->withPivot('quantity', 'bin_location')
                    ->withTimestamps();
    }
}
