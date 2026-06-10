<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use App\Rules\IndianPostalCode;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        $warehouses = Warehouse::where('user_id', $request->user()->id)->get();
        return response($warehouses, 200);
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        $fields = $request->validate([
            'name' => 'required|string',
            'code' => 'required|string|unique:warehouses,code',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'postal_code' => ['nullable', 'string', new IndianPostalCode()],
            'default_carrier' => 'required|string'
        ]);

        $warehouse = Warehouse::create([
            'user_id' => $request->user()->id,
            'name' => $fields['name'],
            'code' => $fields['code'],
            'address' => $fields['address'] ?? null,
            'city' => $fields['city'] ?? null,
            'state' => $fields['state'] ?? null,
            'postal_code' => $fields['postal_code'] ?? null,
            'default_carrier' => $fields['default_carrier']
        ]);

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Warehouse added successfully!');
        }

        return response($warehouse, 201);
    }

    public function getCarriers()
    {
        // Return available third-party carriers
        return response([
            'carriers' => ['Blue Dart', 'FedEx', 'DHL', 'UPS', 'Delhivery', 'Speed Post']
        ], 200);
    }
}
