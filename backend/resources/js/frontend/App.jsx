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
import Notifications from './pages/Notifications';

// Seller Dashboard Pages
import SellerOverview from './pages/SellerOverview';
import SellerProducts from './pages/SellerProducts';
import SellerInventory from './pages/SellerInventory';
import SellerOrders from './pages/SellerOrders';
import SellerProfile from './pages/SellerProfile';

// Global Styles
import './styles/design-system.css';

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

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Redirect to={user.role === 'seller' ? '/seller' : '/'} replace />;
  }

  return children;
};

const RouteView = () => {
  const { url } = usePage();
  const pathname = getPathname(url || window.location.href);

  if (pathname === '/') {
    return <Home />;
  }

  if (pathname === '/cart') {
    return <Cart />;
  }

  if (pathname === '/categories') {
    return <AllCategories />;
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
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    );
  }

  if (pathname === '/notifications') {
    return (
      <ProtectedRoute>
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

  if (pathname === '/seller/products') {
    return (
      <ProtectedRoute allowedRole="seller">
        <SellerProducts />
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
    return <ProductDetails />;
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
