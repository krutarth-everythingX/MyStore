import React, { useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';

// Pages
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import BuyerOrders from './pages/BuyerOrders';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import AllCategories from './pages/AllCategories';
import CategoryCatalog from './pages/CategoryCatalog';
import WeekMostWanted from './pages/WeekMostWanted';
import Notifications from './pages/Notifications';

// Seller Dashboard Pages
import SellerOverview from './pages/SellerOverview';
import SellerProducts from './pages/SellerProducts';
import SellerCategories from './pages/SellerCategories';
import SellerInventory from './pages/SellerInventory';
import SellerOrders from './pages/SellerOrders';
import SellerProfile from './pages/SellerProfile';
import SellerSetup from './pages/SellerSetup';

// Global Styles
import './styles/design-system.css';
import './styles/seller-workspace.css';

const normalizePath = (path) => {
  if (!path) {
    return '/';
  }

  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
};

const getPathname = (url) => normalizePath(new URL(url, window.location.origin).pathname);

const Redirect = ({ to, replace = false }) => {
  useEffect(() => {
    router.visit(to, {
      replace,
      preserveScroll: true,
    });
  }, [replace, to]);

  return null;
};

const LoadingScreen = () => (
  <div className="flex-center" style={{ height: '100vh' }}>
    Loading...
  </div>
);

const sellerSetupComplete = (user) => Boolean(
  user?.brand_name
    && user?.gst_number
    && user?.address
    && user?.country
    && user?.default_fulfillment_channel,
);

const sellerHomePath = (user) => (sellerSetupComplete(user) ? '/seller' : '/seller/setup');

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Redirect to={user.role === 'seller' ? sellerHomePath(user) : '/'} replace />;
  }

  if (user.role === 'seller' && !sellerSetupComplete(user) && window.location.pathname !== '/seller/setup') {
    return <Redirect to="/seller/setup" replace />;
  }

  return children;
};

const StorefrontRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user?.role === 'seller') {
    return <Redirect to={sellerHomePath(user)} replace />;
  }

  return children;
};

const RouteView = () => {
  const { url } = usePage();
  const pathname = getPathname(url || window.location.href);

  if (pathname === '/') {
    return (
      <StorefrontRoute>
        <Home />
      </StorefrontRoute>
    );
  }

  if (pathname === '/cart') {
    return (
      <StorefrontRoute>
        <Cart />
      </StorefrontRoute>
    );
  }

  if (pathname === '/categories') {
    return (
      <StorefrontRoute>
        <AllCategories />
      </StorefrontRoute>
    );
  }

  if (pathname.startsWith('/categories/')) {
    return (
      <StorefrontRoute>
        <CategoryCatalog />
      </StorefrontRoute>
    );
  }

  if (pathname === '/week-most-wanted') {
    return (
      <StorefrontRoute>
        <WeekMostWanted />
      </StorefrontRoute>
    );
  }

  if (pathname === '/login') {
    return <Login />;
  }

  if (pathname === '/register') {
    return <Register />;
  }

  if (pathname === '/checkout') {
    return (
      <ProtectedRoute allowedRole="buyer">
        <Checkout />
      </ProtectedRoute>
    );
  }

  if (pathname === '/orders') {
    return (
      <ProtectedRoute allowedRole="buyer">
        <BuyerOrders />
      </ProtectedRoute>
    );
  }

  if (pathname === '/profile') {
    return (
      <ProtectedRoute allowedRole="buyer">
        <Profile />
      </ProtectedRoute>
    );
  }

  if (pathname === '/notifications') {
    return (
      <ProtectedRoute allowedRole="buyer">
        <Notifications />
      </ProtectedRoute>
    );
  }

  if (pathname === '/seller') {
    return (
      <ProtectedRoute allowedRole="seller">
        <SellerOverview />
      </ProtectedRoute>
    );
  }

  if (pathname === '/seller/setup') {
    return (
      <ProtectedRoute allowedRole="seller">
        <SellerSetup />
      </ProtectedRoute>
    );
  }

  if (pathname === '/seller/products') {
    return (
      <ProtectedRoute allowedRole="seller">
        <SellerProducts />
      </ProtectedRoute>
    );
  }

  if (pathname === '/seller/categories') {
    return (
      <ProtectedRoute allowedRole="seller">
        <SellerCategories />
      </ProtectedRoute>
    );
  }

  if (pathname === '/seller/products/preview-draft' || /^\/seller\/products\/\d+\/preview$/.test(pathname)) {
    return (
      <ProtectedRoute allowedRole="seller">
        <ProductDetails />
      </ProtectedRoute>
    );
  }

  if (pathname === '/seller/inventory') {
    return (
      <ProtectedRoute allowedRole="seller">
        <SellerInventory />
      </ProtectedRoute>
    );
  }

  if (pathname === '/seller/orders') {
    return (
      <ProtectedRoute allowedRole="seller">
        <SellerOrders />
      </ProtectedRoute>
    );
  }

  if (pathname === '/seller/profile') {
    return (
      <ProtectedRoute allowedRole="seller">
        <SellerProfile />
      </ProtectedRoute>
    );
  }

  if (pathname.startsWith('/products/')) {
    return (
      <StorefrontRoute>
        <ProductDetails />
      </StorefrontRoute>
    );
  }

  return <Redirect to="/" replace />;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <RouteView />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
