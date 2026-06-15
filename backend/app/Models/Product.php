<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'user_id', 'name', 'slug', 'description', 'short_description', 'status',
        'featured_image', 'gallery_images', 'mystore_product_id', 'manufacturer',
        'model_number', 'country_of_origin', 'product_type', 'product_type_keyword',
        'target_gender', 'recommended_age', 'condition', 'fulfillment_channel',
        'regular_price', 'sale_price', 'tax_status', 'tax_class', 'sku',
        'parent_sku_id', 'manage_stock', 'stock_quantity', 'stock_status',
        'low_stock_amount', 'sold_individually', 'weight', 'length', 'width',
        'height', 'weight_kg', 'length_cm', 'width_cm', 'height_cm',
        'package_weight_kg', 'package_length_cm', 'package_width_cm',
        'package_height_cm', 'shipping_class', 'attributes', 'bullet_points',
        'size_chart', 'safety_compliance', 'seo_search_terms', 'whats_inside_box',
        'purchase_note', 'menu_order', 'enable_reviews', 'brand_id', 'tags',
        'grouped_product_ids', 'external_url', 'external_button_text',
        'type', 'parent_id',
    ];

    protected $appends = ['image_url'];

    protected $casts = [
        'gallery_images' => 'array',
        'attributes' => 'array',
        'bullet_points' => 'array',
        'size_chart' => 'array',
        'safety_compliance' => 'array',
        'seo_search_terms' => 'array',
        'whats_inside_box' => 'array',
        'tags' => 'array',
        'grouped_product_ids' => 'array',
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
        'package_weight_kg' => 'decimal:2',
        'package_length_cm' => 'decimal:2',
        'package_width_cm' => 'decimal:2',
        'package_height_cm' => 'decimal:2',
    ];

    public function getImageUrlAttribute(): ?string
    {
        return $this->featured_image;
    }

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
                    ->withPivot(
                        'quantity',
                        'reserved_quantity',
                        'available_quantity',
                        'safety_stock',
                        'bin_location',
                        'warehouse_bin_id',
                        'unit_cost',
                        'stock_status',
                    )
                    ->withTimestamps();
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class);
    }

    public function inventoryAdjustments()
    {
        return $this->hasMany(InventoryAdjustment::class);
    }

    public function inventoryReservations()
    {
        return $this->hasMany(InventoryReservation::class);
    }

    public function inventoryBatches()
    {
        return $this->hasMany(InventoryBatch::class);
    }

    public function inventorySerialNumbers()
    {
        return $this->hasMany(InventorySerialNumber::class);
    }

    public function parent()
    {
        return $this->belongsTo(Product::class, 'parent_id');
    }

    public function variations()
    {
        return $this->hasMany(Product::class, 'parent_id');
    }

    public function groupedProducts()
    {
        $ids = array_values(array_filter($this->grouped_product_ids ?? []));

        if ($ids === []) {
            return collect();
        }

        return static::whereIn('id', $ids)->get();
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}
