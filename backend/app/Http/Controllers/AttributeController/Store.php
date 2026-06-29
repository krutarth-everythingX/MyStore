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
            'applies_to' => 'nullable|string|in:product,service,both',
            'input_type' => 'nullable|string|in:dropdown,free_text,number,color,material,custom',
            'options' => 'nullable|array',
            'options.*' => 'string|max:120',
            'is_required' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['applies_to'] ??= 'product';
        $validated['input_type'] ??= 'dropdown';
        $validated['is_required'] = (bool) ($validated['is_required'] ?? false);
        $validated['is_active'] = (bool) ($validated['is_active'] ?? true);

        $attribute = $request->user()->attributes()->create($validated);

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response($attribute, 201);
    }
}
