<?php

namespace App\Http\Controllers\BrandController;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class Destroy extends Controller
{
    public function __invoke(Request $request, int $id)
    {
        if ($request->user()->role !== 'seller' || ! seller_setup_complete($request->user())) {
            return response(['message' => 'Unauthorized'], 403);
        }

        $brand = $request->user()->brands()->findOrFail($id);
        $brand->delete();

        return response(['message' => 'Deleted'], 200);
    }
}
