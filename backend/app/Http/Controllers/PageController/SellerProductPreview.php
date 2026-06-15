<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\ProductService\FindProductDetails;
use App\Services\ReviewService\ListProductReviews;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerProductPreview extends Controller
{
    use EnsuresRoles;

    public function __construct(
        private readonly FindProductDetails $findProductDetails,
        private readonly ListProductReviews $listProductReviews,
    ) {
    }

    public function __invoke(Request $request, int $id)
    {
        $this->ensureSeller($request);

        $product = $this->findProductDetails->handle($id);

        abort_unless($product && $product->user_id === $request->user()->id, 404);

        $reviews = $this->listProductReviews->handle($id);

        return Inertia::render('App', [
            'sellerPreview' => true,
            'productDetails' => $product,
            'productReviews' => $reviews['reviews'] ?? [],
            'averageRating' => $reviews['average_rating'] ?? 0,
            'totalReviews' => $reviews['total_reviews'] ?? 0,
            'reviewEligibility' => [
                'can_review' => false,
                'has_reviewed' => false,
                'has_purchased' => false,
            ],
            'relatedProducts' => [],
        ]);
    }
}
