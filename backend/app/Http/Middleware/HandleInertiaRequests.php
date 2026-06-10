<?php

namespace App\Http\Middleware;

use App\Models\Wishlist;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Defines the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => fn () => $request->user(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'coupon' => fn () => $request->session()->get('coupon'),
                'shippingRates' => fn () => $request->session()->get('shipping_rates'),
                'checkout' => fn () => $request->session()->get('checkout'),
            ],
            'routeParams' => fn () => $request->route()?->parametersWithoutNulls() ?? [],
            'wishlist' => fn () => $request->user()?->role === 'buyer'
                ? Wishlist::with('product.brand', 'product.user')
                    ->where('user_id', $request->user()->id)
                    ->latest()
                    ->get()
                : [],
        ]);
    }
}
