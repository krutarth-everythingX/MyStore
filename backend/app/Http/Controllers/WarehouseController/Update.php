<?php

namespace App\Http\Controllers\WarehouseController;

use Illuminate\Http\Request;

class Update
{
    public function __invoke(Request $request, $id)
    {
        $warehouse = $request->user()->warehouses()->findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
        ]);

        $warehouse->update($validated);

        return response()->json($warehouse);
    }
}
