<?php

namespace App\Http\Controllers\AttributeController;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class Store extends Controller
{
    public function __invoke(Request $request)
    {
        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'options' => 'nullable|array',
            'options.*' => 'string|max:120',
        ]);

        $attribute = $request->user()->attributes()->create($validated);

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response($attribute, 201);
    }
}
