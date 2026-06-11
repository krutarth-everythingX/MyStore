<?php

namespace App\Http\Controllers\WishlistController;

use App\Http\Controllers\Controller;
use App\Services\WishlistService\ToggleProduct;
use Illuminate\Http\Request;

class Toggle extends Controller
{
    public function __construct(private readonly ToggleProduct $toggleProduct)
    {
    }

    public function __invoke(Request $request, int $productId)
    {
        $wishlisted = $this->toggleProduct->handle($request->user()->id, $productId);
        $message = $wishlisted ? 'Added to wishlist' : 'Removed from wishlist';

        if ($request->header('X-Inertia')) {
            return back()->with('success', $message);
        }

        return response([
            'wishlisted' => $wishlisted,
            'message' => $message,
        ], $wishlisted ? 201 : 200);
    }
}
