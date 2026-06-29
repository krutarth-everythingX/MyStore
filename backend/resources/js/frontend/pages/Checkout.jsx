import React, { useState, useEffect, useRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ShieldCheck, AlertCircle, Truck, CreditCard, Wallet, Smartphone, DollarSign, CheckCircle2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { convertMoney, formatMoney, formatProductMoney, getCountriesMap, getUserLocalization } from '../utils/localization';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#171717',
      fontFamily: 'system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '15px',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626',
    },
  },
};

const inputCls = 'h-11 w-full border-2 border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-950';
const textareaCls = 'w-full border-2 border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-950';
const selectCls = 'h-11 w-full border-2 border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-950';

const PAYMENT_METHODS = [
  { id: 'Credit Card', label: 'Credit Card', icon: CreditCard, enabled: true, helper: 'Pay online with Stripe-secured card payment.' },
  { id: 'Google Pay', label: 'Google Pay', icon: Smartphone, enabled: false, helper: 'Wallet flow is not integrated in this checkout yet.' },
  { id: 'PayPal', label: 'PayPal', icon: DollarSign, enabled: false, helper: 'PayPal redirect is not integrated in this checkout yet.' },
  { id: 'Paytm', label: 'Paytm', icon: Wallet, enabled: false, helper: 'Paytm gateway is not integrated in this checkout yet.' },
  { id: 'COD', label: 'Cash on Delivery', icon: Truck, enabled: true, helper: 'Pay when your order arrives.' },
];

const collectAllowedChannels = (cartItems) => Array.from(new Set(
  cartItems
    .map((item) => item.product?.fulfillment_channel)
    .filter(Boolean)
));
const collectSellerIds = (cartItems) => Array.from(new Set(
  cartItems
    .map((item) => item.product?.user_id || item.product?.user?.id)
    .filter(Boolean)
));

const productSourceCurrency = (product, props, fallbackCountry) => (
  product?.price_currency
  || getUserLocalization(props, product?.user?.country || fallbackCountry).currency
  || getUserLocalization(props, fallbackCountry).currency
);

const Field = ({ label, children, hint }) => (
  <label className="block space-y-2">
    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</span>
    {children}
    {hint ? <span className="block text-xs text-neutral-500">{hint}</span> : null}
  </label>
);

const SectionCard = ({ title, description, children }) => (
  <section className="border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717] sm:p-6">
    <div className="mb-5 border-b-2 border-neutral-950 pb-4">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{title}</span>
      {description ? <p className="mt-2 text-sm leading-7 text-neutral-600">{description}</p> : null}
    </div>
    <div className="space-y-5">{children}</div>
  </section>
);

const CheckoutForm = ({ stripe, elements }) => {
  const { cart, clearCart, coupon, discountAmount } = useCart();
  const { props } = usePage();
  const { user } = useAuth();
  const countries = getCountriesMap(props);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingCountry, setBillingCountry] = useState('India');
  const [billingPincode, setBillingPincode] = useState('');
  const [useDifferentBilling, setUseDifferentBilling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [rates, setRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [pincodeServiceable, setPincodeServiceable] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addressRef = useRef(null);
  const checkoutLocalization = getUserLocalization(props, country);
  const allowedChannels = collectAllowedChannels(cart);
  const sellerIds = collectSellerIds(cart);
  const hasMixedSellers = sellerIds.length > 1;
  const normalizedPostalCode = String(pincode || '').trim();
  const canCheckShipping = Boolean(
    !hasMixedSellers
    && address
    && city
    && stateName
    && country
    && normalizedPostalCode.length >= (country === 'India' ? 6 : 3)
  );

  useEffect(() => {
    const sharedRates = props.flash?.shippingRates;
    if (Array.isArray(sharedRates)) {
      setRates(sharedRates);
      setSelectedRate(sharedRates[0] || null);
      setPincodeServiceable(sharedRates.length > 0 ? 'yes' : 'no');
      setFetchingRates(false);
    }

    if (props.flash?.checkout) {
      const result = props.flash.checkout;

      const finishCheckout = async () => {
        try {
          if (
            paymentMethod === 'Credit Card'
            && result.requires_payment_confirmation
            && stripePromise
            && stripe
            && elements
            && result.client_secret
            && !result.client_secret.startsWith('pi_mock_')
          ) {
            const cardElement = elements.getElement(CardElement);
            const paymentResult = await stripe.confirmCardPayment(result.client_secret, {
              payment_method: {
                card: cardElement,
                billing_details: {
                  name: user ? user.name : 'Store Customer',
                  address: {
                    line1: useDifferentBilling ? billingStreet : address,
                  },
                },
              },
            });

            if (paymentResult.error) {
              throw new Error(paymentResult.error.message || 'Payment card confirmation failed.');
            }
          }

          clearCart();
          router.visit(result.order?.id ? `/orders/${result.order.id}?success=true` : '/orders?success=true');
        } catch (err) {
          setError(err.message || 'Checkout failed');
        } finally {
          setLoading(false);
        }
      };

      finishCheckout();
    } else if (props.flash?.error) {
      setError(props.flash.error);
      setLoading(false);
      setFetchingRates(false);
    }
  }, [address, billingStreet, clearCart, elements, paymentMethod, props.flash, stripe, user, useDifferentBilling]);

  useEffect(() => {
    if (cart.length === 0) router.visit('/cart');
  }, [cart]);

  useEffect(() => {
    if (hasMixedSellers) {
      setError('Checkout currently supports items from one seller at a time. Remove products from other sellers to continue.');
      setRates([]);
      setSelectedRate(null);
      setPincodeServiceable(null);
    }
  }, [hasMixedSellers]);

  useEffect(() => {
    if (user) {
      const names = user.name ? user.name.split(' ') : ['', ''];
      setFirstName(names[0] || '');
      setLastName(names.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setStateName(user.state || '');
      setCountry(user.country || 'India');
      setPincode(user.pincode || '');
    }
  }, [user?.id]);

  useEffect(() => {
    if (canCheckShipping) {
      checkServiceability();
    } else {
      setPincodeServiceable(null);
      setRates([]);
      setSelectedRate(null);
    }
  }, [canCheckShipping, normalizedPostalCode, address, city, stateName, country]);

  useEffect(() => {
    const googleApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!googleApiKey) return;

    const scriptId = 'google-maps-places-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.google.com/maps/api/js?key=${googleApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
    } else {
      initAutocomplete();
    }

    function initAutocomplete() {
      if (!addressRef.current) return;

      try {
        const ac = new window.google.maps.places.Autocomplete(addressRef.current, { types: ['address'] });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (place?.formatted_address) setAddress(place.formatted_address);
        });
      } catch (e) {
        // ignore autocomplete init issues
      }
    }
  }, []);

  const checkServiceability = async () => {
    setFetchingRates(true);
    setPincodeServiceable('checking');
    setError('');

    router.post('/shipping/rates', {
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      shipping_address: `${address}, ${city}, ${stateName}, ${country} - ${pincode}`,
      country,
      postal_code: normalizedPostalCode,
      allowed_channels: allowedChannels,
    }, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
      only: ['flash'],
      onError: () => {
        setPincodeServiceable('no');
        setRates([]);
        setSelectedRate(null);
        setFetchingRates(false);
      },
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (!address) {
      setError('Please provide a shipping address.');
      setLoading(false);
      return;
    }

    if (hasMixedSellers) {
      setError('Checkout currently supports items from one seller at a time.');
      setLoading(false);
      return;
    }

    if (rates.length > 0 && !selectedRate) {
      setError('Shipping channel unavailable for this destination.');
      setLoading(false);
      return;
    }

    const fullAddr = `${address}, ${city}, ${stateName}, ${country} - ${pincode}`;
    const fullBillingAddr = useDifferentBilling
      ? `${billingStreet}, ${billingCity}, ${billingState}, ${billingCountry} - ${billingPincode}`
      : fullAddr;

    router.post('/checkout', {
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      shipping_address: fullAddr,
      billing_address: fullBillingAddr,
      buyer_phone: phone,
      country,
      city,
      state: stateName,
      postal_code: pincode,
      company_name: '',
      buyer_gstin: '',
      payment_method: paymentMethod,
      shipping_carrier: selectedRate ? (selectedRate.channel || selectedRate.carrier) : 'Free Shipping',
      shipping_service: selectedRate ? selectedRate.service : 'Standard',
      shipping_cost: selectedRate ? selectedRate.rate : 0.00,
      discount_amount: discountAmount,
    }, {
      preserveScroll: true,
      preserveState: true,
      only: ['flash'],
      onError: (errors) => {
        setError(Object.values(errors)[0] || 'Checkout failed');
        setLoading(false);
      },
    });
  };

  const shippingCost = selectedRate ? Number(selectedRate.rate || 0) : 0.00;
  const convertedCartTotal = cart.reduce((total, item) => {
    const price = item.product.sale_price ?? item.product.regular_price;
    const converted = convertMoney(price, productSourceCurrency(item.product, props, country), checkoutLocalization.currency, props);
    return total + converted * item.quantity;
  }, 0);
  const convertedDiscountAmount = coupon
    ? coupon.type === 'percent'
      ? convertedCartTotal * (parseFloat(coupon.value) / 100)
      : Number(discountAmount || 0)
    : 0;

  const primarySeller = cart[0]?.product?.user || null;
  const sellerCountry = String(primarySeller?.country || '').trim();
  const sellerIsIndian = sellerCountry.toLowerCase() === 'india';
  const sellerState = primarySeller?.state ? primarySeller.state : 'Gujarat';
  const isSameState = stateName ? stateName.toLowerCase().trim() === sellerState.toLowerCase().trim() : true;
  const taxableBase = Math.max(0.00, convertedCartTotal + shippingCost - convertedDiscountAmount);
  const cgst = sellerIsIndian && isSameState ? taxableBase * 0.09 : 0.00;
  const sgst = sellerIsIndian && isSameState ? taxableBase * 0.09 : 0.00;
  const igst = sellerIsIndian && !isSameState ? taxableBase * 0.18 : 0.00;
  const finalTotal = taxableBase + cgst + sgst + igst;

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
                <Link href="/cart" className="transition hover:text-neutral-950">Cart</Link>
                <span>/</span>
                <span className="text-neutral-950">Secure Checkout</span>
              </nav>

              <div className="mt-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Checkout</span>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Secure Checkout</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600 sm:text-base">
                  Confirm delivery, choose a supported payment method, and place your order securely.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 border-2 border-neutral-950 bg-[#fff1f2] p-4 shadow-[6px_6px_0_#171717]">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span className="text-sm text-neutral-900">{error}</span>
              </div>
            )}

            {user && !user.email_verified_at && (
              <div className="flex items-start gap-3 border-2 border-neutral-950 bg-[#fff7ed] p-4 shadow-[6px_6px_0_#171717]">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span className="text-sm text-neutral-900">
                  <strong>Email verification required:</strong> verify your email before placing an order.
                  {' '}
                  <Link href="/profile" className="underline">Verify now</Link>.
                </span>
              </div>
            )}

            {user && (!user.phone || !user.address || !user.city || !user.state || !user.country || !user.pincode) && (
              <div className="flex items-start gap-3 border-2 border-neutral-950 bg-[#eff6ff] p-4 shadow-[6px_6px_0_#171717]">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span className="text-sm text-neutral-900">
                  <strong>Profile incomplete:</strong> complete your
                  {' '}
                  <Link href="/profile?tab=account-settings" className="underline">profile settings</Link>
                  {' '}
                  for better checkout prefill.
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
            <div className="space-y-6">
              <SectionCard title="Shipping Address" description="Tell us where this order should be delivered.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First Name *">
                    <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={inputCls} />
                  </Field>
                  <Field label="Last Name *">
                    <input type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required className={inputCls} />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email Address *">
                    <input type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
                  </Field>
                  <Field label="Phone Number *">
                    <input type="tel" placeholder="Enter phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputCls} />
                  </Field>
                </div>

                <Field label="Street Address / Door No. *" hint="Google address autocomplete works here when configured.">
                  <textarea ref={addressRef} rows={3} placeholder="Street, building number, locality" value={address} onChange={(e) => setAddress(e.target.value)} required className={textareaCls} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="City *">
                    <input type="text" placeholder="E.g. Ahmedabad" value={city} onChange={(e) => setCity(e.target.value)} required className={inputCls} />
                  </Field>
                  <Field label="State / Region *">
                    <input type="text" placeholder="E.g. Gujarat" value={stateName} onChange={(e) => setStateName(e.target.value)} required className={inputCls} />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Country *">
                    <select value={country} onChange={(e) => setCountry(e.target.value)} required className={selectCls}>
                      {Object.entries(countries).map(([code, option]) => (
                        <option key={code} value={option.name}>{option.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="PIN / Postal Code *">
                    <input type="text" placeholder="Enter postal code" maxLength={20} value={pincode} onChange={(e) => setPincode(e.target.value)} required className={inputCls} />
                  </Field>
                </div>

                {pincodeServiceable === 'checking' && (
                  <div className="border-2 border-neutral-950 bg-neutral-100 px-4 py-3 text-sm text-neutral-700">Checking shipping coverage for this destination...</div>
                )}
                {pincodeServiceable === 'yes' && (
                  <div className="flex items-center gap-2 border-2 border-neutral-950 bg-[#ecfdf5] px-4 py-3 text-sm text-neutral-900">
                    <CheckCircle2 size={16} />
                    Delivery available for this location.
                  </div>
                )}
                {pincodeServiceable === 'no' && (
                  <div className="flex items-center gap-2 border-2 border-neutral-950 bg-[#fff1f2] px-4 py-3 text-sm text-neutral-900">
                    <AlertCircle size={16} />
                    Delivery is not available for this location.
                  </div>
                )}

                {rates.length > 0 && (
                  <div className="space-y-3 border-t-2 border-neutral-950 pt-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      <Truck size={14} />
                      Shipping Channel
                    </div>

                    {selectedRate ? (
                      <div className="border-2 border-neutral-950 bg-white p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <strong className="block text-sm text-neutral-950">{selectedRate.channel || selectedRate.carrier}</strong>
                            <span className="mt-1 block text-xs text-neutral-500">{selectedRate.service || 'Standard shipping'}</span>
                            <span className="mt-2 block text-xs text-neutral-500">This shipping channel is selected by the seller. Delivery cost changes by country and destination.</span>
                          </div>
                          <span className="text-sm font-medium text-neutral-950">
                            {formatMoney(selectedRate.rate, { currency: selectedRate.currency || checkoutLocalization.currency, locale: checkoutLocalization.locale }, props)}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Billing Address" description="Use the same address or provide a separate billing destination.">
                <label className="flex items-center gap-3 border-2 border-neutral-950 bg-white px-4 py-3 text-sm text-neutral-900">
                  <input type="checkbox" checked={useDifferentBilling} onChange={(e) => setUseDifferentBilling(e.target.checked)} className="h-4 w-4 accent-neutral-950" />
                  Billing address is different from shipping address
                </label>

                {useDifferentBilling && (
                  <div className="space-y-4">
                    <Field label="Billing Street Address *">
                      <textarea rows={3} placeholder="Enter street name, building" value={billingStreet} onChange={(e) => setBillingStreet(e.target.value)} required={useDifferentBilling} className={textareaCls} />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Billing City *">
                        <input type="text" placeholder="City" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} required={useDifferentBilling} className={inputCls} />
                      </Field>
                      <Field label="Billing State *">
                        <input type="text" placeholder="State" value={billingState} onChange={(e) => setBillingState(e.target.value)} required={useDifferentBilling} className={inputCls} />
                      </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Billing Country *">
                        <select value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)} required={useDifferentBilling} className={selectCls}>
                          {Object.entries(countries).map(([code, option]) => (
                            <option key={code} value={option.name}>{option.name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Billing PIN *">
                        <input type="text" maxLength={20} placeholder="Enter postal code" value={billingPincode} onChange={(e) => setBillingPincode(e.target.value)} required={useDifferentBilling} className={inputCls} />
                      </Field>
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Payment Method" description="Only supported methods are selectable. Card payments are currently the live online checkout path.">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {PAYMENT_METHODS.map(({ id, label, icon: Icon, enabled, helper }) => {
                    const active = paymentMethod === id;
                    return (
                      <label
                        key={id}
                        className={`border-2 p-4 transition ${enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${active ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950 bg-white text-neutral-950'}`}
                      >
                        <input
                          type="radio"
                          name="payment_type"
                          checked={active}
                          onChange={() => enabled && setPaymentMethod(id)}
                          disabled={!enabled}
                          className="sr-only"
                        />
                        <div className="flex items-start gap-3">
                          <Icon size={20} className="mt-0.5 shrink-0" />
                          <div>
                            <span className="block text-sm font-semibold">{label}</span>
                            <span className={`mt-1 block text-xs leading-5 ${active ? 'text-white/75' : 'text-neutral-500'}`}>{helper}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {paymentMethod === 'Credit Card' && (
                  <div className="border-2 border-neutral-950 bg-neutral-100 p-4">
                    {stripePromise ? (
                      <div className="border-2 border-neutral-950 bg-white px-4 py-3">
                        <CardElement options={CARD_ELEMENT_OPTIONS} />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Field label="Card Number">
                          <input type="text" placeholder="4111 2222 3333 4444" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required className={inputCls} />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Expiry">
                            <input type="text" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} required className={inputCls} />
                          </Field>
                          <Field label="CVV">
                            <input type="text" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} required className={inputCls} />
                          </Field>
                        </div>
                        <p className="text-xs text-neutral-500">Stripe sandbox mock active. Card credentials are simulated locally when Stripe is unavailable.</p>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'COD' && (
                  <div className="border-2 border-neutral-950 bg-[#f5f5f5] px-4 py-3 text-sm text-neutral-700">
                    Cash on delivery selected. Your order will be placed without online payment confirmation.
                  </div>
                )}

                <div className="border-2 border-neutral-950 bg-[#fff7ed] p-4 text-sm text-neutral-900">
                  <strong>Payment integration note:</strong> Google Pay, PayPal, and Paytm are not wired to a real gateway in this codebase yet, so they are shown as unavailable instead of pretending to work.
                </div>
              </SectionCard>
            </div>

            <aside className="h-fit space-y-6 xl:sticky xl:top-24">
              <SectionCard title="Order Summary" description="Review your items and totals before placing the order.">
                <div className="space-y-3">
                  {cart.map((item) => {
                    const product = item.product;
                    const price = product.sale_price ?? product.regular_price;
                    return (
                      <div key={product.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] gap-3 border-2 border-neutral-950 bg-white p-3">
                        <div className="aspect-square overflow-hidden border-2 border-neutral-950 bg-neutral-100">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xl font-semibold uppercase text-neutral-300">
                              {product.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="line-clamp-2 block text-sm font-medium text-neutral-950">{product.name}</span>
                          <span className="mt-1 block text-xs text-neutral-500">x{item.quantity}</span>
                        </div>
                        <span className="text-sm font-medium text-neutral-950">
                          {formatProductMoney(product, parseFloat(price * item.quantity), props, country)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 border-t-2 border-neutral-950 pt-5">
                  {[
                    ['Order Subtotal', formatMoney(convertedCartTotal, { currency: checkoutLocalization.currency, locale: checkoutLocalization.locale }, props)],
                    ['Shipping Cost', shippingCost > 0 ? formatMoney(shippingCost, { currency: checkoutLocalization.currency, locale: checkoutLocalization.locale }, props) : 'FREE'],
                    ...(coupon ? [[`Discount (${coupon.code})`, `-${formatMoney(convertedDiscountAmount, { currency: checkoutLocalization.currency, locale: checkoutLocalization.locale }, props)}`]] : []),
                    ...(sellerIsIndian && (cgst > 0 || sgst > 0)
                      ? [
                        ['CGST (9%)', formatMoney(cgst, { currency: checkoutLocalization.currency, locale: checkoutLocalization.locale }, props)],
                        ['SGST (9%)', formatMoney(sgst, { currency: checkoutLocalization.currency, locale: checkoutLocalization.locale }, props)],
                      ]
                      : sellerIsIndian && igst > 0
                        ? [['IGST (18%)', formatMoney(igst, { currency: checkoutLocalization.currency, locale: checkoutLocalization.locale }, props)]]
                        : []
                    ),
                  ].map(([label, val]) => (
                    <div key={label} className="flex items-center justify-between gap-4 text-sm text-neutral-700">
                      <span>{label}</span>
                      <span className="text-right font-medium text-neutral-950">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-neutral-950 pt-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-neutral-700">Order Total</span>
                    <span className="text-2xl font-semibold tracking-tight text-neutral-950">
                      {formatMoney(finalTotal, { currency: checkoutLocalization.currency, locale: checkoutLocalization.locale }, props)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || fetchingRates || (user && !user.email_verified_at)}
                  className="inline-flex w-full items-center justify-center border-2 border-neutral-950 bg-neutral-950 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {loading ? 'Processing Transaction...' : user && !user.email_verified_at ? 'Email Verification Required' : 'Place Secure Order'}
                </button>

                <div className="flex items-center gap-2 border-2 border-neutral-950 bg-white px-4 py-3 text-sm text-neutral-700">
                  <ShieldCheck size={15} />
                  {stripePromise ? 'Stripe card payments secured with PCI-compliant encryption' : 'Sandbox checkout mode enabled'}
                </div>
              </SectionCard>
            </aside>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
};

const StripeCheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  return <CheckoutForm stripe={stripe} elements={elements} />;
};

export const Checkout = () => {
  return stripePromise ? (
    <Elements stripe={stripePromise}>
      <StripeCheckoutForm />
    </Elements>
  ) : (
    <CheckoutForm stripe={null} elements={null} />
  );
};

export default Checkout;
