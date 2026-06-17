<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\BrandService\ListBrands;
use App\Services\CategoryService\ListCategories;
use App\Services\ProductService\ListSellerProducts;
use App\Services\WarehouseService\ListForSeller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerProducts extends Controller
{
    use EnsuresRoles;

    public function __construct(
        private readonly ListSellerProducts $listSellerProducts,
        private readonly ListBrands $listBrands,
        private readonly ListCategories $listCategories,
        private readonly ListForSeller $listForSeller,
    ) {
    }

    public function __invoke(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('App', [
            'sellerProducts' => $this->listSellerProducts->handle($request->user()->id),
            'categories' => $this->listCategories->handle($request->user()->id),
            'brands' => $this->listBrands->handle(),
            'attributes' => $request->user()->attributes()->orderBy('name')->get(),
            'sellerWarehouses' => $this->listForSeller->handle($request->user()->id),
        ]);
    }
}
