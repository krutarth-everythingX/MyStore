<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\Product;
use App\Services\ProductService\ProductSearchIndexer;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('search:sync-products {--chunk=250}', function (ProductSearchIndexer $indexer) {
    $this->info('Configuring product search index...');
    $indexer->configure();

    $count = 0;
    Product::query()
        ->with(['user', 'brand', 'categories'])
        ->where('status', 'published')
        ->where('type', '!=', 'variation')
        ->chunkById((int) $this->option('chunk'), function ($products) use ($indexer, &$count) {
            foreach ($products as $product) {
                $indexer->sync($product);
                $count++;
            }

            $this->line("Synced {$count} products...");
        });

    $this->info("Product search sync complete. {$count} products indexed.");
})->purpose('Configure Meilisearch and sync published storefront products');
