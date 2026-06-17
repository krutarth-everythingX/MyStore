<?php

namespace App\Http\Controllers\AttributeController;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class Destroy extends Controller
{
    public function __invoke(Request $request, $id)
    {
        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized'], 403);
        }

        $attribute = $request->user()->attributes()->findOrFail($id);
        $attribute->delete();

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response(['message' => 'Deleted'], 200);
    }
}
