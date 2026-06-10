import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { router, usePage } from '@inertiajs/react';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const { props } = usePage();
  const [wishlist, setWishlist] = useState(props.wishlist || []);
  const [loadingIds, setLoadingIds] = useState([]); // product ids currently toggling

  useEffect(() => {
    setWishlist(props.wishlist || []);
  }, [props.wishlist]);

  const isWishlisted = useCallback(
    (productId) => wishlist.some((item) => item.product_id === productId || item.product_id === Number(productId)),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      if (!user) return;
      const productId = product.id;

      setLoadingIds((prev) => [...prev, productId]);
      await new Promise((resolve) => {
        router.post(`/wishlist/${productId}`, {}, {
          preserveScroll: true,
          preserveState: true,
          only: ['wishlist'],
          onSuccess: (page) => {
            const nextWishlist = page.props.wishlist || [];
            setWishlist(nextWishlist);
          },
          onFinish: () => {
            setLoadingIds((prev) => prev.filter((id) => id !== productId));
            resolve();
          },
        });
      });
    },
    [user]
  );

  return (
    <WishlistContext.Provider value={{ wishlist, isWishlisted, toggleWishlist, loadingIds }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
