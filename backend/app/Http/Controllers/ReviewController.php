<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Review;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Get all reviews for a product.
     */
    public function index($productId)
    {
        $reviews = Review::with('user:id,name')
            ->where('product_id', $productId)
            ->latest()
            ->get();

        $averageRating = Review::where('product_id', $productId)->avg('rating') ?: 0.0;
        $totalReviews = $reviews->count();

        return response([
            'reviews' => $reviews,
            'average_rating' => round($averageRating, 1),
            'total_reviews' => $totalReviews
        ], 200);
    }

    /**
     * Submit a review for a product.
     */
    public function store(Request $request, $productId)
    {
        $fields = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $product = Product::find($productId);

        if (!$product) {
            return response(['message' => 'Product not found.'], 404);
        }

        // Verify that the user has actually purchased the product
        $hasPurchased = Order::where('buyer_id', $user->id)
            ->whereIn('status', OrderStatus::reviewEligibleValues()) // purchased and paid
            ->whereHas('items', function ($query) use ($productId) {
                $query->where('product_id', $productId);
            })
            ->exists();

        if (!$hasPurchased) {
            return response([
                'message' => 'Only verified buyers who have purchased this product can leave a review.'
            ], 403);
        }

        // Check if user has already reviewed this product
        $alreadyReviewed = Review::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->exists();

        if ($alreadyReviewed) {
            return response([
                'message' => 'You have already submitted a review for this product.'
            ], 400);
        }

        $review = Review::create([
            'user_id' => $user->id,
            'product_id' => $productId,
            'rating' => $fields['rating'],
            'comment' => $fields['comment'] ?? '',
        ]);

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Review submitted successfully!');
        }

        return response($review->load('user:id,name'), 201);
    }
}
