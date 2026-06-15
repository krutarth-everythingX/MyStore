<?php

namespace App\Http\Controllers\PageController;

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
        $configuredChannels = array_values(array_filter($request->user()->fulfillment_channels ?? []));
        $fallbackChannels = $this->getAvailableCarriers->handle();

        return Inertia::render('App', [
            'sellerOrders' => $this->listOrdersForSeller->handle($request->user()->id),
            'sellerCarriers' => $configuredChannels !== [] ? $configuredChannels : $fallbackChannels,
            'sellerFulfillmentChannels' => $configuredChannels,
        ]);
    }
}
