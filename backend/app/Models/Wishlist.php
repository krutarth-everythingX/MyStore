<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Wishlist extends Model
{
    protected $fillable = ['user_id', 'product_id'];

    public function product()
    {
        return $this->belongsTo(Product::class)->with(['brand', 'user']);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
