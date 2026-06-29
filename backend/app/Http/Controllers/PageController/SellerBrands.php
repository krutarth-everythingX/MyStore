<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerBrands extends Controller
{
    use EnsuresRoles;

    public function __invoke(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('App', [
            'brands' => $request->user()
                ->brands()
                ->withCount('products')
                ->orderBy('name')
                ->get(),
        ]);
    }
}
