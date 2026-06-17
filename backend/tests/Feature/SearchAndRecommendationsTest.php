<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\ProductService\CustomersAlsoBought;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class SearchAndRecommendationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_search_returns_database_meta_and_facets(): void
    {
        Config::set('search.driver', 'database');

        $seller = User::factory()->create(['role' => 'seller']);
        $brand = Brand::create(['user_id' => $seller->id, 'name' => 'Acme']);
        $category = Category::create(['user_id' => $seller->id, 'name' => 'Shoes']);

        $product = Product::create([
            'user_id' => $seller->id,
            'brand_id' => $brand->id,
            'name' => 'Trail Runner Shoe',
            'slug' => 'trail-runner-shoe',
            'description' => 'Lightweight trail footwear',
            'regular_price' => 89.99,
            'stock_status' => 'instock',
            'status' => 'published',
            'type' => 'simple',
        ]);
        $product->categories()->attach($category);

        $response = $this->getJson('/api/products?search=trail');

        $response->assertOk()
            ->assertJsonPath('meta.engine', 'database')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $product->id)
            ->assertJsonPath('meta.facets.brands.0.name', 'Acme');
    }

    public function test_customers_also_bought_prefers_products_bought_together(): void
    {
        Config::set('search.driver', 'database');

        $seller = User::factory()->create(['role' => 'seller']);
        $buyer = User::factory()->create(['role' => 'buyer']);
        $category = Category::create(['user_id' => $seller->id, 'name' => 'Electronics']);

        $anchor = $this->product($seller, 'Camera', $category);
        $strong = $this->product($seller, 'Memory Card', $category);
        $weak = $this->product($seller, 'Tripod', $category);

        $this->orderWithProducts($buyer, [$anchor, $strong]);
        $this->orderWithProducts($buyer, [$anchor, $strong]);
        $this->orderWithProducts($buyer, [$anchor, $weak]);

        $recommendations = app(CustomersAlsoBought::class)->handle($anchor, 2);

        $this->assertSame([$strong->id, $weak->id], $recommendations->pluck('id')->all());
    }

    public function test_recommendations_endpoint_returns_fallback_products(): void
    {
        Config::set('search.driver', 'database');

        $seller = User::factory()->create(['role' => 'seller']);
        $category = Category::create(['user_id' => $seller->id, 'name' => 'Books']);

        $anchor = $this->product($seller, 'Novel One', $category);
        $fallback = $this->product($seller, 'Novel Two', $category);

        $response = $this->getJson("/api/products/{$anchor->id}/recommendations");

        $response->assertOk()
            ->assertJsonPath('data.0.id', $fallback->id)
            ->assertJsonPath('meta.strategy', 'customers_also_bought');
    }

    private function product(User $seller, string $name, Category $category): Product
    {
        $product = Product::create([
            'user_id' => $seller->id,
            'name' => $name,
            'slug' => str($name)->slug().'-'.uniqid(),
            'description' => $name,
            'regular_price' => 10,
            'stock_status' => 'instock',
            'status' => 'published',
            'type' => 'simple',
        ]);
        $product->categories()->attach($category);

        return $product;
    }

    /**
     * @param  list<Product>  $products
     */
    private function orderWithProducts(User $buyer, array $products): Order
    {
        $order = Order::create([
            'buyer_id' => $buyer->id,
            'total_amount' => 100,
            'status' => 'completed',
            'shipping_address' => '123 Test St',
            'billing_address' => '123 Test St',
            'payment_method' => 'Credit Card',
        ]);

        foreach ($products as $product) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'seller_id' => $product->user_id,
                'quantity' => 1,
                'price' => $product->regular_price,
            ]);
        }

        return $order;
    }
}
