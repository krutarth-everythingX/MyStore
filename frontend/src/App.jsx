import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

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

// Seller Dashboard Pages
import SellerOverview from './pages/SellerOverview';
import SellerProducts from './pages/SellerProducts';
import SellerInventory from './pages/SellerInventory';
import SellerOrders from './pages/SellerOrders';
import SellerProfile from './pages/SellerProfile';

// Global Styles
import './styles/design-system.css';

// Route Guards
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'seller' ? '/seller' : '/'} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
        <Router>
          <Routes>
            {/* Public Storefront Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/categories" element={<AllCategories />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated Buyer Routes */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRole="buyer">
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRole="buyer">
                  <BuyerOrders />
                </ProtectedRoute>
              }
            />

            {/* Common Profile Page */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Authenticated Seller Dashboard Routes */}
            <Route
              path="/seller"
              element={
                <ProtectedRoute allowedRole="seller">
                  <SellerOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products"
              element={
                <ProtectedRoute allowedRole="seller">
                  <SellerProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/inventory"
              element={
                <ProtectedRoute allowedRole="seller">
                  <SellerInventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/orders"
              element={
                <ProtectedRoute allowedRole="seller">
                  <SellerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/profile"
              element={
                <ProtectedRoute allowedRole="seller">
                  <SellerProfile />
                </ProtectedRoute>
              }
            />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
