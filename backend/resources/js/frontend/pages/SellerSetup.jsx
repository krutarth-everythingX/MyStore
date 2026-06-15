import React, { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export const SellerSetup = () => {
  const { user } = useAuth();
  const [brandName, setBrandName] = useState(user?.brand_name || '');
  const [gstNumber, setGstNumber] = useState(user?.gst_number || '');
  const [address, setAddress] = useState(user?.address || '');
  const [country, setCountry] = useState(user?.country || '');
  const [fulfillmentChannels, setFulfillmentChannels] = useState(
    Array.isArray(user?.fulfillment_channels) ? user.fulfillment_channels.join(', ') : 'Seller Fulfilled, Local Courier',
  );
  const [defaultFulfillmentChannel, setDefaultFulfillmentChannel] = useState(user?.default_fulfillment_channel || 'Seller Fulfilled');
  const [shippingAcceptanceTime, setShippingAcceptanceTime] = useState(user?.shipping_acceptance_time || '2 hours');
  const [handlingTimeBusinessDays, setHandlingTimeBusinessDays] = useState(user?.handling_time_business_days ?? 1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const channelOptions = useMemo(() => (
    fulfillmentChannels
      .split(',')
      .map((channel) => channel.trim())
      .filter(Boolean)
  ), [fulfillmentChannels]);

  const inputCls = 'border border-neutral-200 rounded-xl py-3 px-4 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all bg-white w-full';

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    router.put('/profile', {
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      brand_name: brandName,
      gst_number: gstNumber,
      address,
      country,
      fulfillment_channels: channelOptions,
      default_fulfillment_channel: defaultFulfillmentChannel,
      shipping_acceptance_time: shippingAcceptanceTime,
      handling_time_business_days: Number(handlingTimeBusinessDays || 1),
    }, {
      preserveScroll: true,
      onSuccess: () => router.visit('/seller', { replace: true }),
      onError: (errors) => {
        setError(Object.values(errors)[0] || 'Please complete your seller details.');
        setLoading(false);
      },
      onFinish: () => setLoading(false),
    });
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-14 py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_20%_80%,rgba(251,191,36,0.08),transparent)]" />
        <div className="text-xl font-semibold text-white z-10">MyStore Seller</div>
        <div className="z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-4 block">Store Setup</span>
          <h1 className="text-3xl font-semibold text-white leading-snug mb-4">Complete your seller profile.</h1>
          <p className="text-neutral-400 text-base leading-relaxed">Add storefront, country, tax, pickup, and fulfillment details before entering the seller dashboard.</p>
        </div>
        <p className="text-neutral-600 text-xs z-10">Copyright {new Date().getFullYear()} MyStore. All rights reserved.</p>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <span className="lg:hidden text-xl font-semibold text-neutral-900 mb-8 block">MyStore Seller</span>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Complete Seller Setup</h2>
            <p className="text-sm text-neutral-500">This step happens after signup, including Google signup, so sellers can finish store details once.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-3.5 rounded-2xl mb-5">
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Store / Brand Name *</label>
              <input className={inputCls} type="text" placeholder="Enter your store name" value={brandName} onChange={(event) => setBrandName(event.target.value)} required />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">GSTIN Number *</label>
                <input className={inputCls} type="text" placeholder="15-digit GST number" maxLength={15} value={gstNumber} onChange={(event) => setGstNumber(event.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Country *</label>
                <input className={inputCls} type="text" placeholder="India" value={country} onChange={(event) => setCountry(event.target.value)} required />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Pickup & Business Address *</label>
              <textarea className={`${inputCls} resize-none`} rows={4} placeholder="Enter warehouse or store street address" value={address} onChange={(event) => setAddress(event.target.value)} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Fulfillment Channels *</label>
              <input className={inputCls} type="text" placeholder="Seller Fulfilled, Local Courier" value={fulfillmentChannels} onChange={(event) => setFulfillmentChannels(event.target.value)} required />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Default Channel *</label>
                <select className={inputCls} value={defaultFulfillmentChannel} onChange={(event) => setDefaultFulfillmentChannel(event.target.value)} required>
                  <option value="">Choose channel</option>
                  {channelOptions.map((channel) => (
                    <option key={channel} value={channel}>{channel}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Accept Orders Within *</label>
                <input className={inputCls} type="text" placeholder="2 hours" value={shippingAcceptanceTime} onChange={(event) => setShippingAcceptanceTime(event.target.value)} required />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Handling Time (Business Days)</label>
              <input className={inputCls} type="number" min="0" max="30" value={handlingTimeBusinessDays} onChange={(event) => setHandlingTimeBusinessDays(event.target.value)} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-neutral-950 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 shadow-sm mt-2"
            >
              {loading ? 'Saving setup...' : 'Enter Seller Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerSetup;
