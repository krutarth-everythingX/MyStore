<?php

namespace App\Services\ReviewService;

use App\Models\Review;

class ListProductReviews
{
    public function handle(int $productId): array
    {
        $reviews = Review::with('user:id,name')
            ->where('product_id', $productId)
            ->latest()
            ->get();

        $averageRating = (float) (Review::where('product_id', $productId)->avg('rating') ?: 0.0);

        return [
            'reviews' => $reviews,
            'average_rating' => round($averageRating, 1),
            'total_reviews' => $reviews->count(),
        ];
    }
}
