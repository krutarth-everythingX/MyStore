import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Minus, Plus, ShoppingBag, Tag, Trash2, AlertCircle } from 'lucide-react';
import { convertMoney, formatMoney, formatProductMoney, getUserLocalization } from '../utils/localization';

const productSourceCurrency = (product, localization, props) => (
  product?.price_currency
  || getUserLocalization(props, product?.user?.country).currency
  || localization.currency
);

export const Cart = () => {
  const { props } = usePage();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    cartTotal,
    clearCart,
    coupon,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { user } = useAuth();

  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [loadingPromo, setLoadingPromo] = useState(false);

  const localization = getUserLocalization(props);

  const convertedCartTotal = cart.reduce((total, item) => {
    const price = item.product.sale_price ?? item.product.regular_price;
    const converted = convertMoney(price, productSourceCurrency(item.product, localization, props), localization.currency, props);
    return total + converted * item.quantity;
  }, 0);

  const convertedDiscountAmount = coupon
    ? coupon.type === 'percent'
      ? convertedCartTotal * (parseFloat(coupon.value) / 100)
      : convertMoney(parseFloat(coupon.value), localization.currency, localization.currency, props)
    : 0;

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

  const handleApplyPromo = async (event) => {
    event.preventDefault();
    setPromoError('');

    if (!user) {
      setPromoError('Please log in to apply promo codes.');
      return;
    }

    setLoadingPromo(true);
    router.post(
      '/coupons/validate',
      {
        code: promoCode,
        subtotal: cartTotal,
      },
      {
        preserveScroll: true,
        preserveState: true,
        only: ['flash'],
        onFinish: () => setLoadingPromo(false),
      },
    );
  };

  const handleCheckoutClick = () => {
    if (!user) {
      router.visit('/login?redirect=checkout');
      return;
    }

    router.visit('/checkout');
  };

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-950">
      <Navbar opaque />

      <main>
        <section className="border-b-2 border-neutral-950">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="border-2 border-neutral-950 bg-white p-6 shadow-[10px_10px_0_#171717] sm:p-8">
              <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                <Link href="/" className="transition hover:text-neutral-950">Home</Link>
                <span>/</span>
                <span className="text-neutral-950">Shopping Cart</span>
              </nav>

              <div className="mt-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Cart</span>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Shopping Cart</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600 sm:text-base">
                  Review your products, update quantities, and continue to checkout when everything looks right.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {cart.length === 0 ? (
            <div className="border-2 border-neutral-950 bg-white p-8 shadow-[8px_8px_0_#171717] sm:p-12">
              <div className="mx-auto max-w-xl text-center">
                <div className="mx-auto inline-flex h-16 w-16 items-center justify-center border-2 border-neutral-950 bg-neutral-100">
                  <ShoppingBag size={28} />
                </div>
                <h2 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-950">Your cart is empty</h2>
                <p className="mt-3 text-sm leading-7 text-neutral-600 sm:text-base">
                  Looks like you have not added anything yet. Start browsing and add products you want to buy.
                </p>
                <Link href="/categories" className="mt-6 inline-flex border-2 border-neutral-950 bg-neutral-950 px-5 py-3 text-sm font-medium text-white">
                  Browse Categories
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
              <section className="space-y-6">
                <div className="border-2 border-neutral-950 bg-white p-4 shadow-[8px_8px_0_#171717] sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Selected products</span>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
                        {cart.length} line item{cart.length === 1 ? '' : 's'}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link href="/categories" className="inline-flex items-center gap-2 border-2 border-neutral-950 bg-white px-4 py-3 text-sm font-medium text-neutral-950">
                        <ArrowLeft size={14} />
                        Continue Browsing
                      </Link>
                      <button type="button" onClick={clearCart} className="inline-flex items-center gap-2 border-2 border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-medium text-white">
                        <Trash2 size={14} />
                        Clear Cart
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {cart.map((item) => {
                    const product = item.product;
                    const price = product.sale_price ?? product.regular_price;

                    return (
                      <article key={product.id} className="border-2 border-neutral-950 bg-white p-4 shadow-[8px_8px_0_#171717] sm:p-5">
                        <div className="grid gap-4 sm:grid-cols-[6.5rem_minmax(0,1fr)] lg:grid-cols-[6.5rem_minmax(0,1fr)_10rem] lg:items-center">
                          <Link href={`/products/${product.id}`} className="block border-2 border-neutral-950 bg-neutral-100">
                            <div className="aspect-square">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-3xl font-semibold uppercase text-neutral-300">
                                  {product.name.charAt(0)}
                                </div>
                              )}
                            </div>
                          </Link>

                          <div className="min-w-0">
                            <div className="flex flex-col gap-3">
                              <div className="min-w-0">
                                <Link href={`/products/${product.id}`} className="line-clamp-2 text-lg font-semibold leading-6 text-neutral-950 transition hover:text-neutral-700 sm:text-xl">
                                  {product.name}
                                </Link>
                                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                                  {product.user?.brand_name || product.user?.name}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-neutral-700">
                                  <span>{formatProductMoney(product, parseFloat(price), props)} each</span>
                                  <span className="text-neutral-300">/</span>
                                  <span className="font-semibold text-neutral-950">{formatProductMoney(product, parseFloat(price * item.quantity), props)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              <div className="inline-flex items-center border-2 border-neutral-950 bg-white">
                                <button type="button" onClick={() => updateQuantity(product.id, item.quantity - 1)} className="inline-flex h-10 w-10 items-center justify-center border-r-2 border-neutral-950 text-neutral-950">
                                  <Minus size={14} />
                                </button>
                                <span className="inline-flex h-10 min-w-12 items-center justify-center px-3 text-sm font-medium text-neutral-950">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(product.id, item.quantity + 1)}
                                  disabled={product.manage_stock && item.quantity >= product.stock_quantity}
                                  className="inline-flex h-10 w-10 items-center justify-center border-l-2 border-neutral-950 text-neutral-950 disabled:cursor-not-allowed disabled:text-neutral-300"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>

                              {product.manage_stock && (
                                <span className="text-xs font-medium text-neutral-500">
                                  {product.stock_quantity} available
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="hidden lg:flex lg:h-full lg:flex-col lg:items-end lg:justify-between">
                            <button
                              type="button"
                              onClick={() => removeFromCart(product.id)}
                              className="inline-flex h-10 w-10 items-center justify-center border-2 border-neutral-950 bg-white text-neutral-950"
                            >
                              <Trash2 size={16} />
                            </button>

                            <div className="min-w-[9rem] border-2 border-neutral-950 bg-neutral-950 px-4 py-3 text-right text-sm font-medium text-white">
                              {formatProductMoney(product, parseFloat(price * item.quantity), props)}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <aside className="h-fit space-y-4 lg:sticky lg:top-24">
                <div className="border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717]">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Order summary</span>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Checkout overview</h2>

                  <div className="mt-5 space-y-3 border-t-2 border-neutral-950 pt-5">
                    <div className="flex items-center justify-between text-sm text-neutral-700">
                      <span>Subtotal</span>
                      <span className="font-medium text-neutral-950">
                        {formatMoney(convertedCartTotal, { currency: localization.currency, locale: localization.locale }, props)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-neutral-700">
                      <span>Shipping</span>
                      <span className="font-medium text-neutral-950">Calculated at checkout</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-neutral-700">
                      <span>Tax</span>
                      <span className="font-medium text-neutral-950">Calculated at checkout</span>
                    </div>

                    {coupon && (
                      <div className="flex items-center justify-between text-sm text-neutral-700">
                        <span>Discount ({coupon.code})</span>
                        <span className="font-medium text-neutral-950">
                          -{formatMoney(convertedDiscountAmount, { currency: localization.currency, locale: localization.locale }, props)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t-2 border-neutral-950 pt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Estimated total</span>
                      <span className="text-2xl font-semibold tracking-tight text-neutral-950">
                        {formatMoney(convertedCartTotal - convertedDiscountAmount, { currency: localization.currency, locale: localization.locale }, props)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t-2 border-neutral-950 pt-5">
                    {coupon ? (
                      <div className="border-2 border-neutral-950 bg-neutral-100 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-950">
                          <Tag size={14} />
                          <span>{coupon.code} applied</span>
                        </div>
                        <button type="button" onClick={removeCoupon} className="mt-3 text-sm font-medium text-neutral-700 underline-offset-4 hover:underline">
                          Remove coupon
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyPromo} className="space-y-3">
                        <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                          Promo code
                        </label>
                        <div className="flex items-center border-2 border-neutral-950 bg-white">
                          <input
                            type="text"
                            placeholder="SAVE10"
                            value={promoCode}
                            onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                            className="h-11 min-w-0 flex-1 bg-transparent px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
                          />
                          <button
                            type="submit"
                            disabled={loadingPromo || !promoCode}
                            className="inline-flex h-11 items-center justify-center border-l-2 border-neutral-950 bg-neutral-950 px-4 text-sm font-medium text-white disabled:bg-neutral-300"
                          >
                            {loadingPromo ? 'Applying...' : 'Apply'}
                          </button>
                        </div>
                      </form>
                    )}

                    {promoError && (
                      <div className="mt-3 flex items-start gap-2 border-2 border-neutral-950 bg-[#fff1f2] p-3 text-sm text-neutral-900">
                        <AlertCircle size={15} className="mt-0.5 shrink-0" />
                        <span>{promoError}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckoutClick}
                    className="mt-5 inline-flex w-full items-center justify-center border-2 border-neutral-950 bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
                  >
                    Proceed to Secure Checkout
                  </button>
                </div>
              </aside>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
