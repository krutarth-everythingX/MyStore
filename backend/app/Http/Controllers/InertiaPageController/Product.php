<?php

namespace App\Http\Controllers\InertiaPageController;

use App\Http\Controllers\Controller;
use App\Services\ProductService\FindProductDetails;
use App\Services\ProductService\RelatedProducts;
use App\Services\RecentlyViewedService\TrackProduct;
use App\Services\ReviewService\ListProductReviews;
use App\Services\ReviewService\ReviewEligibility;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Product extends Controller
{
    public function __construct(
        private readonly FindProductDetails $findProductDetails,
        private readonly TrackProduct $trackProduct,
        private readonly ListProductReviews $listProductReviews,
        private readonly RelatedProducts $relatedProducts,
        private readonly ReviewEligibility $reviewEligibility,
    ) {
    }

    public function __invoke(Request $request, int $id)
    {
        $product = $this->findProductDetails->handle($id);

        abort_unless($product, 404);

        if ($request->user()?->role === 'buyer') {
            $this->trackProduct->handle($request->user()->id, $product->id);
        }

        $reviews = $this->listProductReviews->handle($product->id);
        $reviewEligibility = $this->reviewEligibility->evaluate($product, $request->user());

        return Inertia::render('ProductDetails', [
            'product' => $product,
            'reviews' => $reviews['reviews'],
            'averageRating' => $reviews['average_rating'],
            'totalReviews' => $reviews['total_reviews'],
            'reviewEligibility' => $reviewEligibility,
            'relatedProducts' => $this->relatedProducts->handle($product),
        ]);
    }
}
