<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return response(Category::with(['user', 'children', 'parent'])->get(), 200);
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized'], 403);
        }

        $fields = $request->validate([
            'name' => 'required|string',
            'parent_id' => 'nullable|integer|exists:categories,id'
        ]);

        $category = Category::create([
            'user_id' => $request->user()->id,
            'name' => $fields['name'],
            'parent_id' => $fields['parent_id'] ?? null
        ]);

        return response($category->load('parent'), 201);
    }
}
