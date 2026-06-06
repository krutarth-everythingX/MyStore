<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'user_id', 'name', 'slug', 'description', 'short_description', 'status',
        'featured_image', 'gallery_images', 'regular_price', 'sale_price',
        'tax_status', 'tax_class', 'sku', 'manage_stock', 'stock_quantity',
        'stock_status', 'low_stock_amount', 'sold_individually', 'weight',
        'length', 'width', 'height', 'shipping_class', 'attributes',
        'purchase_note', 'menu_order', 'enable_reviews', 'brand_id', 'tags',
        'type', 'parent_id', 'weight_kg', 'length_cm', 'width_cm', 'height_cm'
    ];

    protected $casts = [
        'gallery_images' => 'array',
        'attributes' => 'array',
        'tags' => 'array',
        'manage_stock' => 'boolean',
        'sold_individually' => 'boolean',
        'enable_reviews' => 'boolean',
        'regular_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'weight' => 'decimal:2',
        'length' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'weight_kg' => 'decimal:2',
        'length_cm' => 'decimal:2',
        'width_cm' => 'decimal:2',
        'height_cm' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'category_product');
    }

    public function warehouses()
    {
        return $this->belongsToMany(Warehouse::class, 'warehouse_product')
                    ->withPivot('quantity', 'bin_location')
                    ->withTimestamps();
    }

    public function parent()
    {
        return $this->belongsTo(Product::class, 'parent_id');
    }

    public function variations()
    {
        return $this->hasMany(Product::class, 'parent_id');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}
