<?php

namespace App\Http\Controllers\ProductController;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ProductService\CustomersAlsoBought;
use Illuminate\Http\Request;

class Recommendations extends Controller
{
    public function __construct(private readonly CustomersAlsoBought $customersAlsoBought)
    {
    }

    public function __invoke(Request $request, int $id)
    {
        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:12'],
        ]);

        $product = Product::query()
            ->where('status', 'published')
            ->where('type', '!=', 'variation')
            ->find($id);

        if (! $product) {
            return response(['message' => 'Product not found'], 404);
        }

        return response([
            'data' => $this->customersAlsoBought->handle($product, (int) ($validated['limit'] ?? 4)),
            'meta' => [
                'strategy' => 'customers_also_bought',
            ],
        ]);
    }
}
