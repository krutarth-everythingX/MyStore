<?php

use App\Models\User;
use App\Models\Product;
use Illuminate\Support\Str;

$seller = User::where('email', 'hybrid_seller@example.com')->first();
if ($seller) {
    // 1. Service Product
    Product::firstOrCreate(
        ['user_id' => $seller->id, 'name' => 'Network Setup & Configuration'],
        [
            'slug' => 'network-setup-and-configuration-' . Str::random(5),
            'description' => 'Complete office network setup including routers, switches, and secure access points.',
            'short_description' => 'Professional IT network setup.',
            'status' => 'published',
            'mystore_product_id' => 'SRV-' . mt_rand(1000, 9999),
            'regular_price' => 299.00,
            'sku' => 'SRV-NET-01',
            'type' => 'service',
        ]
    );

    // 2. Simple Product
    Product::firstOrCreate(
        ['user_id' => $seller->id, 'name' => 'ThinkPad Business Laptop'],
        [
            'slug' => 'thinkpad-business-laptop-' . Str::random(5),
            'description' => 'High performance business laptop with 16GB RAM and 512GB SSD.',
            'short_description' => 'Reliable laptop for business.',
            'status' => 'published',
            'mystore_product_id' => 'PRD-' . mt_rand(1000, 9999),
            'regular_price' => 1299.00,
            'sku' => 'LAP-TP-01',
            'type' => 'simple',
            'manage_stock' => true,
            'stock_quantity' => 10,
        ]
    );

    echo "Sample products and services created for hybrid_seller!\n";
} else {
    echo "Seller not found.\n";
}
