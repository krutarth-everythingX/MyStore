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
            'options' => 'nullable|array',
            'options.*' => 'string|max:100',
        ]);

        $attribute->update($validated);

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response($attribute, 200);
    }
}
