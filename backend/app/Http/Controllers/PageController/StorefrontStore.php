<?php

namespace App\Http\Controllers\PageController;

use App\Http\Controllers\Concerns\EnsuresRoles;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\User;
use App\Services\BrandService\ListBrands;
use App\Services\CategoryService\ListCategories;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StorefrontStore extends Controller
{
    use EnsuresRoles;

    public function __construct(
        private readonly ListCategories $listCategories,
        private readonly ListBrands $listBrands,
    ) {
    }

    public function __invoke(Request $request, int $sellerId)
    {
        $this->ensureStorefrontAccess($request);

        $seller = User::query()
            ->where('role', 'seller')
            ->findOrFail($sellerId);

        $products = Product::with(['user', 'brand', 'categories', 'variations', 'warehouses'])
            ->where('user_id', $seller->id)
            ->where('status', 'published')
            ->where('type', '!=', 'variation')
            ->latest('products.created_at')
            ->get();

        return Inertia::render('App', [
            'store' => [
                'id' => $seller->id,
                'name' => $seller->brand_name ?: $seller->name,
                'owner' => $seller->name,
                'email' => $seller->email,
                'address' => $seller->address,
                'city' => $seller->city,
                'state' => $seller->state,
                'country' => $seller->country,
                'pincode' => $seller->pincode,
                'shipping_acceptance_time' => $seller->shipping_acceptance_time,
                'default_fulfillment_channel' => $seller->default_fulfillment_channel,
                'handling_time_business_days' => $seller->handling_time_business_days,
                'gst_number' => $seller->gst_number,
            ],
            'products' => $products,
            'categories' => $this->listCategories->handle(),
            'brands' => $this->listBrands->handle(),
        ]);
    }
}
