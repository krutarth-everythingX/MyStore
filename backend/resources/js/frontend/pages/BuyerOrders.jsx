import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CheckCircle2, Package, Truck, Calendar, CreditCard } from 'lucide-react';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  processing: 'bg-blue-50 text-blue-700 border-blue-100',
  shipped: 'bg-sky-50 text-sky-700 border-sky-100',
  out_for_delivery: 'bg-violet-50 text-violet-700 border-violet-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
};

const TIMELINE_STEPS = ['Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
const STATUS_ORDER = ['pending', 'processing', 'shipped', 'out_for_delivery', 'completed'];

export const BuyerOrders = () => {
  const { props, url } = usePage();
  const [orders, setOrders] = useState(props.buyerOrders || []);
  const [loading, setLoading] = useState(false);
  const searchParams = new URL(url || window.location.href, window.location.origin).searchParams;
  const isSuccessCheckout = searchParams.get('success') === 'true';

  useEffect(() => { setOrders(props.buyerOrders || []); setLoading(false); }, [props.buyerOrders]);

  const getTrackingUrl = (carrier, trackingNumber) => {
    if (!trackingNumber) return '#';
    const num = trackingNumber.trim();
    const c = carrier.toLowerCase();
    if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`;
    if (c.includes('fedex')) return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${num}`;
    if (c.includes('dhl')) return `https://www.dhl.com/en/express/tracking.html?AWB=${num}`;
    if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${num}`;
    return `https://www.google.com/search?q=${encodeURIComponent(carrier + ' ' + num)}`;
  };

  const getTimelineProgress = (status) => {
    const idx = STATUS_ORDER.indexOf(status.toLowerCase());
    if (idx === -1) return 0;
    return (idx / (STATUS_ORDER.length - 1)) * 100;
  };

  const getStepStatus = (status, index) => {
    const currentIdx = STATUS_ORDER.indexOf(status.toLowerCase());
    if (currentIdx === -1) return 'upcoming';
    if (index < currentIdx) return 'completed';
    if (index === currentIdx) return 'active';
    return 'upcoming';
  };

  const handleCancelOrder = (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    router.post(`/orders/${orderId}/cancel`, {}, { preserveScroll: true, preserveState: false, only: ['buyerOrders', 'flash'] });
  };

  const handleReturnOrder = (orderId) => {
    if (!window.confirm('Are you sure you want to request a return and refund for this order?')) return;
    router.post(`/orders/${orderId}/return`, {}, { preserveScroll: true, preserveState: false, only: ['buyerOrders', 'flash'] });
  };

  const handleViewInvoice = (orderId) => {
    window.open(`/orders/${orderId}/invoice`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1 min-h-[100dvh]">
        {/* Breadcrumb */}
        <nav className="hidden items-center gap-2 mb-6 text-[11px] font-bold uppercase tracking-wider text-neutral-400 sm:flex">
          <Link href="/" className="hover:text-neutral-800 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-neutral-800">My Orders</span>
        </nav>

        {/* Success Banner */}
        {isSuccessCheckout && (
          <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-5 mb-6">
            <CheckCircle2 size={28} className="text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm text-emerald-800 mb-0.5">Order Placed Successfully!</h4>
              <p className="text-sm text-emerald-700">Thank you for your purchase. The seller(s) will fulfill your items and update logistics tracking.</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="font-serif text-3xl font-semibold text-neutral-900">My Purchase History</h1>
          <span className="text-xs font-semibold bg-white border border-neutral-200 px-3 py-1.5 rounded-full text-neutral-600">Total Orders: {orders.length}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-72 text-sm text-neutral-400">Loading order history...</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-96 bg-white rounded-3xl border border-neutral-100 shadow-xs gap-5 text-center px-6 py-16">
            <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center">
              <Package size={26} className="text-neutral-400" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-neutral-900 mb-2">No orders found</h3>
              <p className="text-sm text-neutral-500">You haven't placed any orders in MyStore yet.</p>
            </div>
            <Link href="/" className="px-6 py-2.5 bg-neutral-950 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-neutral-900 transition-colors">
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {orders.map((order) => {
              const statusKey = order.status.toLowerCase();
              const statusCls = STATUS_STYLES[statusKey] || 'bg-neutral-100 text-neutral-600 border-neutral-200';
              const isCancelled = statusKey === 'cancelled';

              return (
                <div key={order.id} className="bg-white rounded-3xl border border-neutral-100 shadow-xs overflow-hidden">
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-neutral-100">
                    <span className="font-semibold text-sm text-neutral-900">Order ID: #{order.id}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusCls}`}>
                        {order.status}
                      </span>
                      {order.refund_status && (
                        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border bg-red-50 text-red-700 border-red-100">
                          {order.refund_status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col gap-5">
                    {/* Order Meta */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-start gap-2.5">
                        <Calendar size={14} className="text-neutral-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Order Date</span>
                          <span className="text-sm text-neutral-700">{new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CreditCard size={14} className="text-neutral-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Payment</span>
                          <span className="text-sm text-neutral-700">{order.payment_method}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Truck size={14} className="text-neutral-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Logistics</span>
                          {order.shipping_carrier ? (
                            <span className="text-sm text-neutral-700">
                              <strong>{order.shipping_carrier}</strong> — {order.tracking_number ? (
                                <a href={getTrackingUrl(order.shipping_carrier, order.tracking_number)} target="_blank" rel="noopener noreferrer" className="text-neutral-900 underline underline-offset-2 font-semibold hover:no-underline">
                                  {order.tracking_number}
                                </a>
                              ) : 'Awaiting tracking ID'}
                            </span>
                          ) : <span className="text-sm text-neutral-400">Not yet shipped</span>}
                        </div>
                      </div>
                    </div>

                    {/* Tracking Timeline */}
                    {!isCancelled && (
                      <div className="border border-neutral-100 rounded-2xl px-5 py-5 bg-neutral-50">
                        <div className="relative flex items-center justify-between">
                          {/* Track bar */}
                          <div className="absolute inset-x-4 top-[13px] h-1.5 bg-neutral-200 rounded-full -z-0">
                            <div
                              className="h-full bg-neutral-900 rounded-full transition-all duration-700"
                              style={{ width: `${getTimelineProgress(order.status)}%` }}
                            />
                          </div>

                          {TIMELINE_STEPS.map((step, idx) => {
                            const stepStatus = getStepStatus(order.status, idx);
                            return (
                              <div key={step} className="flex flex-col items-center gap-2 z-10 flex-1 min-w-0">
                                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                  stepStatus === 'completed' ? 'bg-neutral-950 text-white border-neutral-950' :
                                  stepStatus === 'active' ? 'bg-white border-neutral-900 text-neutral-900' :
                                  'bg-white border-neutral-300 text-neutral-400'
                                }`}>
                                  {stepStatus === 'completed' ? '✓' : idx + 1}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wide text-center leading-tight hidden sm:block ${stepStatus === 'upcoming' ? 'text-neutral-400' : 'text-neutral-700'}`}>
                                  {step}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Shipping address */}
                    <p className="text-sm text-neutral-500">
                      <span className="font-semibold text-neutral-800">Ship To:</span> {order.shipping_address}
                    </p>

                    {/* Items list */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-3">Items Ordered</span>
                      <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-100 rounded-2xl overflow-hidden">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3.5 flex-wrap">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {item.product ? (
                                <Link href={`/products/${item.product.id}`} className="text-sm text-neutral-900 font-medium hover:text-neutral-600 transition-colors truncate">
                                  {item.product.name}
                                </Link>
                              ) : (
                                <span className="text-sm text-neutral-400">Product Removed</span>
                              )}
                              {item.product?.brand && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full shrink-0">{item.product.brand.name}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 shrink-0 text-right">
                              <span className="text-sm text-neutral-500">{item.quantity} × ${parseFloat(item.price).toFixed(2)}</span>
                              <span className="text-sm font-semibold text-neutral-900">${parseFloat(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-neutral-100">
                      <div className="flex flex-wrap gap-2">
                        {!isCancelled && (
                          <button
                            className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider border border-neutral-200 rounded-full text-neutral-600 hover:bg-neutral-50 transition-colors"
                            onClick={() => handleViewInvoice(order.id)}
                          >
                            Download GST Invoice
                          </button>
                        )}
                        {(statusKey === 'pending' || statusKey === 'processing') && (
                          <button
                            className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider border border-red-200 rounded-full text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            Cancel Order
                          </button>
                        )}
                        {statusKey === 'completed' && !order.refund_status && (
                          <button
                            className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider border border-neutral-200 rounded-full text-neutral-600 hover:bg-neutral-50 transition-colors"
                            onClick={() => handleReturnOrder(order.id)}
                          >
                            Return & Refund
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-500">Grand Total</span>
                        <span className="font-serif text-2xl font-semibold text-neutral-900">${parseFloat(order.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BuyerOrders;
