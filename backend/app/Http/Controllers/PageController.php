<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class PageController extends Controller
{
    public function home(Request $request)
    {
        $productRequest = Request::create('/products', 'GET', [
            'search' => $request->query('search'),
            'category_id' => $request->query('category') ?: $request->query('category_id'),
        ]);

        return Inertia::render('App', [
            'products' => $this->responseData(app(ProductController::class)->index($productRequest)),
            'categories' => $this->responseData(app(CategoryController::class)->index()),
            'brands' => $this->responseData(app(BrandController::class)->index()),
        ]);
    }

    public function categories()
    {
        return Inertia::render('App', [
            'categories' => $this->responseData(app(CategoryController::class)->index()),
        ]);
    }

    public function product(Request $request, int $id)
    {
        if ($request->expectsJson()) {
            return app(ProductController::class)->show($id);
        }

        $productResponse = app(ProductController::class)->show($id);
        $product = $this->responseData($productResponse);

        if (! is_array($product)) {
            abort(404);
        }

        $reviews = $this->responseData(app(ReviewController::class)->index($id));
        $relatedProducts = Product::with(['user', 'brand', 'categories', 'variations', 'warehouses'])
            ->where('status', 'published')
            ->where('type', '!=', 'variation')
            ->where('id', '!=', $id)
            ->latest()
            ->take(4)
            ->get();

        return Inertia::render('App', [
            'productDetails' => $product,
            'productReviews' => $reviews['reviews'] ?? [],
            'averageRating' => $reviews['average_rating'] ?? 0,
            'totalReviews' => $reviews['total_reviews'] ?? 0,
            'relatedProducts' => $relatedProducts,
        ]);
    }

    public function cart()
    {
        return Inertia::render('App');
    }

    public function login()
    {
        return Inertia::render('App');
    }

    public function register()
    {
        return Inertia::render('App');
    }

    public function checkout()
    {
        return Inertia::render('App');
    }

    public function buyerOrders(Request $request)
    {
        return Inertia::render('App', [
            'buyerOrders' => $this->responseData(app(OrderController::class)->index($request)),
        ]);
    }

    public function profile(Request $request)
    {
        return Inertia::render('App', [
            'buyerOrders' => $request->user()?->role === 'buyer'
                ? $this->responseData(app(OrderController::class)->index($request))
                : [],
            'recentlyViewed' => $request->user()?->role === 'buyer'
                ? $this->responseData(app(RecentlyViewedController::class)->index($request))
                : [],
        ]);
    }

    public function sellerOverview(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('App', [
            'sellerStats' => $this->responseData(app(SellerDashboardController::class)->stats($request)),
        ]);
    }

    public function sellerProducts(Request $request)
    {
        $this->ensureSeller($request);

        $productRequest = Request::create('/products', 'GET', [
            'seller_id' => $request->user()->id,
        ]);

        return Inertia::render('App', [
            'sellerProducts' => $this->responseData(app(ProductController::class)->index($productRequest)),
            'categories' => $this->responseData(app(CategoryController::class)->index()),
            'sellerWarehouses' => $this->responseData(app(WarehouseController::class)->index($request)),
        ]);
    }

    public function sellerInventory(Request $request)
    {
        $this->ensureSeller($request);

        $productRequest = Request::create('/products', 'GET', [
            'seller_id' => $request->user()->id,
        ]);

        return Inertia::render('App', [
            'sellerWarehouses' => $this->responseData(app(WarehouseController::class)->index($request)),
            'sellerCarriers' => $this->responseData(app(WarehouseController::class)->getCarriers())['carriers'] ?? [],
            'sellerProducts' => $this->responseData(app(ProductController::class)->index($productRequest)),
        ]);
    }

    public function sellerOrders(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('App', [
            'sellerOrders' => $this->responseData(app(SellerDashboardController::class)->orders($request)),
            'sellerCarriers' => $this->responseData(app(WarehouseController::class)->getCarriers())['carriers'] ?? [],
        ]);
    }

    public function sellerProfile(Request $request)
    {
        $this->ensureSeller($request);

        return Inertia::render('App');
    }

    private function responseData(SymfonyResponse $response): mixed
    {
        $content = $response->getContent();

        return $content === false || $content === ''
            ? null
            : json_decode($content, true);
    }

    private function ensureSeller(Request $request): void
    {
        abort_unless($request->user()?->role === 'seller', Response::HTTP_FORBIDDEN);
    }
}
