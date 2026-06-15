<?php

namespace App\Services\ReviewService;

use App\Exceptions\ServiceException;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;

class CreateReview
{
    public function __construct(private readonly ReviewEligibility $reviewEligibility)
    {
    }

    public function handle(int $productId, User $user, array $fields): Review
    {
        $product = Product::find($productId);

        if (! $product) {
            throw ServiceException::notFound('Product not found.');
        }

        $targetProduct = $this->reviewEligibility->resolveTargetProduct($product);
        $hasPurchased = $this->reviewEligibility->hasPurchased($user, $targetProduct);

        if (! $hasPurchased) {
            throw ServiceException::forbidden(
                'Only verified buyers who have purchased this product can leave a review.',
            );
        }

        $alreadyReviewed = Review::where('user_id', $user->id)
            ->where('product_id', $targetProduct->id)
            ->exists();

        if ($alreadyReviewed) {
            throw ServiceException::badRequest('You have already submitted a review for this product.');
        }

        $review = Review::create([
            'user_id' => $user->id,
            'product_id' => $targetProduct->id,
            'rating' => $fields['rating'],
            'comment' => $fields['comment'] ?? '',
        ]);

        return $review->load('user:id,name');
    }
}
