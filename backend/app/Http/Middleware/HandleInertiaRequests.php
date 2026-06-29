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
        $user = $request->user()?->loadMissing('sellerVerification');
        $resolvedCountry = country_localization($user?->country);

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => fn () => $user,
            ],
            'localization' => [
                'base_currency' => config('localization.base_currency', 'USD'),
                'default_country' => config('localization.default_country', 'India'),
                'countries' => localization_countries(),
                'current' => [
                    'country' => $resolvedCountry['name'] ?? config('localization.default_country', 'India'),
                    'country_code' => $resolvedCountry['code'] ?? country_code_for($user?->country),
                    'currency' => $resolvedCountry['currency'] ?? currency_for_country($user?->country),
                    'locale' => $resolvedCountry['locale'] ?? locale_for_country($user?->country),
                    'timezone' => $resolvedCountry['timezone'] ?? user_timezone($user),
                ],
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
            'footerCategories' => fn () => \Illuminate\Support\Facades\Cache::remember('footer_categories', 3600, function () {
                return \App\Models\Category::whereNull('parent_id')
                    ->select('id', 'name', 'slug', 'parent_id')
                    ->take(4)
                    ->get();
            }),
        ]);
    }
}
