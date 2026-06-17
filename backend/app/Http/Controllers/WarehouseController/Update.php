<?php

namespace App\Http\Controllers\WarehouseController;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Rules\IndianPostalCode;
use App\Services\WarehouseService\UpdateForSeller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class Update extends Controller
{
    public function __construct(private readonly UpdateForSeller $updateForSeller)
    {
    }

    public function __invoke(Request $request, $id)
    {
        if ($request->user()->role !== 'seller' || ! seller_setup_complete($request->user())) {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        $warehouse = Warehouse::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $this->updateForSeller->handle(
            $warehouse,
            $request->validate([
                'name' => 'required|string',
                'code' => [
                    'required',
                    'string',
                    Rule::unique('warehouses')->ignore($warehouse->id),
                ],
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
            return back()->with('success', 'Warehouse updated successfully!');
        }

        return response($warehouse, 200);
    }
}
