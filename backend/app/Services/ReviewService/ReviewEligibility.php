<?php

namespace App\Services\ReviewService;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;

class ReviewEligibility
{
    public function evaluate(Product $product, ?User $user): array
    {
        $targetProduct = $this->resolveTargetProduct($product);

        if (! $user || $user->role !== 'buyer') {
            return [
                'can_review' => false,
                'has_purchased' => false,
                'has_reviewed' => false,
                'target_product_id' => $targetProduct->id,
            ];
        }

        $hasPurchased = $this->hasPurchased($user, $targetProduct);
        $hasReviewed = Review::where('user_id', $user->id)
            ->where('product_id', $targetProduct->id)
            ->exists();

        return [
            'can_review' => $hasPurchased && ! $hasReviewed,
            'has_purchased' => $hasPurchased,
            'has_reviewed' => $hasReviewed,
            'target_product_id' => $targetProduct->id,
        ];
    }

    public function resolveTargetProduct(Product $product): Product
    {
        if ($product->type === 'variation' && $product->parent_id) {
            return $product->parent ?: Product::find($product->parent_id) ?: $product;
        }

        return $product;
    }

    public function hasPurchased(User $user, Product $product): bool
    {
        return Order::where('buyer_id', $user->id)
            ->whereIn('status', OrderStatus::reviewEligibleValues())
            ->whereHas('items', function ($query) use ($product) {
                $query->whereIn('product_id', $this->eligibleProductIds($product));
            })
            ->exists();
    }

    protected function eligibleProductIds(Product $product): array
    {
        $ids = [$product->id];

        if ($product->type === 'variable') {
            $variationIds = $product->relationLoaded('variations')
                ? $product->variations->pluck('id')->all()
                : Product::where('parent_id', $product->id)->pluck('id')->all();

            $ids = [...$ids, ...$variationIds];
        }

        return array_values(array_unique(array_filter($ids)));
    }
}
