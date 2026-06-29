<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Services\InventoryService\SellerInventorySnapshot;
use App\Services\ProductService\ListSellerProducts;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerInventorySection extends Controller
{
    use EnsuresRoles;

    public function __construct(
        private readonly ListSellerProducts $listSellerProducts,
        private readonly SellerInventorySnapshot $sellerInventorySnapshot,
    ) {
    }

    public function __invoke(Request $request, string $section)
    {
        $this->ensureSeller($request);

        abort_unless(in_array($section, [
            'stock-entries',
            'stock-movements',
            'reconciliation',
            'batch-tracking',
            'serial-tracking',
            'expiry-tracking',
        ], true), 404);

        return Inertia::render('App', [
            'sellerProducts' => $this->listSellerProducts->handle($request->user()->id),
            'sellerInventorySnapshot' => $this->sellerInventorySnapshot->handle($request->user()->id),
            'sellerInventorySection' => $section,
        ]);
    }
}
