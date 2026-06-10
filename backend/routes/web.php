<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\SellerDashboardController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PageController::class, 'home']);
Route::get('/categories', [PageController::class, 'categories']);
Route::get('/cart', [PageController::class, 'cart']);
Route::get('/products/{id}', [PageController::class, 'product'])->whereNumber('id');

Route::middleware('guest')->group(function () {
    Route::get('/login', [PageController::class, 'login']);
    Route::post('/login', [AuthController::class, 'loginWeb']);
    Route::get('/register', [PageController::class, 'register']);
    Route::post('/register', [AuthController::class, 'registerWeb']);
});

Route::get('/products', [ProductController::class, 'index']);

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logoutWeb']);
    Route::get('/checkout', [PageController::class, 'checkout']);
    Route::get('/orders', [PageController::class, 'buyerOrders']);
    Route::get('/profile', [PageController::class, 'profile']);

    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerification']);

    Route::post('/wishlist/{productId}', [WishlistController::class, 'toggle']);
    Route::post('/products/{id}/reviews', [ReviewController::class, 'store']);
    Route::post('/coupons/validate', [CouponController::class, 'validateCoupon']);
    Route::post('/shipping/rates', [OrderController::class, 'shippingRates']);
    Route::post('/checkout', [OrderController::class, 'checkout']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{id}/return', [OrderController::class, 'returnOrder']);
    Route::post('/orders/{id}/ship', [OrderController::class, 'ship']);
    Route::get('/orders/{id}/invoice', [OrderController::class, 'invoice']);
    Route::post('/recently-viewed/{productId}', [\App\Http\Controllers\RecentlyViewedController::class, 'track']);

    Route::get('/seller', [PageController::class, 'sellerOverview']);
    Route::get('/seller/products', [PageController::class, 'sellerProducts']);
    Route::get('/seller/inventory', [PageController::class, 'sellerInventory']);
    Route::get('/seller/orders', [PageController::class, 'sellerOrders']);
    Route::get('/seller/profile', [PageController::class, 'sellerProfile']);

    Route::get('/products/{id}/data', [ProductController::class, 'show'])->whereNumber('id');
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update'])->whereNumber('id');
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])->whereNumber('id');

    Route::get('/warehouses', [WarehouseController::class, 'index']);
    Route::post('/warehouses', [WarehouseController::class, 'store']);
    Route::get('/shipping-carriers', [WarehouseController::class, 'getCarriers']);

    Route::put('/seller/orders/{id}', [SellerDashboardController::class, 'updateOrderStatus']);
    Route::get('/seller/export/orders', [SellerDashboardController::class, 'exportOrders']);
    Route::get('/seller/export/inventory', [SellerDashboardController::class, 'exportInventory']);
});
