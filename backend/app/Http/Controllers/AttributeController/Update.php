<?php

namespace App\Http\Controllers\AttributeController;

use App\Http\Controllers\Controller;
use App\Models\Attribute;
use Illuminate\Http\Request;

class Update extends Controller
{
    public function __invoke(Request $request, $id)
    {
        if ($request->user()->role !== 'seller' || ! seller_setup_complete($request->user())) {
            return response(['message' => 'Unauthorized'], 403);
        }

        $attribute = Attribute::where('user_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'applies_to' => 'nullable|string|in:product,service,both',
            'input_type' => 'nullable|string|in:dropdown,free_text,number,color,material,custom',
            'options' => 'nullable|array',
            'options.*' => 'string|max:100',
            'is_required' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['applies_to'] ??= $attribute->applies_to ?: 'product';
        $validated['input_type'] ??= $attribute->input_type ?: 'dropdown';
        $validated['is_required'] = (bool) ($validated['is_required'] ?? false);
        $validated['is_active'] = (bool) ($validated['is_active'] ?? true);

        $attribute->update($validated);

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response($attribute, 200);
    }
}
