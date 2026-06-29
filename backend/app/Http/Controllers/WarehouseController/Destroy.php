<?php

namespace App\Http\Controllers\WarehouseController;

use Illuminate\Http\Request;

class Destroy
{
    public function __invoke(Request $request, $id)
    {
        $warehouse = $request->user()->warehouses()->findOrFail($id);
        $warehouse->delete();

        return response()->json(['message' => 'Warehouse deleted successfully']);
    }
}
