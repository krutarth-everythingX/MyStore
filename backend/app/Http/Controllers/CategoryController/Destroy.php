<?php

namespace App\Http\Controllers\CategoryController;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class Destroy extends Controller
{
    public function __invoke(Request $request, $id)
    {
        if ($request->user()->role !== 'seller' || ! seller_setup_complete($request->user())) {
            return response(['message' => 'Unauthorized'], 403);
        }

        $category = Category::where('user_id', $request->user()->id)->findOrFail($id);

        // Before deleting, check if it has children. If so, move children to parent_id (or root)
        Category::where('parent_id', $category->id)->update(['parent_id' => $category->parent_id]);

        $category->delete();

        if ($request->header('X-Inertia')) {
            return back();
        }

        return response()->noContent();
    }
}
