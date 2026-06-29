import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { CheckCircle2, Package, Truck, Calendar, CreditCard, MapPinned, User2 } from 'lucide-react';
import { formatDateTime, formatStoredMoney } from '../utils/localization';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-sky-50 text-sky-700 border-sky-200',
  out_for_delivery: 'bg-violet-50 text-violet-700 border-violet-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200'
};
const RETURN_STATUS_STYLES = {
  requested: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
};

const TIMELINE_STEPS = ['Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
const STATUS_ORDER = ['pending', 'processing', 'shipped', 'out_for_delivery', 'completed'];
const CANCEL_REASONS = [
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Need to change shipping address',
  'Delivery is taking too long',
  'Want to change product or quantity',
  'Other',
];
const RETURN_REASONS = [
  'Damaged item received',
  'Wrong item delivered',
  'Item not as described',
  'Quality issue',
  'Missing parts or accessories',
  'Other',
];

export const BuyerOrders = () => {
  const { props, url } = usePage();
  const [orders, setOrders] = useState(props.buyerOrders || []);
  const [loading, setLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelOtherReason, setCancelOtherReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnOtherReason, setReturnOtherReason] = useState('');
  const [returnImage, setReturnImage] = useState(null);
  const [returnImageUploading, setReturnImageUploading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const searchParams = new URL(url || window.location.href, window.location.origin).searchParams;
  const isSuccessCheckout = searchParams.get('success') === 'true';

  useEffect(() => {
    setOrders(props.buyerOrders || []);
    setLoading(false);
  }, [props.buyerOrders]);

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

  const getStepStatus = (status, index) => {
    const currentIdx = STATUS_ORDER.indexOf(status.toLowerCase());
    if (currentIdx === -1) return 'upcoming';
    if (index < currentIdx) return 'completed';
    if (index === currentIdx) return 'active';
    return 'upcoming';
  };

  const handleCancelOrder = () => {
    if (!cancelTarget) return;
    const reasonNote = cancelReason === 'Other' ? cancelOtherReason.trim() : '';
    if (cancelReason === 'Other' && !reasonNote) return;

    setCancelLoading(true);
    router.post(`/orders/${cancelTarget.id}/cancel`, {
      reason: cancelReason,
      reason_note: reasonNote || null,
    }, {
      preserveScroll: true,
      preserveState: false,
      only: ['buyerOrders', 'flash'],
      onFinish: () => setCancelLoading(false),
      onSuccess: () => {
        setCancelTarget(null);
        setCancelReason(CANCEL_REASONS[0]);
        setCancelOtherReason('');
      },
    });
  };

  const handleReturnOrder = async () => {
    if (!returnTarget) return;
    const reasonNote = returnReason === 'Other' ? returnOtherReason.trim() : '';
    if (returnReason === 'Other' && !reasonNote) return;

    setReturnLoading(true);
    try {
      let imageUrl = null;

      if (returnImage) {
        setReturnImageUploading(true);
        const payload = new FormData();
        payload.append('image', returnImage);
        const response = await fetch('/media/upload', {
          method: 'POST',
          body: payload,
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          credentials: 'same-origin',
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Image upload failed');
        }
        imageUrl = data.url || null;
      }

      router.post(`/orders/${returnTarget.id}/return`, {
        reason: returnReason,
        reason_note: reasonNote || null,
        image_url: imageUrl,
      }, {
        preserveScroll: true,
        preserveState: false,
        only: ['buyerOrders', 'flash'],
        onFinish: () => {
          setReturnLoading(false);
          setReturnImageUploading(false);
        },
        onSuccess: () => {
          setReturnTarget(null);
          setReturnReason(RETURN_REASONS[0]);
          setReturnOtherReason('');
          setReturnImage(null);
        },
      });
    } catch (error) {
      setReturnLoading(false);
      setReturnImageUploading(false);
      window.alert(error.message || 'Failed to submit return request');
    }
  };

  const handleViewInvoice = orderId => window.open(`/orders/${orderId}/invoice`, '_blank', 'noopener,noreferrer');
  const getSellerCount = order => new Set((order.items || []).map(item => item.product?.user?.id).filter(Boolean)).size;

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50 selection:bg-neutral-950 selection:text-white text-neutral-950">
      <Navbar />

      <main className="flex-grow mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          <Link href="/" className="transition hover:text-neutral-950">Home</Link>
          <span className="text-neutral-300">/</span>
          <Link href="/profile?tab=orders" className="transition hover:text-neutral-950">Profile</Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-500">Orders</span>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-950">My Orders</span>
        </nav>

        {isSuccessCheckout && (
          <div className="mb-8 flex items-start gap-4 border-2 border-emerald-600 bg-emerald-50 p-6 shadow-[6px_6px_0_#059669]">
            <CheckCircle2 size={28} className="text-emerald-700 shrink-0" />
            <div>
              <h4 className="text-lg font-bold text-emerald-900">Order Placed Successfully!</h4>
              <p className="mt-1 text-sm font-medium text-emerald-800">
                Thank you for your purchase. The seller will fulfill your items and update logistics tracking here.
              </p>
            </div>
          </div>
        )}

        <div className="mb-10 flex flex-col gap-2 border-b-2 border-neutral-950 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-950">My Purchase History</h1>
          <span className="text-sm font-bold uppercase tracking-widest text-neutral-500">
            Total Orders: {orders.length}
          </span>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center font-bold text-neutral-500 uppercase tracking-widest">
            Loading order history...
          </div>
        ) : orders.length === 0 ? (
          <div className="border-2 border-neutral-950 bg-white p-12 text-center shadow-[10px_10px_0_#171717]">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center border-2 border-neutral-950 bg-neutral-100">
              <Package size={26} className="text-neutral-950" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-neutral-950">No orders found</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-600">You haven't placed any orders in MyStore yet.</p>
            <Link href="/" className="mt-6 inline-flex items-center justify-center border-2 border-neutral-950 bg-neutral-950 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-neutral-800">
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map(order => {
              const statusKey = String(order.status || '').toLowerCase();
              const statusCls = STATUS_STYLES[statusKey] || 'bg-neutral-100 text-neutral-600 border-neutral-200';
              const isCancelled = statusKey === 'cancelled';
              const hasReturnRequest = Boolean(order.return_request_status);
              const canRequestReturn = statusKey === 'completed' && !order.refund_status && !hasReturnRequest;
              const returnStatusCls = RETURN_STATUS_STYLES[String(order.return_request_status || '').toLowerCase()] || 'border-neutral-200 bg-neutral-100 text-neutral-600';

              return (
                <div key={order.id} className="border-2 border-neutral-950 bg-white shadow-[8px_8px_0_#171717]">
                  <div className="flex flex-col gap-4 border-b-2 border-neutral-950 bg-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-bold uppercase tracking-widest text-neutral-950">
                      Order ID: #{order.id}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center border-2 px-3 py-1 text-xs font-bold uppercase tracking-widest ${statusCls}`}>
                        {order.status}
                      </span>
                      {order.refund_status && (
                        <span className="inline-flex items-center border-2 border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-rose-700">
                          {order.refund_status}
                        </span>
                      )}
                      {hasReturnRequest && (
                        <span className={`inline-flex items-center border-2 px-3 py-1 text-xs font-bold uppercase tracking-widest ${returnStatusCls}`}>
                          Return {order.return_request_status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="grid gap-6 border-b-2 border-neutral-100 pb-8 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center border-2 border-neutral-950 bg-white">
                          <Calendar size={14} />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">Order Date</span>
                          <span className="mt-1 block text-sm font-bold text-neutral-950">{formatDateTime(order.created_at, {}, props)}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center border-2 border-neutral-950 bg-white">
                          <CreditCard size={14} />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">Payment</span>
                          <span className="mt-1 block text-sm font-bold text-neutral-950">{order.payment_method}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center border-2 border-neutral-950 bg-white">
                          <Truck size={14} />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">Logistics</span>
                          {order.shipping_carrier ? (
                            <span className="mt-1 block text-sm font-bold text-neutral-950">
                              <strong>{order.shipping_carrier}</strong> -{' '}
                              {order.tracking_number ? (
                                <a href={getTrackingUrl(order.shipping_carrier, order.tracking_number)} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
                                  {order.tracking_number}
                                </a>
                              ) : 'Awaiting ID'}
                            </span>
                          ) : (
                            <span className="mt-1 block text-sm font-medium text-neutral-500">Not yet shipped</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isCancelled && (
                      <div className="py-8">
                        <div className="relative mx-auto max-w-3xl">
                          <div className="absolute left-0 top-1/2 -mt-[1px] hidden w-full border-t-2 border-neutral-200 sm:block" />
                          <div className="relative flex flex-col gap-6 sm:flex-row sm:justify-between">
                            {TIMELINE_STEPS.map((step, idx) => {
                              const stepStatus = getStepStatus(String(order.status || ''), idx);
                              const isCompleted = stepStatus === 'completed';
                              const isActive = stepStatus === 'active';
                              return (
                                <div key={step} className="relative z-10 flex flex-row items-center gap-4 bg-white sm:flex-col sm:gap-2 sm:px-2">
                                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 font-bold text-xs ${isCompleted ? 'border-emerald-600 bg-emerald-500 text-white' : isActive ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-300 bg-white text-neutral-400'}`}>
                                    {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                                  </div>
                                  <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-neutral-950' : 'text-neutral-500'}`}>
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 grid gap-8 border-t-2 border-neutral-100 pt-8 lg:grid-cols-3">
                      <div>
                        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500">
                          <User2 size={14} /> Buyer
                        </div>
                        <div className="space-y-1 text-sm">
                          <strong className="block text-neutral-950">{order.buyer?.name || 'Buyer'}</strong>
                          <div className="text-neutral-600">{order.buyer?.email || '-'}</div>
                          <div className="text-neutral-600">{order.buyer_phone || order.buyer?.phone || 'Phone not available'}</div>
                        </div>
                      </div>

                      <div>
                        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500">
                          <MapPinned size={14} /> Shipping
                        </div>
                        <div className="space-y-1 text-sm text-neutral-600">
                          <strong className="block text-neutral-950">{order.city || 'City not set'}{order.state ? `, ${order.state}` : ''}</strong>
                          <div>{order.postal_code || 'Postal code pending'}{order.country ? ` | ${order.country}` : ''}</div>
                          <div>{order.shipping_address}</div>
                        </div>
                      </div>

                      <div>
                        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500">
                          <Truck size={14} /> Fulfillment
                        </div>
                        <div className="space-y-1 text-sm text-neutral-600">
                          <strong className="block text-neutral-950">{order.shipping_carrier || order.fulfillment_channel || 'Awaiting seller update'}</strong>
                          <div>{order.seller_shipping_acceptance_time || 'Acceptance time not shared yet'}</div>
                          <div>{getSellerCount(order)} seller{getSellerCount(order) === 1 ? '' : 's'} in this shipment</div>
                        </div>
                      </div>
                    </div>

                    {hasReturnRequest ? (
                      <div className="mt-8 border-t-2 border-neutral-100 pt-8">
                        <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-neutral-500">Return Request</span>
                        <div className="grid gap-4 rounded-none border-2 border-neutral-950 bg-neutral-50 p-4 sm:grid-cols-2">
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                            <strong className="mt-2 block text-sm text-neutral-950">{String(order.return_request_status || '').replace(/_/g, ' ')}</strong>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">Reason</span>
                            <strong className="mt-2 block text-sm text-neutral-950">{order.return_request_reason || 'Not shared'}</strong>
                          </div>
                          {order.return_request_note ? <div className="sm:col-span-2">
                              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">Buyer Note</span>
                              <p className="mt-2 text-sm leading-6 text-neutral-700">{order.return_request_note}</p>
                            </div> : null}
                          {order.return_review_note ? <div className="sm:col-span-2">
                              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">Seller Response</span>
                              <p className="mt-2 text-sm leading-6 text-neutral-700">{order.return_review_note}</p>
                            </div> : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-8 border-t-2 border-neutral-100 pt-8">
                      <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-neutral-500">Items Ordered</span>
                      <div className="divide-y-2 divide-neutral-100 border-2 border-neutral-950 bg-neutral-50">
                        {order.items.map(item => (
                          <div key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 flex-1">
                              {item.product ? (
                                <Link href={`/products/${item.product.id}`} className="text-sm font-bold text-neutral-950 hover:underline">
                                  {item.product.name}
                                </Link>
                              ) : (
                                <span className="text-sm font-bold text-neutral-500 line-through">Product Removed</span>
                              )}
                              {item.product?.brand && <span className="mt-1 block text-xs font-semibold uppercase tracking-widest text-neutral-500">{item.product.brand.name}</span>}
                            </div>
                            <div className="flex items-center gap-8 text-sm font-bold">
                              <span className="text-neutral-500">
                                {item.quantity} x {formatStoredMoney(parseFloat(item.price), item.currency || order.currency, props)}
                              </span>
                              <span className="text-neutral-950">
                                {formatStoredMoney(parseFloat(item.price * item.quantity), item.currency || order.currency, props)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col-reverse gap-4 border-t-2 border-neutral-950 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link href={`/profile/orders/my-orders/${order.id}`} className="border-2 border-neutral-950 bg-neutral-950 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-neutral-800">
                          View Order
                        </Link>
                        <button onClick={() => handleViewInvoice(order.id)} className="border-2 border-neutral-950 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-neutral-950 transition hover:bg-neutral-100">
                          Download Invoice
                        </button>
                        {(statusKey === 'pending' || statusKey === 'processing') && (
                          <button onClick={() => setCancelTarget(order)} className="border-2 border-rose-600 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-rose-600 transition hover:bg-rose-50">
                            Cancel Order
                          </button>
                        )}
                        {canRequestReturn && (
                          <button onClick={() => setReturnTarget(order)} className="border-2 border-neutral-950 bg-neutral-950 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-neutral-800">
                            Return & Refund
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Grand Total</span>
                        <span className="text-2xl font-black tracking-tight text-neutral-950">
                          {formatStoredMoney(parseFloat(order.total_amount), order.currency, props)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {cancelTarget ? (
        <CancelOrderModal
          reason={cancelReason}
          otherReason={cancelOtherReason}
          loading={cancelLoading}
          onReasonChange={setCancelReason}
          onOtherReasonChange={setCancelOtherReason}
          onClose={() => {
            setCancelTarget(null);
            setCancelReason(CANCEL_REASONS[0]);
            setCancelOtherReason('');
          }}
          onSubmit={handleCancelOrder}
        />
      ) : null}

      {returnTarget ? (
        <ReturnRequestModal
          reason={returnReason}
          otherReason={returnOtherReason}
          image={returnImage}
          loading={returnLoading}
          uploading={returnImageUploading}
          onReasonChange={setReturnReason}
          onOtherReasonChange={setReturnOtherReason}
          onImageChange={setReturnImage}
          onClose={() => {
            setReturnTarget(null);
            setReturnReason(RETURN_REASONS[0]);
            setReturnOtherReason('');
            setReturnImage(null);
          }}
          onSubmit={handleReturnOrder}
        />
      ) : null}
      <Footer />
    </div>
  );
};

const CancelOrderModal = ({ reason, otherReason, loading, onReasonChange, onOtherReasonChange, onClose, onSubmit }) => {
  const needsOtherReason = reason === 'Other';
  const disableSubmit = loading || (needsOtherReason && !otherReason.trim());

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-neutral-950/40 px-4 py-6" onClick={onClose}>
      <div className="w-full max-w-lg border-2 border-neutral-950 bg-neutral-50 p-6 shadow-[10px_10px_0_#171717]" onClick={(event) => event.stopPropagation()}>
        <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Cancel this order?</h3>
        <p className="mt-2 text-sm leading-7 text-neutral-600">Choose a reason below. This reason will be sent to the seller.</p>

        <div className="mt-5 space-y-3">
          {CANCEL_REASONS.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-3 border-2 border-neutral-950 bg-white px-4 py-3">
              <input
                type="radio"
                name="cancel-reason-list"
                value={option}
                checked={reason === option}
                onChange={(event) => onReasonChange(event.target.value)}
                className="h-4 w-4 accent-neutral-950"
              />
              <span className="text-sm font-medium text-neutral-950">{option}</span>
            </label>
          ))}
        </div>

        {needsOtherReason ? (
          <div className="mt-4">
            <Input
              label="Your Reason"
              as="textarea"
              rows={4}
              placeholder="Write your cancellation reason"
              value={otherReason}
              onChange={(event) => onOtherReasonChange(event.target.value)}
              required
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onClose} className="border-2 border-neutral-950 bg-white px-4 py-2 text-sm font-medium text-neutral-950">Keep Order</button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disableSubmit}
            className="inline-flex min-h-9 items-center justify-center gap-2 border border-rose-700 bg-rose-600 px-3.5 text-[13px] font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Cancelling...' : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReturnRequestModal = ({
  reason,
  otherReason,
  image,
  loading,
  uploading,
  onReasonChange,
  onOtherReasonChange,
  onImageChange,
  onClose,
  onSubmit,
}) => {
  const needsOtherReason = reason === 'Other';
  const disableSubmit = loading || uploading || (needsOtherReason && !otherReason.trim());

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-neutral-950/40 px-4 py-6" onClick={onClose}>
      <div className="w-full max-w-2xl border-2 border-neutral-950 bg-neutral-50 p-6 shadow-[10px_10px_0_#171717]" onClick={(event) => event.stopPropagation()}>
        <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Request Return & Refund</h3>
        <p className="mt-2 text-sm leading-7 text-neutral-600">Tell the seller what went wrong. You can also attach an image, but it is optional.</p>

        <div className="mt-5 grid gap-3">
          {RETURN_REASONS.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-3 border-2 border-neutral-950 bg-white px-4 py-3">
              <input
                type="radio"
                name="return-reason-list"
                value={option}
                checked={reason === option}
                onChange={(event) => onReasonChange(event.target.value)}
                className="h-4 w-4 accent-neutral-950"
              />
              <span className="text-sm font-medium text-neutral-950">{option}</span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <Input
            label={needsOtherReason ? 'Reason Details' : 'Additional Details'}
            as="textarea"
            rows={4}
            placeholder="Add more detail for the seller"
            value={otherReason}
            onChange={(event) => onOtherReasonChange(event.target.value)}
            required={needsOtherReason}
          />
        </div>

        <div className="mt-4">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Attach Image (Optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => onImageChange(event.target.files?.[0] || null)}
              className="block w-full border-2 border-neutral-950 bg-white px-4 py-3 text-sm text-neutral-950"
            />
          </label>
          {image ? <p className="mt-2 text-xs text-neutral-500">{image.name}</p> : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onClose} className="border-2 border-neutral-950 bg-white px-4 py-2 text-sm font-medium text-neutral-950">Keep Order</button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disableSubmit}
            className="inline-flex min-h-9 items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-3.5 text-[13px] font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? 'Uploading image...' : loading ? 'Submitting...' : 'Submit Return Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyerOrders;
