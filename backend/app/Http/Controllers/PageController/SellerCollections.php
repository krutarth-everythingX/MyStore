<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Services\ProductService\ListSellerProducts;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerCollections extends Controller
{
    use EnsuresRoles;

    public function __construct(private readonly ListSellerProducts $listSellerProducts)
    {
    }

    public function __invoke(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('App', [
            'sellerProducts' => $this->listSellerProducts->handle($request->user()->id),
            'sellerCollections' => Collection::query()
                ->where('user_id', $request->user()->id)
                ->latest()
                ->get(),
        ]);
    }
}
