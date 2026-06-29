import React, { createContext, useState, useEffect, useContext } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { showToast } = useToast();
  const [cart, setCart] = useState(() => {
    const localData = localStorage.getItem('mystore_cart');
    return localData ? JSON.parse(localData) : [];
  });
  const getSellerId = (product) => product?.user_id || product?.user?.id || null;

  useEffect(() => {
    localStorage.setItem('mystore_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const incomingSellerId = getSellerId(product);
      const existingSellerIds = Array.from(new Set(prevCart.map(item => getSellerId(item.product)).filter(Boolean)));

      if (
        incomingSellerId
        && existingSellerIds.length > 0
        && !existingSellerIds.includes(incomingSellerId)
      ) {
        showToast('Checkout currently supports items from one seller at a time. Clear the cart to add this product.', 'info');
        return prevCart;
      }

      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });
    showToast(`Added ${product.name} to cart.`, 'success');
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const item = prevCart.find(i => i.product.id === productId);
      if (item) {
        showToast(`Removed ${item.product.name} from cart.`, 'info');
      }
      return prevCart.filter(i => i.product.id !== productId);
    });
  };

  const [coupon, setCoupon] = useState(null);

  const applyCoupon = (couponData) => {
    setCoupon(couponData);
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  const clearCart = () => {
    setCart([]);
    setCoupon(null);
  };

  const cartTotal = cart.reduce((total, item) => {
    const price = item.product.sale_price ?? item.product.regular_price;
    return total + price * item.quantity;
  }, 0);

  const discountAmount = coupon 
    ? (coupon.type === 'percent' 
        ? (cartTotal * (parseFloat(coupon.value) / 100)) 
        : Math.min(cartTotal, parseFloat(coupon.value)))
    : 0;

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, updateQuantity, removeFromCart, clearCart, 
      cartTotal, cartCount, coupon, applyCoupon, removeCoupon, discountAmount 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
