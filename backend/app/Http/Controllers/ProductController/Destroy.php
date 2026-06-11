<?php

namespace App\Http\Controllers\ProductController;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ProductService\DeleteProduct;
use Illuminate\Http\Request;

class Destroy extends Controller
{
    public function __construct(private readonly DeleteProduct $deleteProduct)
    {
    }

    public function __invoke(Request $request, int $id)
    {
        $product = Product::find($id);

        if (! $product) {
            return response(['message' => 'Product not found'], 404);
        }

        $this->authorize('delete', $product);
        $this->deleteProduct->handle($product);

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Product deleted successfully');
        }

        return response(['message' => 'Product deleted successfully'], 200);
    }
}
