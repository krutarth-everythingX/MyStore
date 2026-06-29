<?php

namespace App\Http\Controllers\VendorController;

use Illuminate\Http\Request;

class Update
{
    public function __invoke(Request $request, $id)
    {
        $vendor = $request->user()->vendors()->findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'reference_code' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
        ]);

        $vendor->update($validated);

        return response()->json($vendor);
    }
}
