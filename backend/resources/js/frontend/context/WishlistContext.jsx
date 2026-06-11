import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { router, usePage } from '@inertiajs/react';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const { props } = usePage();
  const { showToast } = useToast();
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
      if (!user) {
        showToast('Please login to add items to wishlist.', 'warning');
        return;
      }
      const productId = product.id;
      const wishlisted = isWishlisted(productId);

      setLoadingIds((prev) => [...prev, productId]);
      await new Promise((resolve) => {
        router.post(`/wishlist/${productId}`, {}, {
          preserveScroll: true,
          preserveState: true,
          only: ['wishlist'],
          onSuccess: (page) => {
            const nextWishlist = page.props.wishlist || [];
            setWishlist(nextWishlist);
            if (wishlisted) {
              showToast(`Removed ${product.name} from wishlist.`, 'info');
            } else {
              showToast(`Added ${product.name} to wishlist.`, 'success');
            }
          },
          onFinish: () => {
            setLoadingIds((prev) => prev.filter((id) => id !== productId));
            resolve();
          },
        });
      });
    },
    [user, isWishlisted, showToast]
  );

  return (
    <WishlistContext.Provider value={{ wishlist, isWishlisted, toggleWishlist, loadingIds }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
