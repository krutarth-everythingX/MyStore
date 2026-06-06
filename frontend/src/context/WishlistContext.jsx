import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

const API_BASE = 'http://127.0.0.1:8000/api';

export const WishlistProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [wishlist, setWishlist] = useState([]); // array of wishlist items [{id, product_id, product: {...}}]
  const [loadingIds, setLoadingIds] = useState([]); // product ids currently toggling

  // Load wishlist from API when token is available
  useEffect(() => {
    if (token && user?.role === 'buyer') {
      fetch(`${API_BASE}/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })
        .then((res) => res.ok ? res.json() : [])
        .then((data) => setWishlist(Array.isArray(data) ? data : []))
        .catch(() => setWishlist([]));
    } else {
      setWishlist([]);
    }
  }, [token, user]);

  const isWishlisted = useCallback(
    (productId) => wishlist.some((item) => item.product_id === productId || item.product_id === Number(productId)),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      if (!token) return;
      const productId = product.id;

      setLoadingIds((prev) => [...prev, productId]);
      try {
        const res = await fetch(`${API_BASE}/wishlist/${productId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        const data = await res.json();
        if (data.wishlisted) {
          // Added: push a pseudo item
          setWishlist((prev) => [
            { id: Date.now(), product_id: productId, product, created_at: new Date().toISOString() },
            ...prev,
          ]);
        } else {
          // Removed
          setWishlist((prev) => prev.filter((item) => item.product_id !== productId && item.product_id !== Number(productId)));
        }
      } catch (e) {
        console.error('Wishlist toggle error', e);
      } finally {
        setLoadingIds((prev) => prev.filter((id) => id !== productId));
      }
    },
    [token]
  );

  return (
    <WishlistContext.Provider value={{ wishlist, isWishlisted, toggleWishlist, loadingIds }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
