<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\ProductService\ListSellerProducts;
use App\Services\WarehouseService\GetAvailableCarriers;
use App\Services\WarehouseService\ListForSeller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerInventory extends Controller
{
    use EnsuresRoles;

    public function __construct(
        private readonly ListForSeller $listForSeller,
        private readonly GetAvailableCarriers $getAvailableCarriers,
        private readonly ListSellerProducts $listSellerProducts,
    ) {
    }

    public function __invoke(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('App', [
            'sellerWarehouses' => $this->listForSeller->handle($request->user()->id),
            'sellerCarriers' => $this->getAvailableCarriers->handle(),
            'sellerProducts' => $this->listSellerProducts->handle($request->user()->id),
        ]);
    }
}
