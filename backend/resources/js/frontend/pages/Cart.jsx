import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Trash2, ShoppingBag, Tag, AlertCircle } from 'lucide-react';

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
    if (!user) { setPromoError('Please log in to apply promo codes.'); return; }
    setLoadingPromo(true);
    router.post('/coupons/validate', { code: promoCode, subtotal: cartTotal }, {
      preserveScroll: true,
      preserveState: true,
      only: ['flash'],
      onFinish: () => setLoadingPromo(false),
    });
  };

  const handleCheckoutClick = () => {
    if (!user) router.visit('/login?redirect=checkout');
    else router.visit('/checkout');
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1 min-h-[100dvh]">
        {/* Breadcrumb */}
        <nav className="hidden items-center gap-2 mb-6 text-[11px] font-bold uppercase tracking-wider text-neutral-400 sm:flex">
          <Link href="/" className="hover:text-neutral-800 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-neutral-800">Shopping Cart</span>
        </nav>

        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-900 mb-8">Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-96 bg-white rounded-3xl border border-neutral-100 shadow-xs gap-5 text-center px-6 py-16">
            <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center">
              <ShoppingBag size={28} className="text-neutral-400" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-neutral-900">Your cart is empty</h3>
            <p className="text-sm text-neutral-500">Looks like you haven't added anything to your cart yet.</p>
            <Link href="/categories" className="px-6 py-2.5 bg-neutral-950 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-neutral-900 transition-colors mt-2">
              Browse Categories
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
            {/* Cart Items */}
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-xs overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100">
                <h2 className="font-semibold text-base text-neutral-900">Selected Products <span className="text-neutral-400 font-normal text-sm">({cart.length} items)</span></h2>
              </div>
              <div className="divide-y divide-neutral-100">
                {cart.map((item) => {
                  const product = item.product;
                  const price = product.sale_price ?? product.regular_price;
                  return (
                    <div key={product.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 sm:px-6 py-5 hover:bg-neutral-50 transition-colors">
                      {/* Image */}
                      <div className="h-24 w-24 sm:h-20 sm:w-20 flex-shrink-0 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center font-serif italic text-2xl text-neutral-400 self-center sm:self-auto">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover rounded-2xl" />
                        ) : product.name.charAt(0)}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${product.id}`} className="font-serif text-base font-semibold text-neutral-900 hover:text-neutral-600 transition-colors line-clamp-1">
                          {product.name}
                        </Link>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mt-0.5">
                          Seller: {product.user?.brand_name || product.user?.name}
                        </p>

                        {/* Mobile: Price + actions row */}
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          {/* Qty */}
                          <div className="inline-flex items-center border border-neutral-200 rounded-full overflow-hidden bg-white">
                            <button className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 text-base transition-colors" onClick={() => updateQuantity(product.id, item.quantity - 1)}>−</button>
                            <span className="px-3 py-2 text-sm font-semibold text-neutral-900 border-x border-neutral-200 min-w-[2.5rem] text-center">{item.quantity}</span>
                            <button className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 text-base transition-colors disabled:opacity-30" onClick={() => updateQuantity(product.id, item.quantity + 1)} disabled={product.manage_stock && item.quantity >= product.stock_quantity}>+</button>
                          </div>

                          {/* Price on mobile */}
                          <div className="sm:hidden flex flex-col">
                            <span className="text-[11px] text-neutral-400">${parseFloat(price).toFixed(2)} each</span>
                            <span className="font-serif text-lg font-semibold text-neutral-900">${parseFloat(price * item.quantity).toFixed(2)}</span>
                          </div>

                          <button className="ml-auto sm:hidden p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" onClick={() => removeFromCart(product.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Desktop: Price column */}
                      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[11px] text-neutral-400">${parseFloat(price).toFixed(2)} each</span>
                        <span className="font-serif text-xl font-semibold text-neutral-900">${parseFloat(price * item.quantity).toFixed(2)}</span>
                      </div>

                      {/* Desktop: Remove button */}
                      <button className="hidden sm:flex p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" onClick={() => removeFromCart(product.id)}>
                        <Trash2 size={17} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between gap-4 flex-wrap">
                <Link href="/categories" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors">
                  <ArrowLeft size={14} /> Continue Browsing
                </Link>
                <button className="text-[11px] font-bold uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors" onClick={clearCart}>
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-28 bg-white rounded-3xl border border-neutral-100 shadow-xs overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100">
                <h2 className="font-semibold text-base text-neutral-900">Order Summary</h2>
              </div>

              <div className="px-6 py-5 flex flex-col gap-4">
                {/* Rows */}
                {[
                  ['Subtotal', `$${cartTotal.toFixed(2)}`],
                  ['Shipping', 'FREE'],
                  ['Tax', '$0.00'],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between text-sm text-neutral-600">
                    <span>{label}</span>
                    <span className={label === 'Shipping' ? 'text-green-700 font-semibold' : ''}>{val}</span>
                  </div>
                ))}

                {coupon && (
                  <div className="flex items-center justify-between text-sm text-neutral-900 font-medium">
                    <span>Discount ({coupon.code})</span>
                    <span className="text-green-700">−${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="h-px bg-neutral-100 my-1" />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900">Total</span>
                  <span className="font-serif text-2xl font-semibold text-neutral-900">${(cartTotal - discountAmount).toFixed(2)}</span>
                </div>

                <div className="h-px bg-neutral-100 my-1" />

                {/* Coupon */}
                {coupon ? (
                  <div className="flex items-center justify-between bg-neutral-100 px-3 py-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-neutral-700" />
                      <span className="text-xs font-semibold text-neutral-800">{coupon.code} Applied</span>
                    </div>
                    <button className="text-[11px] font-bold text-red-600 hover:underline" onClick={removeCoupon}>Remove</button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Promo Code (SAVE10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 border border-neutral-200 rounded-full py-2.5 px-4 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all uppercase"
                    />
                    <button
                      type="submit"
                      disabled={loadingPromo || !promoCode}
                      className="px-4 py-2.5 bg-neutral-950 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {loadingPromo ? 'Applying...' : 'Apply'}
                    </button>
                  </form>
                )}

                {promoError && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle size={13} /> {promoError}
                  </div>
                )}

                <button
                  className="w-full py-3.5 bg-neutral-950 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-neutral-900 transition-all hover:-translate-y-0.5 shadow-sm mt-2"
                  onClick={handleCheckoutClick}
                >
                  Proceed to Secure Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
