<?php

use App\Http\Controllers\AuthController\GoogleCallback;
use App\Http\Controllers\AuthController\GoogleRedirect;
use App\Http\Controllers\AuthController\LoginWeb;
use App\Http\Controllers\AuthController\LogoutWeb;
use App\Http\Controllers\AuthController\RegisterWeb;
use App\Http\Controllers\AuthController\ResendVerification;
use App\Http\Controllers\AuthController\RequestAccountDeletion;
use App\Http\Controllers\AuthController\ResetPassword as ResetPasswordAction;
use App\Http\Controllers\AuthController\SendPhoneVerification;
use App\Http\Controllers\AuthController\SendPasswordResetLink;
use App\Http\Controllers\AuthController\UpdateProfile;
use App\Http\Controllers\AuthController\VerifyEmail;
use App\Http\Controllers\AuthController\VerifyPhone;
use App\Http\Controllers\CouponController\ValidateCoupon;
use App\Http\Controllers\DemoProductImage;
use App\Http\Controllers\InventoryController\AdjustStock;
use App\Http\Controllers\InventoryController\StoreReconciliation;
use App\Http\Controllers\InventoryController\StoreStockMovement;
use App\Http\Controllers\InventoryController\StoreStockEntry;
use App\Http\Controllers\InventoryController\StoreTraceabilityRecord;
use App\Http\Controllers\MediaController\Upload as MediaUpload;
use App\Http\Controllers\OrderController\Cancel;
use App\Http\Controllers\OrderController\Checkout as OrderCheckout;
use App\Http\Controllers\OrderController\Invoice;
use App\Http\Controllers\OrderController\ReturnOrder;
use App\Http\Controllers\OrderController\ShippingSlip;
use App\Http\Controllers\OrderController\Ship;
use App\Http\Controllers\OrderController\ShippingRates;
use App\Http\Controllers\PageController\BuyerOrders;
use App\Http\Controllers\PageController\BuyerOrderDetails;
use App\Http\Controllers\PageController\Cart;
use App\Http\Controllers\PageController\CategoryCatalog;
use App\Http\Controllers\PageController\Categories;
use App\Http\Controllers\CategoryController\Store as CategoryStore;
use App\Http\Controllers\CategoryController\Update as CategoryUpdate;
use App\Http\Controllers\CategoryController\Destroy as CategoryDestroy;
use App\Http\Controllers\AttributeController\Store as AttributeStore;
use App\Http\Controllers\AttributeController\Update as AttributeUpdate;
use App\Http\Controllers\AttributeController\Destroy as AttributeDestroy;
use App\Http\Controllers\BrandController\Destroy as BrandDestroy;
use App\Http\Controllers\BrandController\ResolveLogo as BrandResolveLogo;
use App\Http\Controllers\BrandController\Store as BrandStore;
use App\Http\Controllers\BrandController\Update as BrandUpdate;
use App\Http\Controllers\CollectionController\Store as CollectionStore;
use App\Http\Controllers\CollectionController\Destroy as CollectionDestroy;
use App\Http\Controllers\PageController\Checkout;
use App\Http\Controllers\PageController\ForgotPassword;
use App\Http\Controllers\PageController\Home;
use App\Http\Controllers\PageController\Login;
use App\Http\Controllers\PageController\Product;
use App\Http\Controllers\PageController\Notifications;
use App\Http\Controllers\PageController\PasswordResetComplete;
use App\Http\Controllers\PageController\Profile;
use App\Http\Controllers\PageController\Register;
use App\Http\Controllers\PageController\ResetPassword;
use App\Http\Controllers\PageController\SearchProducts;
use App\Http\Controllers\PageController\SellerAttributes;
use App\Http\Controllers\PageController\SellerBrands;
use App\Http\Controllers\PageController\SellerCollections;
use App\Http\Controllers\PageController\SellerInventory;
use App\Http\Controllers\PageController\SellerInventoryCreate;
use App\Http\Controllers\PageController\SellerReconciliationCreate;
use App\Http\Controllers\PageController\SellerInventorySection;
use App\Http\Controllers\PageController\SellerOrders;
use App\Http\Controllers\PageController\SellerOverview;
use App\Http\Controllers\PageController\SellerCategories;
use App\Http\Controllers\PageController\SellerSetup;
use App\Http\Controllers\PageController\SellerVerification;
use App\Http\Controllers\PageController\SellerVerificationSubmitted;
use App\Http\Controllers\PageController\SellerVerificationReview;
use App\Http\Controllers\PageController\SellerProcurement;
use App\Http\Controllers\PageController\SellerProductExport;
use App\Http\Controllers\PageController\SellerProductImport;
use App\Http\Controllers\PageController\SellerProducts;
use App\Http\Controllers\PageController\SellerProductPreview;
use App\Http\Controllers\PageController\SellerProfile;
use App\Http\Controllers\PageController\SellerUnitMeasurements;
use App\Http\Controllers\PageController\StorefrontCollection;
use App\Http\Controllers\PageController\StorefrontStore;
use App\Http\Controllers\PageController\WeekMostWanted;
use App\Http\Controllers\ProductController\BulkAction;
use App\Http\Controllers\ProductController\Destroy;
use App\Http\Controllers\ProductController\Import as ImportProducts;
use App\Http\Controllers\ProductController\Index;
use App\Http\Controllers\ProductController\Recommendations;
use App\Http\Controllers\ProductController\Show;
use App\Http\Controllers\ProductController\Store;
use App\Http\Controllers\ProductController\Update;
use App\Http\Controllers\RecentlyViewedController\Track as RecentlyViewedTrack;
use App\Http\Controllers\ReviewController\Store as ReviewStore;
use App\Http\Controllers\SearchController\Suggestions as SearchSuggestions;
use App\Http\Controllers\SellerDashboardController\ExportInventory;
use App\Http\Controllers\SellerDashboardController\ExportOrders;
use App\Http\Controllers\SellerDashboardController\ApproveReturnRequest;
use App\Http\Controllers\SellerDashboardController\RejectReturnRequest;
use App\Http\Controllers\SellerVerificationController\Review as ReviewSellerVerification;
use App\Http\Controllers\SellerVerificationController\Upsert as UpsertSellerVerification;
use App\Http\Controllers\SellerVerificationController\Withdraw as WithdrawSellerVerification;
use App\Http\Controllers\SellerDashboardController\UpdateOrderStatus;
use App\Http\Controllers\WarehouseController\Index as WarehouseIndex;
use App\Http\Controllers\WarehouseController\Store as WarehouseStore;
use App\Http\Controllers\WarehouseController\Update as WarehouseUpdate;
use App\Http\Controllers\WarehouseController\Destroy as WarehouseDestroy;
use App\Http\Controllers\WarehouseController\GetCarriers as WarehouseGetCarriers;
use App\Http\Controllers\WishlistController\Toggle as WishlistToggle;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', Home::class);
Route::get('/demo-products/{sku}.svg', DemoProductImage::class);
Route::get('/search', function () {
    return Inertia::render('App');
});
Route::get('/search/results', SearchProducts::class);
Route::get('/categories', Categories::class);
Route::get('/categories/{category}', CategoryCatalog::class)->whereNumber('category');
Route::get('/week-most-wanted', WeekMostWanted::class);
Route::get('/cart', Cart::class);
Route::get('/products/{id}', Product::class)->whereNumber('id');
Route::get('/collections/{handle}', StorefrontCollection::class);
Route::get('/stores/{sellerId}', StorefrontStore::class)->whereNumber('sellerId');

Route::middleware('guest')->group(function () {
    Route::get('/login', Login::class);
    Route::post('/login', LoginWeb::class);
    Route::get('/register', Register::class);
    Route::post('/register', RegisterWeb::class);
    Route::get('/forgot-password', ForgotPassword::class);
    Route::get('/auth/google', GoogleRedirect::class);
    Route::get('/auth/google/callback', GoogleCallback::class);
});

Route::get('/reset-password/{token}', ResetPassword::class)->name('password.reset');
Route::post('/reset-password', ResetPasswordAction::class)->name('password.store');

Route::get('/products', Index::class);
Route::get('/products/{id}/recommendations', Recommendations::class)->whereNumber('id');
Route::get('/search/suggestions', SearchSuggestions::class)->middleware('throttle:search');
Route::post('/send-password-reset-link', SendPasswordResetLink::class);

Route::middleware('auth')->group(function () {
    Route::post('/logout', LogoutWeb::class);
    Route::get('/checkout', Checkout::class);
    Route::get('/profile/orders/my-orders', BuyerOrders::class)->name('orders');
    Route::get('/profile/orders/my-orders/{id}', BuyerOrderDetails::class)->whereNumber('id');
    Route::get('/profile', Profile::class);
    Route::get('/notifications', Notifications::class);

    Route::put('/profile', UpdateProfile::class);
    Route::post('/seller/verification', UpsertSellerVerification::class);
    Route::post('/seller/verification/withdraw', WithdrawSellerVerification::class);
    Route::post('/seller/verification/{id}/review', ReviewSellerVerification::class);
    Route::post('/verify-email', VerifyEmail::class);
    Route::post('/resend-verification', ResendVerification::class);
    Route::post('/send-phone-verification', SendPhoneVerification::class);
    Route::post('/verify-phone', VerifyPhone::class);
    Route::post('/account/delete-request', RequestAccountDeletion::class);
    Route::get('/password-reset-complete', PasswordResetComplete::class);

    Route::post('/wishlist/{productId}', WishlistToggle::class);
    Route::post('/products/{id}/reviews', ReviewStore::class);
    Route::post('/media/upload', MediaUpload::class);
    Route::post('/coupons/validate', ValidateCoupon::class);
    Route::post('/shipping/rates', ShippingRates::class);
    Route::post('/checkout', OrderCheckout::class);
    Route::post('/orders/{id}/cancel', Cancel::class);
    Route::post('/orders/{id}/return', ReturnOrder::class);
    Route::post('/orders/{id}/ship', Ship::class);
    Route::get('/orders/{id}/invoice', Invoice::class);
    Route::get('/orders/{id}/shipping-slip', ShippingSlip::class);
    Route::post('/recently-viewed/{productId}', RecentlyViewedTrack::class);

    Route::redirect('/seller', '/seller/inventory');
    Route::get('/seller/setup', SellerSetup::class);
    Route::get('/seller/verification', SellerVerification::class);
    Route::get('/seller/verification/submitted', SellerVerificationSubmitted::class);
    Route::get('/seller/verification-review', SellerVerificationReview::class);
    Route::get('/seller/categories', SellerCategories::class);
    Route::get('/seller/collections', SellerCollections::class);
    Route::get('/seller/brands', SellerBrands::class);
    Route::get('/seller/attributes', SellerAttributes::class);
    Route::get('/seller/units', SellerUnitMeasurements::class);
    Route::get('/seller/products', SellerProducts::class);
    Route::get('/seller/products/import', SellerProductImport::class);
    Route::get('/seller/products/export', SellerProductExport::class);
    Route::get('/seller/products/preview-draft', function () {
        abort_unless(request()->user()?->role === 'seller', 403);

        if (! seller_setup_complete(request()->user())) {
            return redirect('/seller/setup');
        }

        return Inertia::render('App', [
            'sellerPreview' => true,
            'previewDraftKey' => request('key'),
        ]);
    });
    Route::get('/seller/products/{id}/preview', SellerProductPreview::class)->whereNumber('id');
    Route::get('/seller/inventory', SellerInventory::class);
    Route::get('/seller/inventory/stock-entries/create', SellerInventoryCreate::class);
    Route::get('/seller/inventory/reconciliation/create', SellerReconciliationCreate::class);
    Route::get('/seller/inventory/{section}', SellerInventorySection::class)
        ->whereIn('section', [
            'stock-entries',
            'stock-movements',
            'reconciliation',
            'batch-tracking',
            'serial-tracking',
            'expiry-tracking',
        ]);
    Route::get('/seller/orders', SellerOrders::class);
    Route::get('/seller/procurement', SellerProcurement::class);
    Route::get('/seller/profile', SellerProfile::class);
    Route::get('/products/{id}/data', Show::class)->whereNumber('id');
    Route::post('/products', Store::class);
    Route::post('/products/import', ImportProducts::class);
    Route::post('/products/bulk-action', BulkAction::class);
    Route::post('/seller/collections', CollectionStore::class);
    Route::delete('/seller/collections/{id}', CollectionDestroy::class)->whereNumber('id');
    Route::get('/brands/resolve-logo', BrandResolveLogo::class);
    Route::post('/brands', BrandStore::class);
    Route::put('/brands/{id}', BrandUpdate::class)->whereNumber('id');
    Route::delete('/brands/{id}', BrandDestroy::class)->whereNumber('id');
    Route::post('/categories', CategoryStore::class);
    Route::put('/categories/{id}', CategoryUpdate::class)->whereNumber('id');
    Route::delete('/categories/{id}', CategoryDestroy::class)->whereNumber('id');
    Route::post('/seller/attributes', AttributeStore::class);
    Route::put('/seller/attributes/{id}', AttributeUpdate::class)->whereNumber('id');
    Route::delete('/seller/attributes/{id}', AttributeDestroy::class)->whereNumber('id');
    Route::put('/products/{id}', Update::class)->whereNumber('id');
    Route::delete('/products/{id}', Destroy::class)->whereNumber('id');

    Route::get('/warehouses', WarehouseIndex::class);
    Route::post('/warehouses', WarehouseStore::class);
    Route::put('/warehouses/{id}', WarehouseUpdate::class)->whereNumber('id');
    Route::delete('/warehouses/{id}', WarehouseDestroy::class)->whereNumber('id');
    Route::post('/inventory/adjustments', AdjustStock::class);
    Route::post('/inventory/reconciliations', StoreReconciliation::class);
    Route::post('/inventory/stock-entries', StoreStockEntry::class);
    Route::post('/inventory/stock-movements', StoreStockMovement::class);
    Route::post('/inventory/traceability', StoreTraceabilityRecord::class);
    Route::get('/shipping-carriers', WarehouseGetCarriers::class);

    Route::put('/seller/orders/{id}', UpdateOrderStatus::class);
    Route::post('/seller/orders/{id}/returns/approve', ApproveReturnRequest::class);
    Route::post('/seller/orders/{id}/returns/reject', RejectReturnRequest::class);
    Route::get('/seller/export/orders', ExportOrders::class);
    Route::get('/seller/export/inventory', ExportInventory::class);
});
