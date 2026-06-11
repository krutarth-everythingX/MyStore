<?php

namespace App\Services\ReviewService;

use App\Enums\OrderStatus;
use App\Exceptions\ServiceException;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;

class CreateReview
{
    public function handle(int $productId, User $user, array $fields): Review
    {
        $product = Product::find($productId);

        if (! $product) {
            throw ServiceException::notFound('Product not found.');
        }

        $hasPurchased = Order::where('buyer_id', $user->id)
            ->whereIn('status', OrderStatus::reviewEligibleValues())
            ->whereHas('items', function ($query) use ($productId) {
                $query->where('product_id', $productId);
            })
            ->exists();

        if (! $hasPurchased) {
            throw ServiceException::forbidden(
                'Only verified buyers who have purchased this product can leave a review.',
            );
        }

        $alreadyReviewed = Review::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->exists();

        if ($alreadyReviewed) {
            throw ServiceException::badRequest('You have already submitted a review for this product.');
        }

        $review = Review::create([
            'user_id' => $user->id,
            'product_id' => $productId,
            'rating' => $fields['rating'],
            'comment' => $fields['comment'] ?? '',
        ]);

        return $review->load('user:id,name');
    }
}
