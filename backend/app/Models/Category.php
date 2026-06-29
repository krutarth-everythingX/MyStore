<?php

namespace App\Models;

use App\Traits\HasSlug;
use App\Traits\StoresUtcTimestamps;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasSlug, StoresUtcTimestamps;

    protected $fillable = ['user_id', 'name', 'slug', 'parent_id', 'type', 'description', 'image', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'category_product');
    }
}
