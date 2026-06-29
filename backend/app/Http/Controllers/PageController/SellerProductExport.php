<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\ProductService\ListSellerProducts;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerProductExport extends Controller
{
    use EnsuresRoles;

    public function __construct(
        private readonly ListSellerProducts $listSellerProducts,
    ) {
    }

    public function __invoke(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('App', [
            'sellerProducts' => $this->listSellerProducts->handle($request->user()->id),
            'sellerProductExport' => true,
        ]);
    }
}
