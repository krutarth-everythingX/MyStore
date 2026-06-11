<?php

namespace App\Http\Controllers\SellerDashboardController;

use App\Http\Controllers\Controller;
use App\Services\SellerDashboardService\ListOrdersForSeller;
use Illuminate\Http\Request;

class Orders extends Controller
{
    public function __construct(private readonly ListOrdersForSeller $listOrdersForSeller)
    {
    }

    public function __invoke(Request $request)
    {
        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        return response(
            $this->listOrdersForSeller->handle($request->user()->id),
            200,
        );
    }
}
