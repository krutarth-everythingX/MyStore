import React, { useState, useEffect, useRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ShieldCheck, AlertCircle, Truck, CreditCard, Wallet, Smartphone, DollarSign } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: { color: '#111827', fontFamily: 'Inter, sans-serif', fontSmoothing: 'antialiased', fontSize: '15px', '::placeholder': { color: '#9ca3af' } },
    invalid: { color: '#dc2626', iconColor: '#dc2626' },
  },
};

// Reusable field components
const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</label>
    {children}
  </div>
);

const inputCls = "border border-neutral-200 rounded-xl py-3 px-4 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all bg-white w-full";

const PAYMENT_METHODS = [
  { id: 'Credit Card', label: 'Credit Card', icon: CreditCard },
  { id: 'Google Pay', label: 'Google Pay', icon: Smartphone },
  { id: 'PayPal', label: 'PayPal', icon: DollarSign },
  { id: 'Paytm', label: 'Paytm', icon: Wallet },
  { id: 'COD', label: 'COD', icon: Truck },
];

const CheckoutForm = ({ stripe, elements }) => {
  const { cart, cartTotal, clearCart, coupon, discountAmount } = useCart();
  const { props } = usePage();
  const { user } = useAuth();

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
          if (paymentMethod === 'Credit Card' && result.requires_payment_confirmation && stripePromise && stripe && elements && result.client_secret && !result.client_secret.startsWith('pi_mock_')) {
            const cardElement = elements.getElement(CardElement);
            const paymentResult = await stripe.confirmCardPayment(result.client_secret, {
              payment_method: { card: cardElement, billing_details: { name: user ? user.name : 'Store Customer', address: { line1: useDifferentBilling ? billingStreet : address } } }
            });
            if (paymentResult.error) throw new Error(paymentResult.error.message || 'Payment card confirmation failed.');
          }
          clearCart();
          router.visit('/orders?success=true');
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
  }, [address, billingStreet, billingCity, billingState, billingCountry, billingPincode, clearCart, elements, paymentMethod, props.flash, stripe, user, useDifferentBilling]);

  useEffect(() => { if (cart.length === 0) router.visit('/cart'); }, [cart]);

  useEffect(() => {
    if (user) {
      const names = user.name ? user.name.split(' ') : ['', ''];
      setFirstName(names[0] || ''); setLastName(names.slice(1).join(' ') || '');
      setEmail(user.email || ''); setPhone(user.phone || ''); setAddress(user.address || '');
      setCity(user.city || ''); setStateName(user.state || ''); setCountry(user.country || 'India'); setPincode(user.pincode || '');
    }
  }, [user?.id]);

  useEffect(() => {
    if (pincode.length === 6 && address && city && stateName) checkServiceability();
    else { setPincodeServiceable(null); setRates([]); setSelectedRate(null); }
  }, [pincode, address, city, stateName]);

  const checkServiceability = async () => {
    setPincodeServiceable('checking');
    setError('');
    router.post('/shipping/rates', {
      items: cart.map(item => ({ product_id: item.product.id, quantity: item.quantity })),
      shipping_address: `${address}, ${city}, ${stateName}, ${country} - ${pincode}`
    }, { preserveScroll: true, preserveState: true, replace: true, only: ['flash'], onError: () => { setPincodeServiceable('no'); setRates([]); setSelectedRate(null); } });
  };

  useEffect(() => {
    const googleApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!googleApiKey) return;
    const scriptId = 'google-maps-places-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId; script.src = `https://maps.google.com/maps/api/js?key=${googleApiKey}&libraries=places`; script.async = true; script.defer = true; script.onload = initAutocomplete; document.head.appendChild(script);
    } else { initAutocomplete(); }
    function initAutocomplete() {
      if (!addressRef.current) return;
      try {
        const ac = new window.google.maps.places.Autocomplete(addressRef.current, { types: ['address'] });
        ac.addListener('place_changed', () => { const p = ac.getPlace(); if (p?.formatted_address) setAddress(p.formatted_address); });
      } catch (e) {}
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!address) { setError('Please provide a shipping address.'); setLoading(false); return; }
    if (rates.length > 0 && !selectedRate) { setError('Please select a shipping rate.'); setLoading(false); return; }
    const fullAddr = `${address}, ${city}, ${stateName}, ${country} - ${pincode}`;
    const fullBillingAddr = useDifferentBilling ? `${billingStreet}, ${billingCity}, ${billingState}, ${billingCountry} - ${billingPincode}` : fullAddr;
    router.post('/checkout', {
      items: cart.map(item => ({ product_id: item.product.id, quantity: item.quantity })),
      shipping_address: fullAddr, billing_address: fullBillingAddr, buyer_phone: phone, country, city, state: stateName, postal_code: pincode, company_name: '', buyer_gstin: '',
      payment_method: paymentMethod, shipping_carrier: selectedRate ? selectedRate.carrier : 'Free Shipping', shipping_service: selectedRate ? selectedRate.service : 'Standard',
      shipping_cost: selectedRate ? selectedRate.rate : 0.00, discount_amount: discountAmount
    }, {
      preserveScroll: true, preserveState: true, only: ['flash'],
      onError: (errors) => { setError(Object.values(errors)[0] || 'Checkout failed'); setLoading(false); },
    });
  };

  const shippingCost = selectedRate ? selectedRate.rate : 0.00;
  const sellerState = (cart[0]?.product?.user?.state) ? cart[0].product.user.state : 'Gujarat';
  const isSameState = stateName ? (stateName.toLowerCase().trim() === sellerState.toLowerCase().trim()) : true;
  const taxableBase = Math.max(0.00, cartTotal + shippingCost - discountAmount);
  const cgst = isSameState ? taxableBase * 0.09 : 0.00;
  const sgst = isSameState ? taxableBase * 0.09 : 0.00;
  const igst = !isSameState ? taxableBase * 0.18 : 0.00;
  const finalTotal = taxableBase + cgst + sgst + igst;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1 min-h-[100dvh]">
        {/* Breadcrumb */}
        <nav className="hidden items-center gap-2 mb-6 text-[11px] font-bold uppercase tracking-wider text-neutral-400 sm:flex">
          <Link href="/" className="hover:text-neutral-800 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-neutral-800 transition-colors">Cart</Link>
          <span>/</span>
          <span className="text-neutral-800">Secure Checkout</span>
        </nav>

        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-900 mb-8">Secure Checkout</h1>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 px-5 py-4 rounded-2xl mb-6">
            <AlertCircle size={17} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {user && !user.email_verified_at && (
          <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 px-5 py-4 rounded-2xl mb-6">
            <AlertCircle size={17} className="shrink-0 mt-0.5" />
            <span><strong>Email Verification Required:</strong> You must verify your email before placing an order. <Link href="/profile" className="underline underline-offset-2">Verify email now</Link>.</span>
          </div>
        )}

        {user && (!user.phone || !user.address || !user.city || !user.state || !user.country || !user.pincode) && (
          <div className="flex items-start gap-3 text-sm text-blue-700 bg-blue-50 border border-blue-100 px-5 py-4 rounded-2xl mb-6">
            <AlertCircle size={17} className="shrink-0 mt-0.5" />
            <span><strong>Profile Incomplete:</strong> Complete your <Link href="/profile?tab=account-settings" className="underline underline-offset-2">profile settings</Link> to enable automatic checkout prefill.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
            {/* Left Column */}
            <div className="flex flex-col gap-5">

              {/* 1. Shipping Address */}
              <div className="bg-white rounded-3xl border border-neutral-100 shadow-xs p-6 sm:p-8">
                <h2 className="font-semibold text-base text-neutral-900 mb-6 pb-4 border-b border-neutral-100">1. Shipping Destination & Address</h2>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                    <Field label="First Name *">
                      <input className={inputCls} type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </Field>
                    <Field label="Last Name *">
                      <input className={inputCls} type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </Field>
                  </div>

                  <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                    <Field label="Email Address *">
                      <input className={inputCls} type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </Field>
                    <Field label="Phone Number *">
                      <input className={inputCls} type="tel" placeholder="Enter phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </Field>
                  </div>

                  <Field label="Street Address / Door No. *">
                    <textarea ref={addressRef} className={`${inputCls} resize-none`} rows={2} placeholder="Street, building number, locality" value={address} onChange={(e) => setAddress(e.target.value)} required />
                  </Field>

                  <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                    <Field label="City *">
                      <input className={inputCls} type="text" placeholder="E.g. Ahmedabad" value={city} onChange={(e) => setCity(e.target.value)} required />
                    </Field>
                    <Field label="State / Region *">
                      <input className={inputCls} type="text" placeholder="E.g. Gujarat" value={stateName} onChange={(e) => setStateName(e.target.value)} required />
                    </Field>
                  </div>

                  <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                    <Field label="Country *">
                      <input className={inputCls} type="text" value={country} onChange={(e) => setCountry(e.target.value)} required />
                    </Field>
                    <Field label="PIN / Postal Code *">
                      <input className={inputCls} type="text" placeholder="6-digit PIN" maxLength={6} value={pincode} onChange={(e) => setPincode(e.target.value)} required />
                    </Field>
                  </div>

                  {/* Pincode status */}
                  {pincodeServiceable === 'checking' && <p className="text-xs text-blue-600 font-medium">Checking pincode serviceability...</p>}
                  {pincodeServiceable === 'yes' && <p className="text-xs text-green-700 font-semibold">✓ Pincode serviceable. Shipping partners available!</p>}
                  {pincodeServiceable === 'no' && <p className="text-xs text-red-700 font-semibold">✕ Pincode not serviceable. No shipping coverage.</p>}

                  {/* Shipping rates */}
                  {rates.length > 0 && (
                    <div className="flex flex-col gap-3 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2"><Truck size={12} /> Available Shipping Carriers</span>
                      {rates.map((rate) => (
                        <label
                          key={rate.id}
                          className={`flex items-center justify-between px-4 py-3 border rounded-2xl cursor-pointer transition-all ${selectedRate?.id === rate.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}
                        >
                          <div className="flex items-center gap-3">
                            <input type="radio" name="shipping_rate" checked={selectedRate?.id === rate.id} onChange={() => setSelectedRate(rate)} className="accent-neutral-900" />
                            <div>
                              <strong className="text-sm text-neutral-900">{rate.carrier}</strong>
                              <span className="text-xs text-neutral-400 ml-2">({rate.service})</span>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-neutral-900">${rate.rate.toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Billing Address */}
              <div className="bg-white rounded-3xl border border-neutral-100 shadow-xs p-6 sm:p-8">
                <h2 className="font-semibold text-base text-neutral-900 mb-5 pb-4 border-b border-neutral-100">2. Billing Address Options</h2>
                <label className="flex items-center gap-3 text-sm text-neutral-600 cursor-pointer select-none mb-5">
                  <input type="checkbox" className="accent-neutral-900 w-4 h-4" checked={useDifferentBilling} onChange={(e) => setUseDifferentBilling(e.target.checked)} />
                  Billing address is different from shipping address
                </label>

                {useDifferentBilling && (
                  <div className="flex flex-col gap-4">
                    <Field label="Billing Street Address *">
                      <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Enter street name, building" value={billingStreet} onChange={(e) => setBillingStreet(e.target.value)} required={useDifferentBilling} />
                    </Field>
                    <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                      <Field label="Billing City *"><input className={inputCls} type="text" placeholder="City" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} required={useDifferentBilling} /></Field>
                      <Field label="Billing State *"><input className={inputCls} type="text" placeholder="State" value={billingState} onChange={(e) => setBillingState(e.target.value)} required={useDifferentBilling} /></Field>
                    </div>
                    <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                      <Field label="Billing Country *"><input className={inputCls} type="text" value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)} required={useDifferentBilling} /></Field>
                      <Field label="Billing PIN *"><input className={inputCls} type="text" maxLength={6} placeholder="6-digit PIN" value={billingPincode} onChange={(e) => setBillingPincode(e.target.value)} required={useDifferentBilling} /></Field>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Payment Method */}
              <div className="bg-white rounded-3xl border border-neutral-100 shadow-xs p-6 sm:p-8">
                <h2 className="font-semibold text-base text-neutral-900 mb-6 pb-4 border-b border-neutral-100">3. Choose Payment Method</h2>

                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                  {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                    <label key={id} className={`flex flex-col items-center justify-center gap-2 px-3 py-4 border-2 rounded-2xl cursor-pointer transition-all text-center ${paymentMethod === id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
                      <input type="radio" name="payment_type" checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="hidden" />
                      <Icon size={22} className={paymentMethod === id ? 'text-neutral-900' : 'text-neutral-400'} />
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${paymentMethod === id ? 'text-neutral-900' : 'text-neutral-500'}`}>{label}</span>
                    </label>
                  ))}
                </div>

                {paymentMethod === 'Credit Card' && (
                  <div className="rounded-2xl border border-neutral-200 p-4 bg-neutral-50 min-h-[80px]">
                    {stripePromise ? (
                      <CardElement options={CARD_ELEMENT_OPTIONS} />
                    ) : (
                      <div className="flex flex-col gap-4">
                        <Field label="Card Number">
                          <input className={inputCls} type="text" placeholder="4111 2222 3333 4444" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required />
                        </Field>
                        <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                          <Field label="Expiry"><input className={inputCls} type="text" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} required /></Field>
                          <Field label="CVV"><input className={inputCls} type="text" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} required /></Field>
                        </div>
                        <p className="text-xs text-neutral-400">Stripe sandbox mock active. Card credentials tokenized securely on submission simulation.</p>
                      </div>
                    )}
                  </div>
                )}

                {['Google Pay', 'PayPal', 'Paytm'].includes(paymentMethod) && (
                  <div className="rounded-2xl border border-neutral-200 p-5 bg-neutral-50 min-h-[80px] flex items-center">
                    <p className="text-sm text-neutral-500">
                      You will be {paymentMethod === 'PayPal' ? 'redirected to the secure PayPal gateway' : `prompted to authenticate with ${paymentMethod}`} on order submission.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:sticky lg:top-28 bg-white rounded-3xl border border-neutral-100 shadow-xs overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100">
                <h2 className="font-semibold text-base text-neutral-900">Review Items & Place Order</h2>
              </div>

              <div className="px-6 py-5 flex flex-col gap-4">
                {/* Cart mini-list */}
                <div className="flex flex-col divide-y divide-neutral-100 mb-2">
                  {cart.map((item) => {
                    const product = item.product;
                    const price = product.sale_price ?? product.regular_price;
                    return (
                      <div key={product.id} className="flex items-center gap-3 py-3">
                        <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-400 shrink-0 overflow-hidden">
                          {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover rounded-xl" /> : product.name.charAt(0)}
                        </div>
                        <span className="flex-1 text-sm text-neutral-700 line-clamp-1">{product.name} <span className="text-neutral-400">×{item.quantity}</span></span>
                        <span className="text-sm font-semibold text-neutral-900 shrink-0">${parseFloat(price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="h-px bg-neutral-100" />

                {/* Pricing rows */}
                {[
                  ['Order Subtotal', `$${cartTotal.toFixed(2)}`],
                  ['Shipping Cost', shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'FREE'],
                  ...(coupon ? [[`Discount (${coupon.code})`, `-$${discountAmount.toFixed(2)}`]] : []),
                  ...(cgst > 0 || sgst > 0 ? [['CGST (9%)', `$${cgst.toFixed(2)}`], ['SGST (9%)', `$${sgst.toFixed(2)}`]] : [['IGST (18%)', `$${igst.toFixed(2)}`]]),
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between text-sm text-neutral-600">
                    <span>{label}</span>
                    <span className={label.startsWith('Discount') ? 'text-green-700 font-medium' : label === 'Shipping Cost' && shippingCost === 0 ? 'text-green-700 font-semibold' : ''}>{val}</span>
                  </div>
                ))}

                <div className="h-px bg-neutral-100" />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900">Order Total</span>
                  <span className="font-serif text-xl sm:text-2xl font-semibold text-neutral-900">${finalTotal.toFixed(2)}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || fetchingRates || (user && !user.email_verified_at)}
                  className="w-full py-3.5 bg-neutral-950 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 shadow-sm mt-2"
                >
                  {loading ? 'Processing Transaction...' : user && !user.email_verified_at ? 'Email Verification Required' : 'Place Secure Order'}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-green-700">
                  <ShieldCheck size={14} />
                  {stripePromise ? 'PCI-Compliant Encryption' : 'Sandbox Encrypted Transaction'}
                </div>
              </div>
            </div>
          </div>
        </form>
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
