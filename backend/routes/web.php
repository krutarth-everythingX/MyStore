<?php

use App\Http\Controllers\AuthController\LoginWeb;
use App\Http\Controllers\AuthController\LogoutWeb;
use App\Http\Controllers\AuthController\RegisterWeb;
use App\Http\Controllers\AuthController\ResendVerification;
use App\Http\Controllers\AuthController\UpdateProfile;
use App\Http\Controllers\AuthController\VerifyEmail;
use App\Http\Controllers\CouponController\ValidateCoupon;
use App\Http\Controllers\OrderController\Cancel;
use App\Http\Controllers\OrderController\Checkout as OrderCheckout;
use App\Http\Controllers\OrderController\Invoice;
use App\Http\Controllers\OrderController\ReturnOrder;
use App\Http\Controllers\OrderController\Ship;
use App\Http\Controllers\OrderController\ShippingRates;
use App\Http\Controllers\PageController\BuyerOrders;
use App\Http\Controllers\PageController\Cart;
use App\Http\Controllers\PageController\Categories;
use App\Http\Controllers\PageController\Checkout;
use App\Http\Controllers\PageController\Home;
use App\Http\Controllers\PageController\Login;
use App\Http\Controllers\PageController\Product;
use App\Http\Controllers\PageController\Notifications;
use App\Http\Controllers\PageController\Profile;
use App\Http\Controllers\PageController\Register;
use App\Http\Controllers\PageController\SellerInventory;
use App\Http\Controllers\PageController\SellerOrders;
use App\Http\Controllers\PageController\SellerOverview;
use App\Http\Controllers\PageController\SellerProducts;
use App\Http\Controllers\PageController\SellerProfile;
use App\Http\Controllers\ProductController\Destroy;
use App\Http\Controllers\ProductController\Index;
use App\Http\Controllers\ProductController\Show;
use App\Http\Controllers\ProductController\Store;
use App\Http\Controllers\ProductController\Update;
use App\Http\Controllers\RecentlyViewedController\Track as RecentlyViewedTrack;
use App\Http\Controllers\ReviewController\Store as ReviewStore;
use App\Http\Controllers\SellerDashboardController\ExportInventory;
use App\Http\Controllers\SellerDashboardController\ExportOrders;
use App\Http\Controllers\SellerDashboardController\UpdateOrderStatus;
use App\Http\Controllers\WarehouseController\Index as WarehouseIndex;
use App\Http\Controllers\WarehouseController\Store as WarehouseStore;
use App\Http\Controllers\WarehouseController\GetCarriers as WarehouseGetCarriers;
use App\Http\Controllers\WishlistController\Toggle as WishlistToggle;
use Illuminate\Support\Facades\Route;

Route::get('/', Home::class);
Route::get('/categories', Categories::class);
Route::get('/cart', Cart::class);
Route::get('/products/{id}', Product::class)->whereNumber('id');

Route::middleware('guest')->group(function () {
    Route::get('/login', Login::class);
    Route::post('/login', LoginWeb::class);
    Route::get('/register', Register::class);
    Route::post('/register', RegisterWeb::class);
});

Route::get('/products', Index::class);

Route::middleware('auth')->group(function () {
    Route::post('/logout', LogoutWeb::class);
    Route::get('/checkout', Checkout::class);
    Route::get('/orders', BuyerOrders::class)->name('orders');
    Route::get('/profile', Profile::class);
    Route::get('/notifications', Notifications::class);

    Route::put('/profile', UpdateProfile::class);
    Route::post('/verify-email', VerifyEmail::class);
    Route::post('/resend-verification', ResendVerification::class);

    Route::post('/wishlist/{productId}', WishlistToggle::class);
    Route::post('/products/{id}/reviews', ReviewStore::class);
    Route::post('/coupons/validate', ValidateCoupon::class);
    Route::post('/shipping/rates', ShippingRates::class);
    Route::post('/checkout', OrderCheckout::class);
    Route::post('/orders/{id}/cancel', Cancel::class);
    Route::post('/orders/{id}/return', ReturnOrder::class);
    Route::post('/orders/{id}/ship', Ship::class);
    Route::get('/orders/{id}/invoice', Invoice::class);
    Route::post('/recently-viewed/{productId}', RecentlyViewedTrack::class);

    Route::get('/seller', SellerOverview::class);
    Route::get('/seller/products', SellerProducts::class);
    Route::get('/seller/inventory', SellerInventory::class);
    Route::get('/seller/orders', SellerOrders::class);
    Route::get('/seller/profile', SellerProfile::class);

    Route::get('/products/{id}/data', Show::class)->whereNumber('id');
    Route::post('/products', Store::class);
    Route::put('/products/{id}', Update::class)->whereNumber('id');
    Route::delete('/products/{id}', Destroy::class)->whereNumber('id');

    Route::get('/warehouses', WarehouseIndex::class);
    Route::post('/warehouses', WarehouseStore::class);
    Route::get('/shipping-carriers', WarehouseGetCarriers::class);

    Route::put('/seller/orders/{id}', UpdateOrderStatus::class);
    Route::get('/seller/export/orders', ExportOrders::class);
    Route::get('/seller/export/inventory', ExportInventory::class);
});
