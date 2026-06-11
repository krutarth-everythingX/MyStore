<?php

namespace App\Http\Controllers\ProductController;

use App\Http\Controllers\Concerns\HasProductRules;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ProductService\CreateProduct;
use Illuminate\Http\Request;

class Store extends Controller
{
    use HasProductRules;

    public function __construct(private readonly CreateProduct $createProduct)
    {
    }

    public function __invoke(Request $request)
    {
        $this->authorize('create', Product::class);

        $product = $this->createProduct->handle(
            $request->validate($this->productRules()),
            $request->user(),
        );

        if ($request->header('X-Inertia')) {
            return redirect('/seller/products')->with('success', 'Product created successfully!');
        }

        return response($product, 201);
    }
}
