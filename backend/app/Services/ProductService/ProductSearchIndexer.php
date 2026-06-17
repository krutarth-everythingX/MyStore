<?php

namespace App\Services\ProductService;

use App\Models\Product;

class ProductSearchIndexer
{
    public function __construct(private readonly MeilisearchProductSearch $meilisearch)
    {
    }

    public function sync(Product $product): bool
    {
        if ($product->status !== 'published' || $product->type === 'variation') {
            return $this->delete($product->id);
        }

        return $this->meilisearch->upsert($product);
    }

    public function delete(int $productId): bool
    {
        return $this->meilisearch->delete($productId);
    }

    public function configure(): bool
    {
        return $this->meilisearch->configureIndex();
    }
}
