<?php

use App\Http\Controllers\AuthController\Login;
use App\Http\Controllers\AuthController\Logout;
use App\Http\Controllers\AuthController\Profile;
use App\Http\Controllers\AuthController\Register;
use App\Http\Controllers\AuthController\ResendVerification;
use App\Http\Controllers\AuthController\SendPhoneVerification;
use App\Http\Controllers\AuthController\UpdateProfile;
use App\Http\Controllers\AuthController\VerifyEmail;
use App\Http\Controllers\AuthController\VerifyPhone;
use App\Http\Controllers\BrandController\Index as BrandIndex;
use App\Http\Controllers\BrandController\Store as BrandStore;
use App\Http\Controllers\CategoryController\Index as CategoryIndex;
use App\Http\Controllers\CategoryController\Store as CategoryStore;
use App\Http\Controllers\CouponController\ValidateCoupon;
use App\Http\Controllers\InventoryController\AdjustStock;
use App\Http\Controllers\InventoryController\StoreTraceabilityRecord;
use App\Http\Controllers\MediaController\Upload as MediaUpload;
use App\Http\Controllers\OrderController\Cancel;
use App\Http\Controllers\OrderController\Checkout;
use App\Http\Controllers\OrderController\Index as OrderIndex;
use App\Http\Controllers\OrderController\Invoice;
use App\Http\Controllers\OrderController\ReturnOrder;
use App\Http\Controllers\OrderController\Ship;
use App\Http\Controllers\OrderController\ShippingRates;
use App\Http\Controllers\OrderController\StripeWebhook;
use App\Http\Controllers\OrderController\SyncOrders;
use App\Http\Controllers\ProductController\Destroy;
use App\Http\Controllers\ProductController\Index;
use App\Http\Controllers\ProductController\Show;
use App\Http\Controllers\ProductController\Store;
use App\Http\Controllers\ProductController\Update;
use App\Http\Controllers\RecentlyViewedController\Index as RecentlyViewedIndex;
use App\Http\Controllers\RecentlyViewedController\Track as RecentlyViewedTrack;
use App\Http\Controllers\ReviewController\Index as ReviewIndex;
use App\Http\Controllers\ReviewController\Store as ReviewStore;
use App\Http\Controllers\SellerDashboardController\ExportInventory;
use App\Http\Controllers\SellerDashboardController\ExportOrders;
use App\Http\Controllers\SellerDashboardController\Orders;
use App\Http\Controllers\SellerDashboardController\Stats;
use App\Http\Controllers\SellerDashboardController\UpdateOrderStatus;
use App\Http\Controllers\WarehouseController\Index as WarehouseIndex;
use App\Http\Controllers\WarehouseController\Store as WarehouseStore;
use App\Http\Controllers\WarehouseController\GetCarriers as WarehouseGetCarriers;
use App\Http\Controllers\WishlistController\Index as WishlistIndex;
use App\Http\Controllers\WishlistController\Toggle as WishlistToggle;
use Illuminate\Support\Facades\Route;

Route::post('/register', Register::class)->middleware('throttle:auth');
Route::post('/login', Login::class)->middleware('throttle:auth');
Route::post('/webhooks/stripe', StripeWebhook::class);

Route::get('/products', Index::class)->middleware('throttle:search');
Route::get('/products/{id}', Show::class);
Route::get('/products/{id}/reviews', ReviewIndex::class);
Route::get('/categories', CategoryIndex::class);
Route::get('/brands', BrandIndex::class);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', Profile::class);
    Route::put('/profile', UpdateProfile::class);
    Route::post('/logout', Logout::class);
    Route::post('/verify-email', VerifyEmail::class);
    Route::post('/resend-verification', ResendVerification::class);
    Route::post('/send-phone-verification', SendPhoneVerification::class);
    Route::post('/verify-phone', VerifyPhone::class);

    Route::post('/products', Store::class);
    Route::put('/products/{id}', Update::class);
    Route::delete('/products/{id}', Destroy::class);

    Route::post('/brands', BrandStore::class);
    Route::post('/categories', CategoryStore::class);

    Route::get('/warehouses', WarehouseIndex::class);
    Route::post('/warehouses', WarehouseStore::class);
    Route::post('/inventory/adjustments', AdjustStock::class);
    Route::post('/inventory/traceability', StoreTraceabilityRecord::class);
    Route::get('/shipping-carriers', WarehouseGetCarriers::class);

    Route::post('/checkout', Checkout::class);
    Route::post('/shipping/rates', ShippingRates::class);
    Route::get('/orders', OrderIndex::class);
    Route::post('/orders/{id}/cancel', Cancel::class);
    Route::post('/orders/{id}/return', ReturnOrder::class);
    Route::post('/orders/{id}/ship', Ship::class);
    Route::get('/orders/{id}/invoice', Invoice::class);
    Route::post('/orders/sync', SyncOrders::class);

    Route::get('/seller/stats', Stats::class);
    Route::get('/seller/orders', Orders::class);
    Route::put('/seller/orders/{id}', UpdateOrderStatus::class);
    Route::get('/seller/export/orders', ExportOrders::class);
    Route::get('/seller/export/inventory', ExportInventory::class);

    Route::get('/wishlist', WishlistIndex::class);
    Route::post('/wishlist/{productId}', WishlistToggle::class);

    Route::get('/recently-viewed', RecentlyViewedIndex::class);
    Route::post('/recently-viewed/{productId}', RecentlyViewedTrack::class);

    Route::post('/products/{id}/reviews', ReviewStore::class);
    Route::post('/coupons/validate', ValidateCoupon::class);
    Route::post('/media/upload', MediaUpload::class);
});
