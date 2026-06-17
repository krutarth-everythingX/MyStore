<?php

namespace App\Services\ProductService;

use App\Enums\OrderStatus;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\DB;

class CustomersAlsoBought
{
    public function __construct(private readonly StorefrontQuery $storefrontQuery)
    {
    }

    public function handle(Product $product, int $limit = 4): EloquentCollection
    {
        $coPurchaseIds = $this->coPurchaseScores($product->id, $limit * 4);
        $recommendations = $this->productsByScore($coPurchaseIds);

        if ($recommendations->count() >= $limit) {
            return $recommendations->take($limit);
        }

        return $recommendations
            ->merge($this->categoryFallback($product, $limit, $recommendations->pluck('id')->all()))
            ->unique('id')
            ->take($limit)
            ->values();
    }

    private function coPurchaseScores(int $productId, int $limit): array
    {
        return DB::table('order_items as anchor_items')
            ->join('order_items as candidate_items', 'candidate_items.order_id', '=', 'anchor_items.order_id')
            ->join('orders', 'orders.id', '=', 'anchor_items.order_id')
            ->where('anchor_items.product_id', $productId)
            ->whereNotNull('candidate_items.product_id')
            ->where('candidate_items.product_id', '!=', $productId)
            ->whereIn('orders.status', OrderStatus::reviewEligibleValues())
            ->select(
                'candidate_items.product_id',
                DB::raw('SUM(candidate_items.quantity) as quantity_score'),
                DB::raw('COUNT(DISTINCT candidate_items.order_id) as order_score'),
            )
            ->groupBy('candidate_items.product_id')
            ->orderByDesc('order_score')
            ->orderByDesc('quantity_score')
            ->limit($limit)
            ->pluck('order_score', 'candidate_items.product_id')
            ->mapWithKeys(fn ($score, $id) => [(int) $id => (int) $score])
            ->all();
    }

    private function productsByScore(array $scores): EloquentCollection
    {
        if ($scores === []) {
            return new EloquentCollection();
        }

        $products = $this->storefrontQuery->handle()
            ->whereIn('products.id', array_keys($scores))
            ->get()
            ->keyBy('id');

        return new EloquentCollection(collect($scores)
            ->keys()
            ->map(fn (int $id) => $products->get($id))
            ->filter()
            ->values()
            ->all());
    }

    private function categoryFallback(Product $product, int $limit, array $excludedIds): EloquentCollection
    {
        $product->loadMissing('categories');

        if ($product->categories->isEmpty()) {
            return new EloquentCollection();
        }

        return $this->storefrontQuery->handle([
            'category_id' => $product->categories->first()->id,
        ])
            ->where('products.id', '!=', $product->id)
            ->whereNotIn('products.id', $excludedIds)
            ->latest('products.created_at')
            ->take($limit)
            ->get();
    }
}
