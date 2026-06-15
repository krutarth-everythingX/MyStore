<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\ProductService\FindProductDetails;
use App\Services\ProductService\RelatedProducts;
use App\Services\ReviewService\ListProductReviews;
use App\Services\ReviewService\ReviewEligibility;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Product extends Controller
{
    use EnsuresRoles;

    public function __construct(
        private readonly FindProductDetails $findProductDetails,
        private readonly ListProductReviews $listProductReviews,
        private readonly RelatedProducts $relatedProducts,
        private readonly ReviewEligibility $reviewEligibility,
    ) {
    }

    public function __invoke(Request $request, int $id)
    {
        $this->ensureStorefrontAccess($request);

        $product = $this->findProductDetails->handle($id);

        if (! $product) {
            return $request->expectsJson()
                ? response(['message' => 'Product not found'], 404)
                : abort(404);
        }

        if ($request->expectsJson()) {
            return response($product, 200);
        }

        $reviews = $this->listProductReviews->handle($id);
        $reviewEligibility = $this->reviewEligibility->evaluate($product, $request->user());

        return Inertia::render('App', [
            'productDetails' => $product,
            'productReviews' => $reviews['reviews'] ?? [],
            'averageRating' => $reviews['average_rating'] ?? 0,
            'totalReviews' => $reviews['total_reviews'] ?? 0,
            'reviewEligibility' => $reviewEligibility,
            'relatedProducts' => $this->relatedProducts->handle($product),
        ]);
    }
}
