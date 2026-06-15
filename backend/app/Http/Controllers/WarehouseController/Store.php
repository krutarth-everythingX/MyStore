<?php

namespace App\Http\Controllers\WarehouseController;

use App\Http\Controllers\Controller;
use App\Rules\IndianPostalCode;
use App\Services\WarehouseService\CreateForSeller;
use Illuminate\Http\Request;

class Store extends Controller
{
    public function __construct(private readonly CreateForSeller $createForSeller)
    {
    }

    public function __invoke(Request $request)
    {
        if ($request->user()->role !== 'seller' || ! seller_setup_complete($request->user())) {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        $warehouse = $this->createForSeller->handle(
            $request->validate([
                'name' => 'required|string',
                'code' => 'required|string|unique:warehouses,code',
                'address' => 'nullable|string',
                'city' => 'nullable|string',
                'state' => 'nullable|string',
                'postal_code' => ['nullable', 'string', new IndianPostalCode()],
                'country' => 'nullable|string|max:80',
                'type' => 'nullable|string|max:60',
                'timezone' => 'nullable|string|max:80',
                'capacity_units' => 'nullable|integer|min:0',
                'notes' => 'nullable|string|max:1000',
                'default_carrier' => 'required|string',
            ]),
            $request->user(),
        );

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Warehouse added successfully!');
        }

        return response($warehouse, 201);
    }
}
