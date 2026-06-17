<?php

namespace App\Http\Controllers\WarehouseController;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class Destroy extends Controller
{
    public function __invoke(Request $request, $id)
    {
        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized. Sellers only.'], 403);
        }

        $warehouse = Warehouse::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $warehouse->delete();

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Warehouse deleted successfully.');
        }

        return response()->noContent();
    }
}
