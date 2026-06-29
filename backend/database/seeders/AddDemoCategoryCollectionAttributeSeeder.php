<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Attribute;
use Illuminate\Support\Str;

class AddDemoCategoryCollectionAttributeSeeder extends Seeder
{
    public function run()
    {
        // Find the demo seller
        $seller = User::where('email', 'samsung-a55-demo@mystore.test')->first();
        if (!$seller) {
            echo "Demo seller not found.\n";
            return;
        }

        // Find the demo product
        $product = Product::where('user_id', $seller->id)->where('sku', 'SAM-A55-5G-128GB')->first();
        if (!$product) {
            echo "Demo product not found.\n";
            return;
        }

        // 1. Create a Category
        $category = Category::create([
            'user_id' => $seller->id,
            'name' => 'Smartphones',
            'slug' => 'smartphones-' . Str::random(5),
            'description' => 'Latest 5G smartphones and mobile devices.',
            'is_active' => true,
        ]);

        // Attach category to product
        $product->categories()->attach($category->id);

        // 2. Create a Collection
        $collection = Collection::create([
            'user_id' => $seller->id,
            'title' => 'Galaxy A Series',
            'handle' => 'galaxy-a-series-' . Str::random(5),
            'description' => 'The Awesome Galaxy A series lineup.',
            'active' => true,
            'type' => 'manual',
            'product_ids' => [$product->id],
        ]);

        // 3. Create an Attribute
        Attribute::create([
            'user_id' => $seller->id,
            'name' => 'Storage Capacity',
            'applies_to' => 'product',
            'input_type' => 'dropdown',
            'options' => ['128GB', '256GB'],
            'is_required' => true,
            'is_active' => true,
        ]);
        
        Attribute::create([
            'user_id' => $seller->id,
            'name' => 'Color',
            'applies_to' => 'product',
            'input_type' => 'dropdown',
            'options' => ['Awesome Navy', 'Awesome Iceblue', 'Awesome Lilac'],
            'is_required' => true,
            'is_active' => true,
        ]);

        echo "Successfully added Category, Collection, and Attributes for the Demo Seller.\n";
    }
}
