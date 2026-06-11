<?php

namespace App\Http\Controllers\InertiaPageController;

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

        return Inertia::render('SellerInventory', [
            'warehouses' => $this->listForSeller->handle($request->user()->id),
            'carriers' => $this->getAvailableCarriers->handle(),
            'products' => $this->listSellerProducts->handle($request->user()->id),
        ]);
    }
}
