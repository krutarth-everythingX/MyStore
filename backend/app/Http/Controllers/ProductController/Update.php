<?php

namespace App\Http\Controllers\ProductController;

use App\Http\Controllers\Concerns\HasProductRules;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ProductService\UpdateProduct;
use Illuminate\Http\Request;

class Update extends Controller
{
    use HasProductRules;

    public function __construct(private readonly UpdateProduct $updateProduct)
    {
    }

    public function __invoke(Request $request, int $id)
    {
        $product = Product::find($id);

        if (! $product) {
            return response(['message' => 'Product not found'], 404);
        }

        $this->authorize('update', $product);

        $updatedProduct = $this->updateProduct->handle(
            $product,
            $request->validate($this->productRules()),
            $request->user(),
        );

        if ($request->header('X-Inertia')) {
            return redirect('/seller/products')->with('success', 'Product updated successfully!');
        }

        return response($updatedProduct, 200);
    }
}
