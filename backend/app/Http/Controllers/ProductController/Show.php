<?php

namespace App\Http\Controllers\ProductController;

use App\Http\Controllers\Controller;
use App\Services\ProductService\FindProductDetails;

class Show extends Controller
{
    public function __construct(private readonly FindProductDetails $findProductDetails)
    {
    }

    public function __invoke(int $id)
    {
        $product = $this->findProductDetails->handle($id);

        if (! $product) {
            return response(['message' => 'Product not found'], 404);
        }

        return response($product, 200);
    }
}
