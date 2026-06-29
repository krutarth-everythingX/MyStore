import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { Input } from '../components/Input';
import { Calendar, CreditCard, MapPin, Package, Truck } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatDateTime, formatStoredMoney } from '../utils/localization';

const ORDER_STATUS_CLASS = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  processing: 'border-sky-200 bg-sky-50 text-sky-700',
  shipped: 'border-sky-200 bg-sky-50 text-sky-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
};

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Need to change shipping address',
  'Delivery is taking too long',
  'Want to change product or quantity',
  'Other',
];

const getOrderSellerCount = (order) => new Set((order?.items || []).map((item) => item.product?.user?.id).filter(Boolean)).size;

export const BuyerOrderDetails = () => {
  const { props, url } = usePage();
  const order = props.buyerOrder;
  const searchParams = new URL(url || window.location.href, window.location.origin).searchParams;
  const showSuccessBanner = searchParams.get('success') === 'true';
  const sellerCount = getOrderSellerCount(order);
  const statusKey = String(order.status || '').toLowerCase();
  const canCancel = statusKey === 'pending' || statusKey === 'processing';
  const hasReturnRequest = Boolean(order.return_request_status);
  const canReturn = statusKey === 'completed' && !order.refund_status && !hasReturnRequest;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelOtherReason, setCancelOtherReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('Damaged item received');
  const [returnOtherReason, setReturnOtherReason] = useState('');
  const [returnImage, setReturnImage] = useState(null);
  const [returnImageUploading, setReturnImageUploading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);

  const handleViewInvoice = () => {
    window.open(`/orders/${order.id}/invoice`, '_blank', 'noopener,noreferrer');
  };

  const handleCancelOrder = () => {
    const reasonNote = cancelReason === 'Other' ? cancelOtherReason.trim() : '';
    if (cancelReason === 'Other' && !reasonNote) return;

    setCancelLoading(true);
    router.post(`/orders/${order.id}/cancel`, {
      reason: cancelReason,
      reason_note: reasonNote || null,
    }, {
      preserveScroll: true,
      preserveState: false,
      onFinish: () => setCancelLoading(false),
      onSuccess: () => {
        setShowCancelModal(false);
        setCancelReason(CANCEL_REASONS[0]);
        setCancelOtherReason('');
        router.reload({ only: ['buyerOrder', 'buyerOrders', 'flash'] });
      },
    });
  };

  const handleReturnOrder = async () => {
    const reasonNote = returnReason === 'Other' ? returnOtherReason.trim() : returnOtherReason.trim();
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

      router.post(`/orders/${order.id}/return`, {
        reason: returnReason,
        reason_note: reasonNote || null,
        image_url: imageUrl,
      }, {
        preserveScroll: true,
        preserveState: false,
        onFinish: () => {
          setReturnLoading(false);
          setReturnImageUploading(false);
        },
        onSuccess: () => {
          setShowReturnModal(false);
          setReturnReason('Damaged item received');
          setReturnOtherReason('');
          setReturnImage(null);
          router.reload({ only: ['buyerOrder', 'buyerOrders', 'flash'] });
        },
      });
    } catch (error) {
      setReturnLoading(false);
      setReturnImageUploading(false);
      window.alert(error.message || 'Failed to submit return request');
    }
  };

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-950">
      <Navbar opaque />

      <main>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Profile', href: '/profile?tab=orders' },
            { label: 'Orders', href: '/profile?tab=orders' },
            { label: 'My Orders', href: '/profile/orders/my-orders' },
            { label: `Order #${order.id}` },
          ]} />
          {showSuccessBanner ? (
            <div className="mt-6 flex items-start gap-4 border-2 border-emerald-600 bg-emerald-50 p-5 shadow-[6px_6px_0_#059669]">
              <Package size={24} className="shrink-0 text-emerald-700" />
              <div>
                <strong className="block text-base font-semibold text-emerald-900">Order placed successfully.</strong>
                <span className="mt-1 block text-sm text-emerald-800">You can track the status, shipment updates, and order details from this page.</span>
              </div>
            </div>
          ) : null}

          <div className="mt-6 space-y-6">
            <div className="border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717] sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">Order #{order.id}</h1>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm leading-7 text-neutral-600">
                    Placed on {formatDateTime(order.created_at, {}, props)} and currently managed from your MyStore account.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={() => router.visit('/profile/orders/my-orders')}>Back to My Orders</Button>
                  <Button type="button" variant="outline" onClick={handleViewInvoice}>Download GST Invoice</Button>
                  {canCancel ? (
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      className="inline-flex min-h-9 items-center justify-center gap-2 border border-rose-700 bg-rose-600 px-3.5 text-[13px] font-medium text-white transition hover:bg-rose-700"
                    >
                      Cancel Order
                    </button>
                  ) : null}
                  {canReturn ? <Button type="button" variant="outline" onClick={() => setShowReturnModal(true)}>Return & Refund</Button> : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard icon={CreditCard} title="Payment" lines={[order.payment_method || 'Not available', `Grand Total: ${formatStoredMoney(parseFloat(order.total_amount), order.currency, props)}`]} />
              <InfoCard icon={Truck} title="Shipping" iconClassName="scale-[0.84]" lines={[order.shipping_carrier || order.fulfillment_channel || 'Awaiting shipment', order.tracking_number || 'Tracking number pending']} />
              <InfoCard icon={MapPin} title="Delivery Address" lines={[order.shipping_address || 'Address unavailable', `${order.city || ''}${order.state ? `, ${order.state}` : ''}${order.country ? `, ${order.country}` : ''}`.trim() || 'Location unavailable']} />
              <InfoCard icon={Package} title="Order Mix" lines={[`${order.items?.length || 0} item${order.items?.length === 1 ? '' : 's'} in this order`, `${sellerCount} seller${sellerCount === 1 ? '' : 's'} fulfilling this order`]} />
            </div>

            {order.return_request_status ? (
              <PanelCard title="Return Request">
                <SummaryRow label="Status" value={String(order.return_request_status).replace(/_/g, ' ')} icon={Package} />
                <SummaryRow label="Reason" value={order.return_request_reason || 'Not shared'} icon={Truck} />
                {order.return_request_note ? <p className="text-sm leading-7 text-neutral-700">{order.return_request_note}</p> : null}
                {order.return_request_image_url ? <a href={order.return_request_image_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-neutral-950 underline">View attached image</a> : null}
                {order.return_review_note ? <p className="text-sm leading-7 text-neutral-700">Seller note: {order.return_review_note}</p> : null}
              </PanelCard>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.8fr)]">
              <div className="border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717] sm:p-6">
                <div className="border-b-2 border-neutral-950 pb-4">
                  <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Items Ordered</h2>
                </div>
                <div className="mt-5 space-y-3">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex flex-col gap-4 border-2 border-neutral-950 bg-neutral-50 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-neutral-950">
                          {item.product ? <Link href={`/products/${item.product.id}`} className="hover:underline">{item.product.name}</Link> : 'Product removed'}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-500">
                          <span>Qty {item.quantity}</span>
                          {item.product?.sku ? <span>SKU {item.product.sku}</span> : null}
                          {item.product?.brand?.name ? <span>{item.product.brand.name}</span> : null}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-neutral-950">
                        {formatStoredMoney(parseFloat(item.price * item.quantity), item.currency || order.currency, props)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <PanelCard title="Order Summary">
                  <SummaryRow label="Order Date" value={formatDateTime(order.created_at, { includeTime: false }, props)} icon={Calendar} />
                  <SummaryRow label="Payment Method" value={order.payment_method || 'Not available'} icon={CreditCard} />
                  <SummaryRow label="Carrier" value={order.shipping_carrier || order.fulfillment_channel || 'Awaiting shipment'} icon={Truck} />
                  <SummaryRow label="Tracking" value={order.tracking_number || 'Tracking number pending'} icon={Package} />
                </PanelCard>

                <PanelCard title="Ship To">
                  <p className="text-sm leading-7 text-neutral-700">{order.shipping_address || 'Address unavailable'}</p>
                  <p className="mt-3 text-sm text-neutral-500">
                    {[order.city, order.state, order.country].filter(Boolean).join(', ') || 'Location unavailable'}
                  </p>
                </PanelCard>
              </div>
            </div>
          </div>
        </div>

        {showCancelModal ? (
          <CancelOrderModal
            reason={cancelReason}
            otherReason={cancelOtherReason}
            loading={cancelLoading}
            onReasonChange={setCancelReason}
            onOtherReasonChange={setCancelOtherReason}
            onClose={() => {
              setShowCancelModal(false);
              setCancelReason(CANCEL_REASONS[0]);
              setCancelOtherReason('');
            }}
            onSubmit={handleCancelOrder}
          />
        ) : null}

        {showReturnModal ? (
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
              setShowReturnModal(false);
              setReturnReason('Damaged item received');
              setReturnOtherReason('');
              setReturnImage(null);
            }}
            onSubmit={handleReturnOrder}
          />
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

const StatusBadge = ({ status }) => (
  <span className={cn('inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]', ORDER_STATUS_CLASS[String(status || '').toLowerCase()] || 'border-neutral-950 bg-white text-neutral-700')}>
    {status}
  </span>
);

const InfoCard = ({ icon: Icon, title, lines, iconClassName = '' }) => (
  <div className="border-2 border-neutral-950 bg-white p-4 shadow-[6px_6px_0_#171717]">
    <div className="flex items-start gap-3">
      <div className="inline-flex h-10 w-10 items-center justify-center border-2 border-neutral-950 bg-neutral-100 p-2">
        <Icon size={16} className={iconClassName} />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{title}</div>
        {lines.map((line) => <div key={line} className="mt-2 break-words text-sm text-neutral-700">{line}</div>)}
      </div>
    </div>
  </div>
);

const PanelCard = ({ title, children }) => (
  <div className="border-2 border-neutral-950 bg-white p-5 shadow-[8px_8px_0_#171717]">
    <div className="border-b-2 border-neutral-950 pb-3">
      <h3 className="text-lg font-semibold tracking-tight text-neutral-950">{title}</h3>
    </div>
    <div className="mt-4 space-y-4">{children}</div>
  </div>
);

const SummaryRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 border-2 border-neutral-950 bg-neutral-50 p-3">
    <div className="inline-flex h-9 w-9 items-center justify-center border-2 border-neutral-950 bg-white">
      <Icon size={14} />
    </div>
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</div>
      <div className="mt-1 text-sm text-neutral-700">{value}</div>
    </div>
  </div>
);

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
                name="cancel-reason"
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
          <Button type="button" variant="secondary" onClick={onClose}>Keep Order</Button>
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

const ReturnRequestModal = ({ reason, otherReason, image, loading, uploading, onReasonChange, onOtherReasonChange, onImageChange, onClose, onSubmit }) => {
  const RETURN_REASONS = [
    'Damaged item received',
    'Wrong item delivered',
    'Item not as described',
    'Quality issue',
    'Missing parts or accessories',
    'Other',
  ];
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
                name="return-reason-detail"
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
          <Button type="button" variant="secondary" onClick={onClose}>Keep Order</Button>
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

export default BuyerOrderDetails;
