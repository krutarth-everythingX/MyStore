<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * Display a listing of products for the storefront.
     */
    public function index(Request $request)
    {
        $query = Product::with(['user', 'brand', 'categories', 'variations', 'warehouses'])
            ->where('status', 'published')
            ->where('type', '!=', 'variation'); // Don't list raw variations directly

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('category_id')) {
            $categoryId = $request->input('category_id');
            $query->whereHas('categories', function($q) use ($categoryId) {
                $q->where('categories.id', $categoryId)
                  ->orWhere('categories.parent_id', $categoryId);
            });
        }

        if ($request->has('brand_id')) {
            $query->where('brand_id', $request->input('brand_id'));
        }

        if ($request->has('seller_id')) {
            $query->where('user_id', $request->input('seller_id'));
        }

        return response($query->latest()->get(), 200);
    }

    /**
     * Display the specified product details.
     */
    public function show($id)
    {
        $product = Product::with(['user', 'brand', 'categories', 'warehouses', 'variations'])->find($id);

        if (!$product) {
            return response(['message' => 'Product not found'], 404);
        }

        return response($product, 200);
    }

    /**
     * Store a newly created product in storage (Seller only).
     */
    public function store(Request $request)
    {
        $this->authorize('create', Product::class);

        $fields = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'regular_price' => 'required|numeric',
            'sale_price' => 'nullable|numeric',
            'sku' => 'nullable|string',
            'manage_stock' => 'boolean',
            'stock_quantity' => 'integer',
            'brand_id' => 'nullable|integer',
            'categories' => 'nullable|array', // array of category IDs
            'new_category_name' => 'nullable|string', // Dynamically add category
            'warehouse_id' => 'nullable|integer', // default warehouse
            'warehouse_qty' => 'nullable|integer',
            'bin_location' => 'nullable|string',
            'type' => 'nullable|string|in:simple,variable,variation',
            'parent_id' => 'nullable|integer|exists:products,id',
            'attributes' => 'nullable|array',
            'variations' => 'nullable|array',
            'weight_kg' => 'nullable|numeric|min:0',
            'length_cm' => 'nullable|numeric|min:0',
            'width_cm' => 'nullable|numeric|min:0',
            'height_cm' => 'nullable|numeric|min:0',
        ]);

        $fields['user_id'] = $request->user()->id;
        $fields['slug'] = Str::slug($fields['name']) . '-' . uniqid();
        $fields['status'] = 'published';

        // Automatically associate product with seller's brand record
        $sellerBrand = \App\Models\Brand::firstOrCreate(
            ['user_id' => $request->user()->id],
            [
                'name' => seller_brand_name($request->user()->brand_name, $request->user()->name),
            ]
        );
        $fields['brand_id'] = $sellerBrand->id;

        $product = Product::create($fields);

        // Attach categories
        $categoryIds = $fields['categories'] ?? [];
        
        if (!empty($fields['new_category_name'])) {
            $newCat = \App\Models\Category::firstOrCreate(
                ['name' => $fields['new_category_name']],
                [
                    'user_id' => $request->user()->id,
                    'parent_id' => null
                ]
            );
            $categoryIds[] = $newCat->id;
        }

        if (!empty($categoryIds)) {
            $product->categories()->attach($categoryIds);
        }

        // Attach to warehouse
        if (!empty($fields['warehouse_id'])) {
            $qty = $fields['warehouse_qty'] ?? ($fields['stock_quantity'] ?? 0);
            $product->warehouses()->attach($fields['warehouse_id'], [
                'quantity' => $qty,
                'bin_location' => $fields['bin_location'] ?? null
            ]);

            // Sync overall product stock
            if ($fields['manage_stock'] ?? false) {
                $product->update(['stock_quantity' => $qty]);
            }
        }

        // Handle variations if variable type
        if (($fields['type'] ?? 'simple') === 'variable' && $request->has('variations')) {
            foreach ($request->input('variations') as $varInput) {
                $varSlug = $product->slug . '-' . Str::slug(implode('-', $varInput['attributes'] ?? [])) . '-' . uniqid();
                $variation = Product::create([
                    'user_id' => $request->user()->id,
                    'name' => $product->name . ' - ' . implode(', ', $varInput['attributes'] ?? []),
                    'slug' => $varSlug,
                    'description' => $product->description,
                    'regular_price' => $varInput['regular_price'] ?? $product->regular_price,
                    'sale_price' => $varInput['sale_price'] ?? null,
                    'sku' => $varInput['sku'] ?? null,
                    'manage_stock' => $varInput['manage_stock'] ?? false,
                    'stock_quantity' => $varInput['stock_quantity'] ?? 0,
                    'type' => 'variation',
                    'parent_id' => $product->id,
                    'attributes' => $varInput['attributes'] ?? [],
                    'status' => 'published',
                    'brand_id' => $product->brand_id,
                ]);

                // Sync variation to same warehouse if warehouse_id is present
                if (!empty($fields['warehouse_id'])) {
                    $variation->warehouses()->attach($fields['warehouse_id'], [
                        'quantity' => $varInput['stock_quantity'] ?? 0,
                        'bin_location' => $fields['bin_location'] ?? null
                    ]);
                }
            }
        }

        $product = $product->load(['brand', 'categories', 'warehouses', 'variations']);

        if ($request->header('X-Inertia')) {
            return redirect('/seller/products')->with('success', 'Product created successfully!');
        }

        return response($product, 201);
    }

    /**
     * Update the specified product (Seller only).
     */
    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response(['message' => 'Product not found'], 404);
        }

        $this->authorize('update', $product);

        $fields = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'regular_price' => 'required|numeric',
            'sale_price' => 'nullable|numeric',
            'sku' => 'nullable|string',
            'manage_stock' => 'boolean',
            'stock_quantity' => 'integer',
            'brand_id' => 'nullable|integer',
            'categories' => 'nullable|array',
            'new_category_name' => 'nullable|string',
            'warehouse_id' => 'nullable|integer',
            'warehouse_qty' => 'nullable|integer',
            'bin_location' => 'nullable|string',
            'type' => 'nullable|string|in:simple,variable,variation',
            'parent_id' => 'nullable|integer|exists:products,id',
            'attributes' => 'nullable|array',
            'variations' => 'nullable|array',
            'weight_kg' => 'nullable|numeric|min:0',
            'length_cm' => 'nullable|numeric|min:0',
            'width_cm' => 'nullable|numeric|min:0',
            'height_cm' => 'nullable|numeric|min:0',
        ]);

        // Automatically associate product with seller's brand record
        $sellerBrand = \App\Models\Brand::firstOrCreate(
            ['user_id' => $request->user()->id],
            [
                'name' => seller_brand_name($request->user()->brand_name, $request->user()->name),
            ]
        );
        $fields['brand_id'] = $sellerBrand->id;

        $product->update($fields);

        // Sync categories
        $categoryIds = $fields['categories'] ?? [];

        if (!empty($fields['new_category_name'])) {
            $newCat = \App\Models\Category::firstOrCreate(
                ['name' => $fields['new_category_name']],
                [
                    'user_id' => $request->user()->id,
                    'parent_id' => null
                ]
            );
            $categoryIds[] = $newCat->id;
        }

        if (isset($fields['categories']) || !empty($fields['new_category_name'])) {
            $product->categories()->sync($categoryIds);
        }

        // Sync warehouse stock
        if (!empty($fields['warehouse_id'])) {
            $qty = $fields['warehouse_qty'] ?? ($fields['stock_quantity'] ?? 0);
            $product->warehouses()->sync([
                $fields['warehouse_id'] => [
                    'quantity' => $qty,
                    'bin_location' => $fields['bin_location'] ?? null
                ]
            ]);

            if ($product->manage_stock) {
                $product->update(['stock_quantity' => $qty]);
            }
        }

        // Handle variations if variable type
        if (($fields['type'] ?? $product->type) === 'variable' && $request->has('variations')) {
            $keepVariationIds = [];
            foreach ($request->input('variations') as $varInput) {
                $varData = [
                    'user_id' => $request->user()->id,
                    'name' => $product->name . ' - ' . implode(', ', $varInput['attributes'] ?? []),
                    'regular_price' => $varInput['regular_price'] ?? $product->regular_price,
                    'sale_price' => $varInput['sale_price'] ?? null,
                    'sku' => $varInput['sku'] ?? null,
                    'manage_stock' => $varInput['manage_stock'] ?? false,
                    'stock_quantity' => $varInput['stock_quantity'] ?? 0,
                    'type' => 'variation',
                    'parent_id' => $product->id,
                    'attributes' => $varInput['attributes'] ?? [],
                    'status' => 'published',
                    'brand_id' => $product->brand_id,
                ];

                if (!empty($varInput['id'])) {
                    $variation = Product::find($varInput['id']);
                    if ($variation && $variation->parent_id === $product->id) {
                        $variation->update($varData);
                        $keepVariationIds[] = $variation->id;
                    }
                } else {
                    $varSlug = $product->slug . '-' . Str::slug(implode('-', $varInput['attributes'] ?? [])) . '-' . uniqid();
                    $varData['slug'] = $varSlug;
                    $variation = Product::create($varData);
                    $keepVariationIds[] = $variation->id;
                }

                // Sync warehouse for variation if warehouse_id is present
                if (!empty($fields['warehouse_id'])) {
                    $variation->warehouses()->sync([
                        $fields['warehouse_id'] => [
                            'quantity' => $varInput['stock_quantity'] ?? 0,
                            'bin_location' => $fields['bin_location'] ?? null
                        ]
                    ]);
                }
            }

            // Delete variations that are no longer part of this product
            Product::where('parent_id', $product->id)
                ->whereNotIn('id', $keepVariationIds)
                ->delete();
        }

        $product = $product->load(['brand', 'categories', 'warehouses', 'variations']);

        if ($request->header('X-Inertia')) {
            return redirect('/seller/products')->with('success', 'Product updated successfully!');
        }

        return response($product, 200);
    }

    /**
     * Remove the specified product (Seller only).
     */
    public function destroy(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response(['message' => 'Product not found'], 404);
        }

        $this->authorize('delete', $product);

        $product->delete();

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Product deleted successfully');
        }

        return response(['message' => 'Product deleted successfully'], 200);
    }
}
