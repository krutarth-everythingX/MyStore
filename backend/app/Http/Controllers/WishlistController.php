<?php

namespace App\Http\Controllers;

use App\Models\Wishlist;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    /** List all wishlist items for the authenticated user */
    public function index(Request $request)
    {
        $items = Wishlist::with('product.brand', 'product.user')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response($items, 200);
    }

    /** Toggle wishlist: add if missing, remove if present */
    public function toggle(Request $request, $productId)
    {
        $userId = $request->user()->id;

        $existing = Wishlist::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if ($existing) {
            $existing->delete();
            return response(['wishlisted' => false, 'message' => 'Removed from wishlist'], 200);
        }

        Wishlist::create([
            'user_id'    => $userId,
            'product_id' => $productId,
        ]);

        return response(['wishlisted' => true, 'message' => 'Added to wishlist'], 201);
    }
}
