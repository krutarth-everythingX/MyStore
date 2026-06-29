import React, { useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { Loader2, Package } from 'lucide-react';

// Pages
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import BuyerOrders from './pages/BuyerOrders';
import BuyerCollection from './pages/BuyerCollection';
import BuyerStore from './pages/BuyerStore';
import Profile from './pages/Profile';
import BuyerOrderDetails from './pages/BuyerOrderDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import AllCategories from './pages/AllCategories';
import CategoryCatalog from './pages/CategoryCatalog';
import WeekMostWanted from './pages/WeekMostWanted';
import Notifications from './pages/Notifications';
import ForgotPassword from './pages/ForgotPassword';
import PasswordResetComplete from './pages/PasswordResetComplete';
import ResetPassword from './pages/ResetPassword';
import SearchPage from './pages/SearchPage';
import SearchResults from './pages/SearchResults';

// Seller Dashboard Pages
import SellerOverview from './pages/SellerOverview';
import SellerProducts from './pages/SellerProducts';
import SellerProductPreview from './pages/SellerProductPreview';
import SellerProductTransfer from './pages/SellerProductTransfer';
import SellerCategories from './pages/SellerCategories';
import SellerCollections from './pages/SellerCollections';
import SellerBrands from './pages/SellerBrands';
import SellerAttributes from './pages/SellerAttributes';
import SellerUnitMeasurements from './pages/SellerUnitMeasurements';
import SellerInventory from './pages/SellerInventory';
import SellerInventoryCreate from './pages/SellerInventoryCreate';
import SellerReconciliationCreate from './pages/SellerReconciliationCreate';
import SellerInventorySection from './pages/SellerInventorySection';
import SellerOrders from './pages/SellerOrders';
import SellerProfile from './pages/SellerProfile';
import SellerSetup from './pages/SellerSetup';
import SellerVerification from './pages/SellerVerification';
import SellerVerificationSubmitted from './pages/SellerVerificationSubmitted';
import SellerVerificationReview from './pages/SellerVerificationReview';
import SellerProcurement from './pages/SellerProcurement';
const normalizePath = path => {
  if (!path) {
    return '/';
  }
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
};
const getPathname = url => normalizePath(new URL(url, window.location.origin).pathname);
const Redirect = ({
  to,
  replace = false
}) => {
  useEffect(() => {
    router.visit(to, {
      replace,
      preserveScroll: true
    });
  }, [replace, to]);
  return null;
};
const LoadingScreen = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-2xl shadow-neutral-950/20">
        <Package size={36} className="animate-pulse" />
        <div className="absolute -inset-4 animate-[spin_3s_linear_infinite] rounded-[2rem] border-2 border-dashed border-neutral-950/20" />
      </div>
      <div className="flex items-center gap-3">
        <Loader2 size={18} className="animate-spin text-neutral-400" />
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-950">Loading Store</span>
      </div>
    </div>
  </div>
);
const sellerVerificationRecord = user => user?.sellerVerification || user?.seller_verification || null;
const sellerVerificationApproved = user => String(sellerVerificationRecord(user)?.status || 'draft') === 'approved';
const sellerVerificationSubmitted = user => String(sellerVerificationRecord(user)?.status || 'draft') === 'submitted';
const sellerProfileReady = user => {
  const requiresIndianTaxRegistration = String(user?.country || '').trim().toLowerCase() === 'india';

  return Boolean(
    user?.brand_name
    && user?.address
    && user?.country
    && user?.default_fulfillment_channel
    && (!requiresIndianTaxRegistration || user?.gst_number)
  );
};
const sellerWorkingPath = user => {
  if (sellerVerificationApproved(user) && sellerProfileReady(user)) {
    return '/seller/inventory';
  }

  if (sellerVerificationSubmitted(user)) {
    return '/seller/verification/submitted';
  }

  return '/seller/verification';
};
const ProtectedRoute = ({
  children,
  allowedRole,
  allowIncompleteSeller = false
}) => {
  const {
    user,
    loading
  } = useAuth();
  if (loading) {
    return <LoadingScreen />;
  }
  if (!user) {
    return <Redirect to="/login" replace />;
  }
  if (allowedRole && user.role !== allowedRole) {
    return <Redirect to={user.role === 'seller' ? sellerWorkingPath(user) : '/'} replace />;
  }
  if (user.role === 'seller' && !allowIncompleteSeller) {
    if ((!sellerVerificationApproved(user) || !sellerProfileReady(user)) && window.location.pathname !== sellerWorkingPath(user)) {
      return <Redirect to={sellerWorkingPath(user)} replace />;
    }
  }
  return children;
};
const StorefrontRoute = ({
  children
}) => {
  const {
    user,
    loading
  } = useAuth();
  if (loading) {
    return <LoadingScreen />;
  }
  if (user?.role === 'seller') {
    return <Redirect to={sellerWorkingPath(user)} replace />;
  }
  return children;
};
const RouteView = () => {
  const {
    url
  } = usePage();
  const pathname = getPathname(url || window.location.href);
  if (pathname === '/') {
    return <StorefrontRoute>
        <Home />
      </StorefrontRoute>;
  }
  if (pathname === '/cart') {
    return <StorefrontRoute>
        <Cart />
      </StorefrontRoute>;
  }
  if (pathname === '/categories') {
    return <StorefrontRoute>
        <AllCategories />
      </StorefrontRoute>;
  }
  if (pathname === '/search') {
    return <StorefrontRoute>
        <SearchPage />
      </StorefrontRoute>;
  }
  if (pathname === '/search/results') {
    return <StorefrontRoute>
        <SearchResults />
      </StorefrontRoute>;
  }
  if (pathname.startsWith('/categories/')) {
    return <StorefrontRoute>
        <CategoryCatalog />
      </StorefrontRoute>;
  }
  if (pathname === '/week-most-wanted') {
    return <StorefrontRoute>
        <WeekMostWanted />
      </StorefrontRoute>;
  }
  if (pathname.startsWith('/collections/')) {
    return <StorefrontRoute>
        <BuyerCollection />
      </StorefrontRoute>;
  }
  if (pathname.startsWith('/stores/')) {
    return <StorefrontRoute>
        <BuyerStore />
      </StorefrontRoute>;
  }
  if (pathname === '/login') {
    return <Login />;
  }
  if (pathname === '/register') {
    return <Register />;
  }
  if (pathname === '/forgot-password') {
    return <ForgotPassword />;
  }
  if (pathname.startsWith('/reset-password/')) {
    return <ResetPassword />;
  }
  if (pathname === '/password-reset-complete') {
    return <ProtectedRoute allowIncompleteSeller>
        <PasswordResetComplete />
      </ProtectedRoute>;
  }
  if (pathname === '/checkout') {
    return <ProtectedRoute allowedRole="buyer">
        <Checkout />
      </ProtectedRoute>;
  }
  if (pathname === '/orders' || pathname === '/profile/orders/my-orders') {
    return <ProtectedRoute allowedRole="buyer">
        <BuyerOrders />
      </ProtectedRoute>;
  }
  if (/^\/orders\/\d+$/.test(pathname) || /^\/profile\/orders\/my-orders\/\d+$/.test(pathname)) {
    return <ProtectedRoute allowedRole="buyer">
        <BuyerOrderDetails />
      </ProtectedRoute>;
  }
  if (pathname === '/profile') {
    return <ProtectedRoute allowedRole="buyer">
        <Profile />
      </ProtectedRoute>;
  }
  if (pathname === '/notifications') {
    return <ProtectedRoute allowedRole="buyer">
        <Notifications />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/inventory') {
    return <ProtectedRoute allowedRole="seller">
        <SellerInventory />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/setup') {
    return <ProtectedRoute allowedRole="seller" allowIncompleteSeller>
        <SellerSetup />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/verification') {
    return <ProtectedRoute allowedRole="seller" allowIncompleteSeller>
        <SellerVerification />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/verification/submitted') {
    return <ProtectedRoute allowedRole="seller" allowIncompleteSeller>
        <SellerVerificationSubmitted />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/verification-review') {
    return <ProtectedRoute allowIncompleteSeller>
        <SellerVerificationReview />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/products') {
    return <ProtectedRoute allowedRole="seller">
        <SellerProducts />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/products/import' || pathname === '/seller/products/export') {
    return <ProtectedRoute allowedRole="seller">
        <SellerProductTransfer />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/categories') {
    return <ProtectedRoute allowedRole="seller">
        <SellerCategories />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/collections') {
    return <ProtectedRoute allowedRole="seller">
        <SellerCollections />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/procurement') {
    return <ProtectedRoute allowedRole="seller">
        <SellerProcurement />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/brands') {
    return <ProtectedRoute allowedRole="seller">
        <SellerBrands />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/attributes') {
    return <ProtectedRoute allowedRole="seller">
        <SellerAttributes />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/units') {
    return <ProtectedRoute allowedRole="seller">
        <SellerUnitMeasurements />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/products/preview-draft' || /^\/seller\/products\/\d+\/preview$/.test(pathname)) {
    return <ProtectedRoute allowedRole="seller">
        <SellerProductPreview />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/inventory/stock-entries/create') {
    return <ProtectedRoute allowedRole="seller">
        <SellerInventoryCreate />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/inventory/reconciliation/create') {
    return <ProtectedRoute allowedRole="seller">
        <SellerReconciliationCreate />
      </ProtectedRoute>;
  }
  if (pathname.startsWith('/seller/inventory/')) {
    return <ProtectedRoute allowedRole="seller">
        <SellerInventorySection />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/orders') {
    return <ProtectedRoute allowedRole="seller">
        <SellerOrders />
      </ProtectedRoute>;
  }
  if (pathname === '/seller/profile') {
    return <ProtectedRoute allowedRole="seller">
        <SellerProfile />
      </ProtectedRoute>;
  }
  if (pathname.startsWith('/products/')) {
    return <StorefrontRoute>
        <ProductDetails />
      </StorefrontRoute>;
  }
  return <Redirect to="/" replace />;
};
function App() {
  return <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <RouteView />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>;
}
export default App;
