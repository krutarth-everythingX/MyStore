<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\ProductService\ListSellerProducts;
use App\Services\WarehouseService\ListForSeller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerReconciliationCreate extends Controller
{
    use EnsuresRoles;

    public function __construct(
        private readonly ListSellerProducts $listSellerProducts,
        private readonly ListForSeller $listForSeller,
    ) {
    }

    public function __invoke(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('App', [
            'sellerProducts' => $this->listSellerProducts->handle($request->user()->id),
            'sellerWarehouses' => $this->listForSeller->handle($request->user()->id),
            'sellerReconciliationCreate' => true,
        ]);
    }
}
