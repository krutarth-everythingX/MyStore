<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Events\OrderPlaced;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\RecentlyViewed;
use App\Models\Review;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;
use Inertia\Inertia;

class InertiaPageController extends Controller
{
    public function home(Request $request)
    {
        return Inertia::render('Home', [
            'products' => $this->storefrontProducts($request)->latest()->get(),
            'categories' => Category::with(['user', 'children', 'parent'])->get(),
            'brands' => Brand::with('user')->get(),
        ]);
    }

    public function categories()
    {
        return Inertia::render('AllCategories', [
            'categories' => Category::with(['user', 'children', 'parent'])->get(),
        ]);
    }

    public function product(Request $request, int $id)
    {
        $product = Product::with(['user', 'brand', 'categories', 'warehouses', 'variations'])->findOrFail($id);

        if ($request->user()?->role === 'buyer') {
            RecentlyViewed::updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'product_id' => $product->id,
                ],
                [
                    'viewed_at' => now(),
                ],
            );
        }

        $reviews = Review::with('user:id,name')
            ->where('product_id', $product->id)
            ->latest()
            ->get();

        $relatedProducts = $this->storefrontProducts(
            new Request([
                'category_id' => $product->categories->first()?->id,
            ])
        )
            ->where('products.id', '!=', $product->id)
            ->take(4)
            ->get();

        return Inertia::render('ProductDetails', [
            'product' => $product,
            'reviews' => $reviews,
            'averageRating' => round((float) Review::where('product_id', $product->id)->avg('rating'), 1),
            'totalReviews' => $reviews->count(),
            'relatedProducts' => $relatedProducts,
        ]);
    }

    public function cart(Request $request)
    {
        return Inertia::render('Cart', [
            'couponPayload' => $request->session()->get('couponPayload'),
        ]);
    }

    public function applyCoupon(Request $request)
    {
        $fields = $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('code', strtoupper($fields['code']))->first();

        if (! $coupon) {
            return to_route('cart')->with('error', 'Invalid discount code.');
        }

        if (! $coupon->active) {
            return to_route('cart')->with('error', 'This discount code is no longer active.');
        }

        if ($coupon->expiry_date && $coupon->expiry_date->isPast()) {
            return to_route('cart')->with('error', 'This discount code has expired.');
        }

        $subtotal = (float) $fields['subtotal'];
        if ($subtotal < (float) $coupon->min_spend) {
            return to_route('cart')->with('error', 'Minimum spend requirement not met for this code.');
        }

        return to_route('cart')->with('couponPayload', [
            'valid' => true,
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'discount_amount' => round($coupon->calculateDiscount($subtotal), 2),
        ]);
    }

    public function checkout(Request $request)
    {
        $this->ensureBuyer($request);

        return Inertia::render('Checkout', [
            'quote' => $request->session()->get('quote'),
            'checkoutIntent' => $request->session()->get('checkoutIntent'),
        ]);
    }

    public function quoteCheckout(Request $request)
    {
        $this->ensureBuyer($request);

        try {
            $response = app(OrderController::class)->shippingRates($request);
            $data = $this->responseData($response);

            return to_route('checkout')->with('quote', [
                'rates' => $data['rates'] ?? [],
                'serviceable' => ! empty($data['rates']),
            ]);
        } catch (HttpResponseException $exception) {
            return to_route('checkout')->with('error', $this->responseMessage($exception->getResponse()));
        }
    }

    public function placeCheckout(Request $request)
    {
        $this->ensureBuyer($request);

        try {
            $response = app(OrderController::class)->checkout($request);
            $data = $this->responseData($response);
        } catch (HttpResponseException $exception) {
            return to_route('checkout')->with('error', $this->responseMessage($exception->getResponse()));
        }

        if (($data['order']['payment_method'] ?? null) === 'COD') {
            return redirect()->route('orders', ['success' => 'true'])
                ->with('success', 'Order placed successfully.');
        }

        return to_route('checkout')->with('checkoutIntent', [
            'order_id' => $data['order']['id'],
            'client_secret' => $data['client_secret'],
        ]);
    }

    public function confirmCheckout(Request $request)
    {
        $this->ensureBuyer($request);

        $fields = $request->validate([
            'order_id' => 'required|integer|exists:orders,id',
        ]);

        $order = Order::with(['buyer', 'items.product'])
            ->where('buyer_id', $request->user()->id)
            ->findOrFail($fields['order_id']);

        if ($order->status === OrderStatus::Pending) {
            $order->update(['status' => OrderStatus::Processing]);
            event(new OrderPlaced($order));
        }

        return redirect()->route('orders', ['success' => 'true'])
            ->with('success', 'Order placed successfully.');
    }

    public function buyerOrders(Request $request)
    {
        $this->ensureBuyer($request);

        return Inertia::render('BuyerOrders', [
            'orders' => Order::with(['items.product.brand', 'items.product.user'])
                ->where('buyer_id', $request->user()->id)
                ->latest()
                ->get(),
        ]);
    }

    public function profile(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Profile', [
            'orders' => $user->role === 'buyer'
                ? Order::with(['items.product.brand', 'items.product.user'])
                    ->where('buyer_id', $user->id)
                    ->latest()
                    ->get()
                : [],
            'recentlyViewed' => $user->role === 'buyer'
                ? RecentlyViewed::with('product.brand', 'product.user')
                    ->where('user_id', $user->id)
                    ->orderByDesc('viewed_at')
                    ->limit(5)
                    ->get()
                : [],
        ]);
    }

    public function login(Request $request)
    {
        return Inertia::render('Login', [
            'redirect' => $request->query('redirect'),
        ]);
    }

    public function register()
    {
        return Inertia::render('Register');
    }

    public function sellerOverview(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('SellerOverview', [
            'stats' => $this->responseData(app(SellerDashboardController::class)->stats($request)),
        ]);
    }

    public function sellerProducts(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('SellerProducts', [
            'products' => Product::with(['user', 'brand', 'categories', 'variations', 'warehouses'])
                ->where('user_id', $request->user()->id)
                ->where('type', '!=', 'variation')
                ->latest()
                ->get(),
            'categories' => Category::with(['user', 'children', 'parent'])->get(),
            'warehouses' => Warehouse::where('user_id', $request->user()->id)->get(),
        ]);
    }

    public function sellerInventory(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('SellerInventory', [
            'warehouses' => Warehouse::where('user_id', $request->user()->id)->get(),
            'carriers' => $this->responseData(app(WarehouseController::class)->getCarriers())['carriers'] ?? [],
            'products' => Product::with(['brand', 'categories', 'warehouses', 'user'])
                ->where('user_id', $request->user()->id)
                ->where('type', '!=', 'variation')
                ->latest()
                ->get(),
        ]);
    }

    public function sellerOrders(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('SellerOrders', [
            'orders' => $this->responseData(app(SellerDashboardController::class)->orders($request)),
            'carriers' => $this->responseData(app(WarehouseController::class)->getCarriers())['carriers'] ?? [],
        ]);
    }

    public function sellerProfile(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('SellerProfile');
    }

    protected function storefrontProducts(Request $request)
    {
        $query = Product::with(['user', 'brand', 'categories', 'variations', 'warehouses'])
            ->where('status', 'published')
            ->where('type', '!=', 'variation');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($subQuery) use ($search) {
                $subQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $categoryId = $request->input('category_id');
            $query->whereHas('categories', function ($subQuery) use ($categoryId) {
                $subQuery->where('categories.id', $categoryId)
                    ->orWhere('categories.parent_id', $categoryId);
            });
        }

        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->input('brand_id'));
        }

        if ($request->filled('seller_id')) {
            $query->where('user_id', $request->input('seller_id'));
        }

        return $query;
    }

    protected function ensureBuyer(Request $request): void
    {
        abort_unless($request->user()?->role === 'buyer', 403);
    }

    protected function ensureSeller(Request $request): void
    {
        abort_unless($request->user()?->role === 'seller', 403);
    }

    protected function responseData($response): array
    {
        return json_decode($response->getContent(), true) ?? [];
    }

    protected function responseMessage($response): string
    {
        $payload = json_decode($response->getContent(), true);

        return $payload['message'] ?? 'The request could not be completed.';
    }
}
