<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    public function index()
    {
        return response(Brand::with('user')->get(), 200);
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'seller') {
            return response(['message' => 'Unauthorized'], 403);
        }

        $fields = $request->validate([
            'name' => 'required|string',
            'logo' => 'nullable|string'
        ]);

        $brand = Brand::create([
            'user_id' => $request->user()->id,
            'name' => $fields['name'],
            'slug' => Str::slug($fields['name']) . '-' . uniqid(),
            'logo' => $fields['logo'] ?? null
        ]);

        return response($brand, 201);
    }
}
