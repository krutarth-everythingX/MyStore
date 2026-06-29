<?php

namespace App\Models;

use App\Traits\HasSlug;
use App\Traits\StoresUtcTimestamps;
use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    use HasSlug, StoresUtcTimestamps;

    protected $fillable = ['user_id', 'name', 'slug', 'logo', 'website_url'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
