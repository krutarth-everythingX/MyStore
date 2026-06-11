<?php

namespace App\Http\Controllers\SellerDashboardController;

use App\Http\Controllers\Controller;
use App\Services\SellerDashboardService\StatsForSeller;
use Illuminate\Http\Request;

class Stats extends Controller
{
    public function __construct(private readonly StatsForSeller $statsForSeller)
    {
    }

    public function __invoke(Request $request)
    {
        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        return response(
            $this->statsForSeller->handle($request->user()->id),
            200,
        );
    }
}
