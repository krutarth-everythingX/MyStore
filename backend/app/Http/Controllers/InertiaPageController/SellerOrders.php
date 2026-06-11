<?php

namespace App\Http\Controllers\InertiaPageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\SellerDashboardService\ListOrdersForSeller;
use App\Services\WarehouseService\GetAvailableCarriers;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerOrders extends Controller
{
    use EnsuresRoles;

    public function __construct(
        private readonly ListOrdersForSeller $listOrdersForSeller,
        private readonly GetAvailableCarriers $getAvailableCarriers,
    ) {
    }

    public function __invoke(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('SellerOrders', [
            'orders' => $this->listOrdersForSeller->handle($request->user()->id),
            'carriers' => $this->getAvailableCarriers->handle(),
        ]);
    }
}
