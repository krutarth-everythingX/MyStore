<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecentlyViewed extends Model
{
    public $timestamps = false;

    protected $table = 'recently_viewed';

    protected $fillable = ['user_id', 'product_id', 'viewed_at'];

    public function product()
    {
        return $this->belongsTo(Product::class)->with(['brand', 'user']);
    }
}
