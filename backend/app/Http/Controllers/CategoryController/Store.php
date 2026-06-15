<?php

namespace App\Http\Controllers\CategoryController;

use App\Http\Controllers\Controller;
use App\Services\CategoryService\CreateForSeller;
use Illuminate\Http\Request;

class Store extends Controller
{
    public function __construct(private readonly CreateForSeller $createForSeller)
    {
    }

    public function __invoke(Request $request)
    {
        if ($request->user()->role !== 'seller' || ! seller_setup_complete($request->user())) {
            return response(['message' => 'Unauthorized'], 403);
        }

        $category = $this->createForSeller->handle(
            $request->validate([
                'name' => 'required|string|max:120',
                'parent_id' => 'nullable|integer|exists:categories,id',
            ]),
            $request->user(),
        );

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Category saved.');
        }

        return response($category, 201);
    }
}
