<?php

namespace App\Http\Controllers;

use App\Models\RecentlyViewed;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RecentlyViewedController extends Controller
{
    /** Return the top 5 recently viewed products for the authenticated user */
    public function index(Request $request)
    {
        $items = RecentlyViewed::with('product.brand', 'product.user')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('viewed_at')
            ->limit(5)
            ->get();

        return response($items, 200);
    }

    /** Record a product view (upsert: update viewed_at if already exists) */
    public function track(Request $request, $productId)
    {
        $userId = $request->user()->id;

        // Upsert: update timestamp if row exists, otherwise create
        $existing = RecentlyViewed::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if ($existing) {
            $existing->viewed_at = Carbon::now();
            $existing->save();
        } else {
            RecentlyViewed::create([
                'user_id'    => $userId,
                'product_id' => $productId,
                'viewed_at'  => Carbon::now(),
            ]);
        }

        return response(['tracked' => true], 200);
    }
}
