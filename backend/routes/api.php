<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\SellerDashboardController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\RecentlyViewedController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\MediaController;

// Public Auth Endpoints
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
Route::post('/webhooks/stripe', [OrderController::class, 'stripeWebhook']);

// Public Storefront Catalog
Route::get('/products', [ProductController::class, 'index'])->middleware('throttle:search');
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/products/{id}/reviews', [ReviewController::class, 'index']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/brands', [BrandController::class, 'index']);

// Protected Endpoints (Sellers & Buyers)
Route::middleware('auth:sanctum')->group(function () {
    // User Profile Settings
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerification']);

    // Seller Product Management
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Seller Brand & Category creation
    Route::post('/brands', [BrandController::class, 'store']);
    Route::post('/categories', [CategoryController::class, 'store']);

    // Seller Warehouses & Stock Allocation
    Route::get('/warehouses', [WarehouseController::class, 'index']);
    Route::post('/warehouses', [WarehouseController::class, 'store']);
    Route::get('/shipping-carriers', [WarehouseController::class, 'getCarriers']);

    // Buyer Checkout and Order History
    Route::post('/checkout', [OrderController::class, 'checkout']);
    Route::post('/shipping/rates', [OrderController::class, 'shippingRates']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{id}/return', [OrderController::class, 'returnOrder']);
    Route::post('/orders/{id}/ship', [OrderController::class, 'ship']);
    Route::get('/orders/{id}/invoice', [OrderController::class, 'invoice']);
    Route::post('/orders/sync', [OrderController::class, 'syncOrders']);

    // Seller Dashboard & Sales Fulfillment
    Route::get('/seller/stats', [SellerDashboardController::class, 'stats']);
    Route::get('/seller/orders', [SellerDashboardController::class, 'orders']);
    Route::put('/seller/orders/{id}', [SellerDashboardController::class, 'updateOrderStatus']);
    Route::get('/seller/export/orders', [SellerDashboardController::class, 'exportOrders']);
    Route::get('/seller/export/inventory', [SellerDashboardController::class, 'exportInventory']);

    // Wishlist (Buyer)
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist/{productId}', [WishlistController::class, 'toggle']);

    // Recently Viewed (Buyer)
    Route::get('/recently-viewed', [RecentlyViewedController::class, 'index']);
    Route::post('/recently-viewed/{productId}', [RecentlyViewedController::class, 'track']);

    // Reviews & Coupons (Buyer)
    Route::post('/products/{id}/reviews', [ReviewController::class, 'store']);
    Route::post('/coupons/validate', [CouponController::class, 'validateCoupon']);
    Route::post('/media/upload', [MediaController::class, 'upload']);
});
