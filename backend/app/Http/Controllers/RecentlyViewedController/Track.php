<?php

namespace App\Http\Controllers\RecentlyViewedController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\RecentlyViewedService\TrackProduct;
use Illuminate\Http\Request;

class Track extends Controller
{
    use EnsuresRoles;

    public function __construct(private readonly TrackProduct $trackProduct)
    {
    }

    public function __invoke(Request $request, int $productId)
    {
        $this->ensureBuyer($request);

        $this->trackProduct->handle($request->user()->id, $productId);

        return response(['tracked' => true], 200);
    }
}
