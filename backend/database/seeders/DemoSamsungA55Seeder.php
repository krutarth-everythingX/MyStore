<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\InventoryTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Str;

class DemoSamsungA55Seeder extends Seeder
{
    public function run()
    {
        // 1. Create a Seller
        $seller = User::create([
            'name' => 'Samsung Official Demo',
            'email' => 'samsung-a55-demo@mystore.test',
            'password' => bcrypt('password'),
            'role' => 'seller',
            'brand_name' => 'Samsung Official Demo Store',
            'phone' => '1234509876',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);

        // 2. Create a Warehouse
        $warehouse = Warehouse::create([
            'user_id' => $seller->id,
            'name' => 'Samsung Main Warehouse',
            'code' => 'SAMSUNG-WH-01',
            'address' => '123 Tech Lane',
            'city' => 'Tech City',
            'state' => 'TS',
            'country' => 'US',
            'postal_code' => '12345',
            'status' => 'active',
        ]);

        // 3. Create the Product
        $product = Product::create([
            'user_id' => $seller->id,
            'name' => 'Samsung Galaxy A55 5G',
            'slug' => 'samsung-galaxy-a55-5g-'.Str::random(5),
            'description' => "The Samsung Galaxy A55 5G offers a seamless mobile experience with a stunning display, powerful processor, and an advanced camera system. It is designed to keep you connected and productive on the go. Experience ultra-fast speeds and ultra-low latency with 5G connectivity.\n\nEnjoy vibrant details with the Super AMOLED display. Capture stunning photos and videos in any lighting condition.",
            'short_description' => 'Premium smartphone with 5G connectivity, Awesome Nightography, and Knox Security.',
            'status' => 'published',
            'featured_image' => '/Demo Products/Samsung A55 5G/main.webp',
            'gallery_images' => [
                '/Demo Products/Samsung A55 5G/camera.webp',
                '/Demo Products/Samsung A55 5G/security.avif',
                '/Demo Products/Samsung A55 5G/close look.avif',
                '/Demo Products/Samsung A55 5G/variants iamge.jpg',
            ],
            'regular_price' => 399.99,
            'sale_price' => 349.99,
            'price_currency' => 'USD',
            'sku' => 'SAM-A55-5G-128GB',
            'manage_stock' => true,
            'stock_quantity' => 100,
            'stock_status' => 'in_stock',
            'type' => 'simple',
            'whats_inside_box' => ['Smartphone', 'Data Cable (C to C)', 'Ejection Pin', 'Quick Start Guide'],
            'bullet_points' => [
                ['title' => 'Display', 'value' => '6.6-inch Super AMOLED'],
                ['title' => 'Camera', 'value' => '50MP Main with OIS'],
                ['title' => 'Battery', 'value' => '5000mAh with 25W Fast Charging'],
                ['title' => 'Security', 'value' => 'Samsung Knox Vault'],
            ]
        ]);
        
        // Attach warehouse stock
        $product->warehouses()->attach($warehouse->id, [
            'quantity' => 100,
            'available_quantity' => 100,
            'unit_cost' => 250.00,
            'stock_status' => 'in_stock',
        ]);

        // 4. Create Stock Entry (InventoryTransaction)
        InventoryTransaction::create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'purchase',
            'quantity' => 100,
            'quantity_after' => 100,
            'reference_type' => 'initial_stock',
            'reference_no' => 'INIT-001',
            'reason' => 'Initial stock for demo product',
            'unit_cost' => 250.00,
            'created_by' => $seller->id,
        ]);

        // 5. Create a Buyer
        $buyer = User::create([
            'name' => 'Demo Buyer A55',
            'email' => 'buyer-samsung-a55@demo.test',
            'password' => bcrypt('password'),
            'role' => 'buyer',
            'phone' => '0987612345',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);

        // 6. Create an Order
        $order = Order::create([
            'buyer_id' => $buyer->id,
            'buyer_phone' => $buyer->phone,
            'total_amount' => 349.99,
            'currency' => 'USD',
            'status' => 'completed',
            'shipping_address' => '456 Buyer St, Buyertown, BT 67890',
            'payment_method' => 'Credit Card',
            'shipping_cost' => 0,
            'fulfillment_channel' => 'Seller Fulfilled',
        ]);

        // 7. Create OrderItem
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'seller_id' => $seller->id,
            'quantity' => 1,
            'price' => 349.99,
            'currency' => 'USD',
        ]);
        
        // Update Inventory to reflect the order
        $product->decrement('stock_quantity', 1);
        $product->warehouses()->updateExistingPivot($warehouse->id, [
            'quantity' => 99,
            'available_quantity' => 99,
        ]);
        
        InventoryTransaction::create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'type' => 'sale',
            'quantity' => -1,
            'quantity_after' => 99,
            'reference_type' => 'order',
            'reference_no' => 'ORD-'.$order->id,
            'reason' => 'Order fulfilled',
            'unit_cost' => 250.00,
            'created_by' => $seller->id,
        ]);
        
    }
}
