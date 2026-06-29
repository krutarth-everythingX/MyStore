<?php

namespace App\Http\Controllers\VendorController;

use Illuminate\Http\Request;

class Store
{
    public function __invoke(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'reference_code' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
        ]);

        $vendor = $request->user()->vendors()->create($validated);

        return response()->json($vendor, 201);
    }
}
