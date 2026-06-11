import React, { useState, useEffect, useRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { ShieldCheck, AlertCircle, Truck, CreditCard, Wallet, Smartphone, DollarSign } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { Breadcrumbs } from '../components/Breadcrumbs';
import './Checkout.css';

// Safe check for Stripe Publishable Key
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// Card Element styling to match theme
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: 'var(--color-on-surface)',
      fontFamily: 'Outfit, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: 'var(--color-outline)',
      },
    },
    invalid: {
      color: 'var(--color-error)',
      iconColor: 'var(--color-error)',
    },
  },
};

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

  // Shipping Rates State
  const [rates, setRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [fetchingRates, setFetchingRates] = useState(false);
  const [pincodeServiceable, setPincodeServiceable] = useState(null); // null, 'checking', 'yes', 'no'

  // Manual Card Inputs state (only used when Stripe Key is not set)
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
              payment_method: {
                card: cardElement,
                  billing_details: {
                    name: user ? user.name : 'Store Customer',
                    address: {
                      line1: useDifferentBilling ? billingStreet : address
                    }
                  }
              }
            });

            if (paymentResult.error) {
              throw new Error(paymentResult.error.message || 'Payment card confirmation failed.');
            }
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

  useEffect(() => {
    if (cart.length === 0) {
      router.visit('/cart');
    }
  }, [cart]);

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

  // Live Pincode Serviceability & Rates checker
  useEffect(() => {
    if (pincode.length === 6 && address && city && stateName) {
      checkServiceability();
    } else {
      setPincodeServiceable(null);
      setRates([]);
      setSelectedRate(null);
    }
  }, [pincode, address, city, stateName]);

  const checkServiceability = async () => {
    setPincodeServiceable('checking');
    setError('');
    const checkoutItems = cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }));

    const fullAddr = `${address}, ${city}, ${stateName}, ${country} - ${pincode}`;
    router.post('/shipping/rates', {
      items: checkoutItems,
      shipping_address: fullAddr
    }, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
      only: ['flash'],
      onError: () => {
        setPincodeServiceable('no');
        setRates([]);
        setSelectedRate(null);
      },
    });
  };

  // Google Places Address Autocomplete integration
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
        const autocomplete = new window.google.maps.places.Autocomplete(addressRef.current, {
          types: ['address'],
        });
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place && place.formatted_address) {
            setAddress(place.formatted_address);
          }
        });
      } catch (err) {
        console.error('Google Places initialization failed:', err);
      }
    }
  }, []);

  const handleCalculateShipping = (e) => {
    e.preventDefault();
    setFetchingRates(true);
    checkServiceability();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!address) {
      setError('Please provide a shipping address.');
      setLoading(false);
      return;
    }

    if (rates.length > 0 && !selectedRate) {
      setError('Please select a shipping rate.');
      setLoading(false);
      return;
    }

    const checkoutItems = cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }));

    const fullAddr = `${address}, ${city}, ${stateName}, ${country} - ${pincode}`;
    const fullBillingAddr = useDifferentBilling
      ? `${billingStreet}, ${billingCity}, ${billingState}, ${billingCountry} - ${billingPincode}`
      : fullAddr;

    router.post('/checkout', {
      items: checkoutItems,
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
      shipping_carrier: selectedRate ? selectedRate.carrier : 'Free Shipping',
      shipping_service: selectedRate ? selectedRate.service : 'Standard',
      shipping_cost: selectedRate ? selectedRate.rate : 0.00,
      discount_amount: discountAmount
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

  const shippingCost = selectedRate ? selectedRate.rate : 0.00;
  const sellerState = (cart[0]?.product && cart[0].product.user && cart[0].product.user.state) ? cart[0].product.user.state : 'Gujarat';
  const isSameState = stateName ? (stateName.toLowerCase().trim() === sellerState.toLowerCase().trim()) : true;
  const taxableBase = Math.max(0.00, cartTotal + shippingCost - discountAmount);
  const cgst = isSameState ? taxableBase * 0.09 : 0.00;
  const sgst = isSameState ? taxableBase * 0.09 : 0.00;
  const igst = !isSameState ? taxableBase * 0.18 : 0.00;
  const finalTotal = taxableBase + cgst + sgst + igst;

  return (
    <div className="buyer-layout">
      <Navbar />

      <main className="container checkout-main animate-fade-in">
        <Breadcrumbs items={[
          { label: 'Shopping Cart', url: '/cart' },
          { label: 'Secure Checkout' }
        ]} />
        <h1 className="headline-lg checkout-page-title">Secure Checkout</h1>

        {error && (
          <div className="checkout-alert checkout-alert-error body-md">
            <AlertCircle size={18} style={{ marginRight: 8 }} />
            {error}
          </div>
        )}

        {user && !user.email_verified_at && (
          <div className="checkout-alert checkout-alert-error body-md" style={{ background: 'rgba(211, 47, 47, 0.1)', borderColor: 'var(--color-error)', color: 'var(--color-on-surface)' }}>
            <AlertCircle size={18} style={{ marginRight: 8, color: 'var(--color-error)' }} />
            <span>
              <strong>Email Verification Required:</strong> You must verify your email address before placing an order. <Link href="/profile" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Verify email now</Link>.
            </span>
          </div>
        )}

        {user && (!user.phone || !user.address || !user.city || !user.state || !user.country || !user.pincode) && (
          <div className="checkout-alert checkout-alert-info body-md" style={{ background: 'rgba(37, 99, 235, 0.1)', borderColor: 'var(--color-primary)', color: 'var(--color-on-surface)', marginBottom: 24 }}>
            <AlertCircle size={18} style={{ marginRight: 8, color: 'var(--color-primary)' }} />
            <span>
              <strong>Profile Incomplete:</strong> Please complete your profile details (Phone, Address, City, State, Country, Pincode) in your <Link href="/profile?tab=account-settings" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Profile Settings</Link> to enable automatic checkout.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="checkout-grid-layout">
            {/* Left Column: Delivery & Payment Details */}
            <div className="checkout-details-column" style={{ gap: 24 }}>
              
              {/* Delivery Address Card */}
              <Card title="1. Shipping Destination & Address">
                <div style={{ display: 'flex', gap: 12 }}>
                  <Input
                    label="First Name *"
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <Input
                    label="Last Name *"
                    type="text"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Input
                    label="Email Address *"
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    label="Phone Number *"
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="input-container" style={{ marginBottom: 16 }}>
                  <label className="input-label label-md">Street Address / Door No. *</label>
                  <textarea
                    ref={addressRef}
                    id="shipping-address-textarea"
                    className="input-field checkout-textarea"
                    rows="2"
                    placeholder="Enter street name, building number, locality"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Input
                    label="City *"
                    type="text"
                    placeholder="E.g. Ahmedabad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                  <Input
                    label="State / Region *"
                    type="text"
                    placeholder="E.g. Gujarat"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Input
                    label="Country *"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  />
                  <Input
                    label="PIN / Postal Code *"
                    type="text"
                    placeholder="6-digit pin code"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    required
                  />
                </div>

                {pincodeServiceable === 'checking' && (
                  <div className="pincode-status info body-md" style={{ color: 'var(--color-primary)', marginTop: 8 }}>
                    Checking Pin code serviceability...
                  </div>
                )}
                {pincodeServiceable === 'yes' && (
                  <div className="pincode-status success body-md" style={{ color: '#2e7d32', marginTop: 8, fontWeight: 'bold' }}>
                    ✓ Pincode serviceable. Shiprocket partners available!
                  </div>
                )}
                {pincodeServiceable === 'no' && (
                  <div className="pincode-status error body-md" style={{ color: '#c62828', marginTop: 8, fontWeight: 'bold' }}>
                    ✕ Pincode unserviceable. No shipping coverage.
                  </div>
                )}

                {/* Shipping Rates Options display */}
                {rates.length > 0 && (
                  <div className="shipping-rates-selector" style={{ marginTop: 16 }}>
                    <label className="input-label label-md" style={{ marginBottom: 10 }}>
                      <Truck size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                      Available Shipping Carriers
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {rates.map((rate) => (
                        <label 
                          key={rate.id} 
                          className={`shipping-rate-option-label flex-between ${selectedRate?.id === rate.id ? 'active' : ''}`}
                          style={{
                            padding: '12px 16px',
                            border: '1px solid var(--color-outline-variant)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: selectedRate?.id === rate.id ? 'var(--color-surface-variant)' : 'transparent'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input
                              type="radio"
                              name="shipping_rate"
                              checked={selectedRate?.id === rate.id}
                              onChange={() => setSelectedRate(rate)}
                              style={{ accentColor: 'var(--color-primary)' }}
                            />
                            <div>
                              <strong className="body-md" style={{ color: 'var(--color-on-surface)' }}>{rate.carrier}</strong>
                              <span className="body-sm" style={{ color: 'var(--color-outline)', marginLeft: 8 }}>({rate.service})</span>
                            </div>
                          </div>
                          <span className="label-lg" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                            ${rate.rate.toFixed(2)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Billing Address Option */}
              <Card title="2. Billing Address Options">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    id="different-billing-checkbox"
                    checked={useDifferentBilling}
                    onChange={(e) => setUseDifferentBilling(e.target.checked)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <label htmlFor="different-billing-checkbox" className="body-md" style={{ cursor: 'pointer' }}>
                    Billing address is different from shipping address
                  </label>
                </div>

                {useDifferentBilling && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="input-container" style={{ marginBottom: 0 }}>
                      <label className="input-label label-md">Billing Street Address *</label>
                      <textarea
                        className="input-field checkout-textarea"
                        rows="2"
                        placeholder="Enter street name, building number"
                        value={billingStreet}
                        onChange={(e) => setBillingStreet(e.target.value)}
                        required={useDifferentBilling}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Input
                        label="Billing City *"
                        type="text"
                        placeholder="Enter city"
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        required={useDifferentBilling}
                      />
                      <Input
                        label="Billing State / Region *"
                        type="text"
                        placeholder="Enter state"
                        value={billingState}
                        onChange={(e) => setBillingState(e.target.value)}
                        required={useDifferentBilling}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Input
                        label="Billing Country *"
                        type="text"
                        placeholder="Enter country"
                        value={billingCountry}
                        onChange={(e) => setBillingCountry(e.target.value)}
                        required={useDifferentBilling}
                      />
                      <Input
                        label="Billing PIN / Postal Code *"
                        type="text"
                        placeholder="6-digit pin code"
                        maxLength={6}
                        value={billingPincode}
                        onChange={(e) => setBillingPincode(e.target.value)}
                        required={useDifferentBilling}
                      />
                    </div>
                  </div>
                )}
              </Card>

              {/* Payment Methods Options Card */}
              <Card title="3. Choose Payment Method">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
                  
                  {/* Credit Card */}
                  <label 
                    className={`payment-method-selector-label ${paymentMethod === 'Credit Card' ? 'active' : ''}`}
                    style={{
                      padding: '16px 12px',
                      border: '2px solid ' + (paymentMethod === 'Credit Card' ? 'var(--color-primary)' : 'var(--color-outline-variant)'),
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <input
                      type="radio"
                      name="payment_type"
                      checked={paymentMethod === 'Credit Card'}
                      onChange={() => setPaymentMethod('Credit Card')}
                      style={{ display: 'none' }}
                    />
                    <CreditCard size={24} style={{ color: paymentMethod === 'Credit Card' ? 'var(--color-primary)' : 'var(--color-outline)' }} />
                    <strong className="body-md">Credit Card</strong>
                  </label>

                  {/* Google Pay */}
                  <label 
                    className={`payment-method-selector-label ${paymentMethod === 'Google Pay' ? 'active' : ''}`}
                    style={{
                      padding: '16px 12px',
                      border: '2px solid ' + (paymentMethod === 'Google Pay' ? 'var(--color-primary)' : 'var(--color-outline-variant)'),
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <input
                      type="radio"
                      name="payment_type"
                      checked={paymentMethod === 'Google Pay'}
                      onChange={() => setPaymentMethod('Google Pay')}
                      style={{ display: 'none' }}
                    />
                    <Smartphone size={24} style={{ color: paymentMethod === 'Google Pay' ? 'var(--color-primary)' : 'var(--color-outline)' }} />
                    <strong className="body-md">Google Pay</strong>
                  </label>

                  {/* PayPal */}
                  <label 
                    className={`payment-method-selector-label ${paymentMethod === 'PayPal' ? 'active' : ''}`}
                    style={{
                      padding: '16px 12px',
                      border: '2px solid ' + (paymentMethod === 'PayPal' ? 'var(--color-primary)' : 'var(--color-outline-variant)'),
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <input
                      type="radio"
                      name="payment_type"
                      checked={paymentMethod === 'PayPal'}
                      onChange={() => setPaymentMethod('PayPal')}
                      style={{ display: 'none' }}
                    />
                    <DollarSign size={24} style={{ color: paymentMethod === 'PayPal' ? 'var(--color-primary)' : 'var(--color-outline)' }} />
                    <strong className="body-md">PayPal</strong>
                  </label>

                  {/* Paytm */}
                  <label 
                    className={`payment-method-selector-label ${paymentMethod === 'Paytm' ? 'active' : ''}`}
                    style={{
                      padding: '16px 12px',
                      border: '2px solid ' + (paymentMethod === 'Paytm' ? 'var(--color-primary)' : 'var(--color-outline-variant)'),
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <input
                      type="radio"
                      name="payment_type"
                      checked={paymentMethod === 'Paytm'}
                      onChange={() => setPaymentMethod('Paytm')}
                      style={{ display: 'none' }}
                    />
                    <Wallet size={24} style={{ color: paymentMethod === 'Paytm' ? 'var(--color-primary)' : 'var(--color-outline)' }} />
                    <strong className="body-md">Paytm</strong>
                  </label>

                  {/* COD */}
                  <label 
                    className={`payment-method-selector-label ${paymentMethod === 'COD' ? 'active' : ''}`}
                    style={{
                      padding: '16px 12px',
                      border: '2px solid ' + (paymentMethod === 'COD' ? 'var(--color-primary)' : 'var(--color-outline-variant)'),
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <input
                      type="radio"
                      name="payment_type"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      style={{ display: 'none' }}
                    />
                    <Truck size={24} style={{ color: paymentMethod === 'COD' ? 'var(--color-primary)' : 'var(--color-outline)' }} />
                    <strong className="body-md">COD</strong>
                  </label>
                </div>

                {paymentMethod === 'Credit Card' && (
                  <div className="payment-card-inputs-wrapper" style={{ minHeight: 90 }}>
                    {stripePromise ? (
                      /* Real Stripe Elements form block */
                      <div className="stripe-card-element-container" style={{
                        padding: '14px 12px',
                        border: '1px solid var(--color-outline-variant)',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255,255,255,0.02)'
                      }}>
                        <CardElement options={CARD_ELEMENT_OPTIONS} />
                      </div>
                    ) : (
                      /* Mock visual fallback inputs */
                      <div className="checkout-card-form animate-fade-in">
                        <Input
                          label="Credit Card Number"
                          type="text"
                          placeholder="4111 2222 3333 4444"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          required
                        />
                        <div className="checkout-card-subfields">
                          <Input
                            label="Expiration Date"
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            required
                          />
                          <Input
                            label="CVV"
                            type="text"
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            required
                          />
                        </div>
                        <span className="body-sm" style={{ color: 'var(--color-outline)', marginTop: 8 }}>
                          Stripe sandbox mock active. Card credentials tokenized securely on submission simulation.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'Google Pay' && (
                  <div className="animate-fade-in" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-outline-variant)', borderRadius: '8px', minHeight: 90, display: 'flex', alignItems: 'center' }}>
                    <p className="body-md" style={{ color: 'var(--color-outline)', margin: 0 }}>
                      You will be prompted to authenticate with <strong>Google Pay</strong> on order submission simulation.
                    </p>
                  </div>
                )}
                {paymentMethod === 'PayPal' && (
                  <div className="animate-fade-in" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-outline-variant)', borderRadius: '8px', minHeight: 90, display: 'flex', alignItems: 'center' }}>
                    <p className="body-md" style={{ color: 'var(--color-outline)', margin: 0 }}>
                      You will be redirected to the secure <strong>PayPal</strong> gateway on order submission simulation.
                    </p>
                  </div>
                )}
                {paymentMethod === 'Paytm' && (
                  <div className="animate-fade-in" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-outline-variant)', borderRadius: '8px', minHeight: 90, display: 'flex', alignItems: 'center' }}>
                    <p className="body-md" style={{ color: 'var(--color-outline)', margin: 0 }}>
                      Pay securely using UPI or <strong>Paytm wallet</strong> on order submission simulation.
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column: Checkout Summary Cart Items */}
            <div className="checkout-summary-column">
              <Card title="Review Items & Place Order" className="checkout-summary-card">
                <div className="checkout-items-mini-list">
                  {cart.map((item) => {
                    const product = item.product;
                    const price = product.sale_price ?? product.regular_price;
                    return (
                      <div key={product.id} className="checkout-mini-row body-md">
                        <span className="mini-name">
                          {product.name} <strong style={{ color: 'var(--color-outline)' }}>x{item.quantity}</strong>
                        </span>
                        <span className="mini-price">${parseFloat(price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="checkout-summary-divider"></div>

                <div className="summary-row body-md">
                  <span>Order Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                {coupon && (
                  <div className="summary-row body-md" style={{ color: 'var(--color-primary)' }}>
                    <span>Discount ({coupon.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row body-md">
                  <span>Shipping Cost</span>
                  <span>{shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'FREE'}</span>
                </div>
                {cgst > 0 || sgst > 0 ? (
                  <>
                    <div className="summary-row body-md" style={{ color: 'var(--color-outline)' }}>
                      <span>CGST (9%)</span>
                      <span>${cgst.toFixed(2)}</span>
                    </div>
                    <div className="summary-row body-md" style={{ color: 'var(--color-outline)' }}>
                      <span>SGST (9%)</span>
                      <span>${sgst.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="summary-row body-md" style={{ color: 'var(--color-outline)' }}>
                    <span>IGST (18%)</span>
                    <span>${igst.toFixed(2)}</span>
                  </div>
                )}
                <div className="checkout-summary-divider"></div>
                <div className="summary-row total-row title-lg">
                  <span>Order Total</span>
                  <span className="total-amount">${finalTotal.toFixed(2)}</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="checkout-place-btn"
                  disabled={loading || fetchingRates || (user && !user.email_verified_at)}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {loading ? 'Processing Transaction...' : (user && !user.email_verified_at ? 'Email Verification Required' : 'Place Secure Order')}
                </Button>

                <div className="checkout-security-tag label-md flex-center">
                  <ShieldCheck size={16} style={{ marginRight: 6, color: '#2e7d32' }} />
                  {stripePromise ? 'PCI-Compliant Encryption' : 'Sandbox Encrypted Transaction'}
                </div>
              </Card>
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
