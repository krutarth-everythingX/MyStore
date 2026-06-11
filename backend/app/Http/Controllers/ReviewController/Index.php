<?php

namespace App\Http\Controllers\ReviewController;

use App\Http\Controllers\Controller;
use App\Services\ReviewService\ListProductReviews;

class Index extends Controller
{
    public function __construct(private readonly ListProductReviews $listProductReviews)
    {
    }

    public function __invoke(int $productId)
    {
        return response($this->listProductReviews->handle($productId), 200);
    }
}
