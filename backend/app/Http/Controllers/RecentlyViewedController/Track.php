<?php

namespace App\Http\Controllers\RecentlyViewedController;

use App\Http\Controllers\Controller;
use App\Services\RecentlyViewedService\TrackProduct;
use Illuminate\Http\Request;

class Track extends Controller
{
    public function __construct(private readonly TrackProduct $trackProduct)
    {
    }

    public function __invoke(Request $request, int $productId)
    {
        $this->trackProduct->handle($request->user()->id, $productId);

        return response(['tracked' => true], 200);
    }
}
