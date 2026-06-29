<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\InventoryService\SellerInventorySnapshot;
use App\Services\ProductService\ListSellerProducts;
use App\Services\SellerDashboardService\StatsForSeller;
use App\Services\WarehouseService\GetAvailableCarriers;
use App\Services\WarehouseService\ListForSeller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerOverview extends Controller
{
    use EnsuresRoles;

    public function __construct(
        private readonly ListForSeller $listForSeller,
        private readonly GetAvailableCarriers $getAvailableCarriers,
        private readonly ListSellerProducts $listSellerProducts,
        private readonly SellerInventorySnapshot $sellerInventorySnapshot,
        private readonly StatsForSeller $statsForSeller,
    ) {}

    public function __invoke(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('App', [
            'sellerWarehouses' => $this->listForSeller->handle($request->user()->id),
            'sellerCarriers' => $this->getAvailableCarriers->handle(),
            'sellerProducts' => $this->listSellerProducts->handle($request->user()->id),
            'sellerInventorySnapshot' => $this->sellerInventorySnapshot->handle($request->user()->id),
            'sellerStats' => $this->statsForSeller->handle($request->user()->id),
        ]);
    }
}
