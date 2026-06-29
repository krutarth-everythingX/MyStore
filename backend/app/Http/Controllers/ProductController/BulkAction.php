<?php

namespace App\Http\Controllers\ProductController;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ProductService\DeleteProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BulkAction extends Controller
{
    public function __construct(private readonly DeleteProduct $deleteProduct)
    {
    }

    public function __invoke(Request $request)
    {
        $fields = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct'],
            'action' => ['required', 'string', Rule::in(['activate', 'deactivate', 'delete'])],
        ]);

        $products = Product::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('id', $fields['ids'])
            ->get();

        abort_if($products->isEmpty(), 404, 'No products found for this bulk action.');

        DB::transaction(function () use ($fields, $products) {
            if ($fields['action'] === 'delete') {
                $products->each(fn (Product $product) => $this->deleteProduct->handle($product));
                return;
            }

            $products->each(function (Product $product) use ($fields) {
                $product->update([
                    'status' => $fields['action'] === 'activate' ? 'published' : 'draft',
                ]);
            });
        });

        $message = match ($fields['action']) {
            'activate' => 'Selected products activated successfully.',
            'deactivate' => 'Selected products deactivated successfully.',
            default => 'Selected products deleted successfully.',
        };

        if ($request->header('X-Inertia')) {
            return back()->with('success', $message);
        }

        return response(['message' => $message]);
    }
}
