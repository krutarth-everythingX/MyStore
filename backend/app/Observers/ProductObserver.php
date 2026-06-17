<?php

namespace App\Observers;

use App\Models\Product;
use App\Services\ProductService\ProductSearchIndexer;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductObserver
{
    public function creating(Product $product): void
    {
        if ($product->type === 'variable' && blank($product->parent_sku_id)) {
            $product->parent_sku_id = 'PSKU-' . Str::upper(Str::random(8));
        }

        if (blank($product->country_of_origin) || blank($product->fulfillment_channel)) {
            $seller = $product->user;

            if ($seller && blank($product->country_of_origin)) {
                $product->country_of_origin = $seller->country;
            }

            if ($seller && blank($product->fulfillment_channel)) {
                $product->fulfillment_channel = $seller->default_fulfillment_channel;
            }
        }
    }

    public function created(Product $product): void
    {
        if (filled($product->mystore_product_id)) {
            return;
        }

        $product->updateQuietly([
            'mystore_product_id' => 'MYS-' . str_pad((string) $product->id, 8, '0', STR_PAD_LEFT),
        ]);
    }

    public function saved(Product $product): void
    {
        Cache::forget('search_vocabulary');
        $productId = $product->id;

        DB::afterCommit(function () use ($productId) {
            $freshProduct = Product::with(['user', 'brand', 'categories'])->find($productId);

            if ($freshProduct) {
                app(ProductSearchIndexer::class)->sync($freshProduct);
            }
        });
    }

    public function deleted(Product $product): void
    {
        Cache::forget('search_vocabulary');
        $productId = $product->id;

        DB::afterCommit(fn () => app(ProductSearchIndexer::class)->delete($productId));
    }

    public function saving(Product $product): void
    {
        if (!$product->manage_stock) {
            return;
        }

        $product->stock_status = $product->stock_quantity > 0
            ? 'instock'
            : 'outofstock';
    }
}
