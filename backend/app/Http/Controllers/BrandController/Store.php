<?php

namespace App\Http\Controllers\BrandController;

use App\Http\Controllers\Controller;
use App\Services\BrandService\CreateForSeller;
use Illuminate\Http\Request;

class Store extends Controller
{
    public function __construct(private readonly CreateForSeller $createForSeller)
    {
    }

    public function __invoke(Request $request)
    {
        if ($request->user()->role !== 'seller' || ! seller_setup_complete($request->user())) {
            return response(['message' => 'Unauthorized'], 403);
        }

        $brand = $this->createForSeller->handle(
            $request->validate([
                'name' => 'required|string',
                'logo' => 'nullable|string',
            ]),
            $request->user(),
        );

        return response($brand, 201);
    }
}
