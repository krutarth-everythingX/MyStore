import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { ArrowLeft, Trash2, ShoppingBag, Tag, AlertCircle } from 'lucide-react';
import { Input } from '../components/Input';
import './Cart.css';

export const Cart = () => {
  const { props } = usePage();
  const {
    cart, updateQuantity, removeFromCart, cartTotal, clearCart,
    coupon, applyCoupon, removeCoupon, discountAmount
  } = useCart();
  const { user } = useAuth();

  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [loadingPromo, setLoadingPromo] = useState(false);

  useEffect(() => {
    if (props.flash?.coupon) {
      applyCoupon(props.flash.coupon);
      setPromoCode('');
      setPromoError('');
      setLoadingPromo(false);
    }

    if (props.flash?.error) {
      setPromoError(props.flash.error);
      setLoadingPromo(false);
    }
  }, [applyCoupon, props.flash]);

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    setPromoError('');
    if (!user) {
      setPromoError('Please log in to apply promo codes.');
      return;
    }
    setLoadingPromo(true);

    router.post('/coupons/validate', {
      code: promoCode,
      subtotal: cartTotal
    }, {
      preserveScroll: true,
      preserveState: true,
      only: ['flash'],
      onFinish: () => setLoadingPromo(false),
    });
  };

  const handleCheckoutClick = () => {
    if (!user) {
      router.visit('/login?redirect=checkout');
    } else {
      router.visit('/checkout');
    }
  };

  return (
    <div className="buyer-layout">
      <Navbar />

      <main className="container cart-main animate-fade-in">
        <h1 className="headline-lg cart-page-title">Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="cart-empty flex-center card">
            <ShoppingBag size={48} className="cart-empty-icon" />
            <h3 className="title-lg">Your cart is empty</h3>
            <p className="body-md" style={{ color: 'var(--color-outline)', marginTop: 8 }}>
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link href="/">
              <Button variant="primary" style={{ marginTop: 16 }}>
                Go to Shop
              </Button>
            </Link>
          </div>
        ) : (
          <div className="cart-grid-layout">
            {/* Cart Items List */}
            <div className="cart-items-column">
              <Card title={`Selected Products (${cart.length} items)`} className="cart-items-card">
                <div className="cart-items-list">
                  {cart.map((item) => {
                    const product = item.product;
                    const price = product.sale_price ?? product.regular_price;

                    return (
                      <div key={product.id} className="cart-item-row">
                        <div className="cart-item-image-placeholder flex-center">
                          <span className="cart-item-image-letter title-lg">{product.name.charAt(0)}</span>
                        </div>

                        <div className="cart-item-details">
                          <h4 className="body-lg cart-item-title">
                            <Link href={`/products/${product.id}`}>{product.name}</Link>
                          </h4>
                          <span className="cart-item-seller label-md">
                            Seller: {product.user?.brand_name || product.user?.name}
                          </span>
                        </div>

                        <div className="cart-item-qty-cell">
                          <div className="qty-selector">
                            <button
                              className="qty-btn"
                              onClick={() => updateQuantity(product.id, item.quantity - 1)}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              className="qty-input"
                              value={item.quantity}
                              readOnly
                            />
                            <button
                              className="qty-btn"
                              onClick={() => updateQuantity(product.id, item.quantity + 1)}
                              disabled={product.manage_stock && item.quantity >= product.stock_quantity}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="cart-item-price-cell">
                          <span className="cart-item-price-unit body-md">${parseFloat(price).toFixed(2)} each</span>
                          <span className="cart-item-price-total body-lg">${parseFloat(price * item.quantity).toFixed(2)}</span>
                        </div>

                        <button className="cart-item-remove-btn" onClick={() => removeFromCart(product.id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="cart-actions-row">
                  <Link href="/" className="cart-continue-link body-md">
                    <ArrowLeft size={16} style={{ marginRight: 6 }} />
                    Continue Shopping
                  </Link>
                  <Button variant="ghost" className="cart-clear-btn" onClick={clearCart}>
                    Clear Cart
                  </Button>
                </div>
              </Card>
            </div>

            {/* Cart Summary Card */}
            <div className="cart-summary-column">
              <Card title="Order Summary" className="cart-summary-card">
                <div className="summary-row body-md">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                {coupon && (
                  <div className="summary-row body-md" style={{ color: 'var(--color-primary)' }}>
                    <span>Discount ({coupon.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row body-md">
                  <span>Shipping</span>
                  <span style={{ color: '#2e7d32', fontWeight: 600 }}>FREE</span>
                </div>
                <div className="summary-row body-md">
                  <span>Tax</span>
                  <span>$0.00</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total-row title-lg">
                  <span>Total</span>
                  <span className="total-amount">${(cartTotal - discountAmount).toFixed(2)}</span>
                </div>

                <div className="summary-divider"></div>
                {coupon ? (
                  <div className="applied-coupon-container flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface-container-high)', padding: '8px 12px', borderRadius: '6px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tag size={16} style={{ color: 'var(--color-primary)' }} />
                      <span className="body-md" style={{ fontWeight: 600 }}>{coupon.code} Applied</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={removeCoupon} style={{ padding: '2px 8px !important' }}>Remove</Button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <input
                      type="text"
                      placeholder="Promo Code (SAVE10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid var(--color-outline-variant)',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        color: 'var(--color-on-surface)',
                        textTransform: 'uppercase'
                      }}
                    />
                    <Button type="submit" variant="outline" size="sm" disabled={loadingPromo || !promoCode}>
                      {loadingPromo ? 'Applying...' : 'Apply'}
                    </Button>
                  </form>
                )}
                {promoError && (
                  <div className="body-sm" style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                    <AlertCircle size={14} />
                    {promoError}
                  </div>
                )}

                <Button variant="primary" className="cart-checkout-btn" onClick={handleCheckoutClick}>
                  Proceed to Secure Checkout
                </Button>


              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
export default Cart;
