import React, { useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ArrowDownToLine, CheckCircle2, Download, Eye, Filter, MapPinned, Package, Search, ShoppingBag, Truck, User, X } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { SellerActionButtons, SellerCard, SellerEmptyState, SellerGridBody, SellerGridCell, SellerGridHead, SellerGridRow, SellerIconButton, SellerModalBackdrop, SellerModalCard, SellerPageHeader, SellerPageShell, SellerPaginationCard, SellerPill, SellerSearchField, SellerSelect, SellerSortHeader, SellerTablePaginationBar, SellerTableSurface, SellerTableWrap, SellerToolbar, SellerToolbarActions } from '../components/seller-workspace';
import { convertMoney, formatDateTime, formatMoney } from '../utils/localization';
import { getNextSort, sortRows } from '../utils/tableSorting';
const STATUS_ORDER = ['pending', 'processing', 'shipped', 'out_for_delivery', 'completed', 'cancelled'];
const number = value => new Intl.NumberFormat('en-US').format(Number(value || 0));
const toTitle = value => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const formatOrderMoney = (amount, sourceCurrency, props) => {
  const viewerCurrency = props.localization?.current?.currency || 'USD';
  const viewerLocale = props.localization?.current?.locale || 'en-US';
  const converted = convertMoney(amount, sourceCurrency || 'USD', viewerCurrency, props);
  return formatMoney(converted, {
    currency: viewerCurrency,
    locale: viewerLocale
  }, props);
};
const statusTone = status => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'cancelled') return 'danger';
  if (normalized === 'completed') return 'success';
  if (normalized === 'out_for_delivery') return 'blue';
  if (normalized === 'shipped') return 'blue';
  if (normalized === 'processing') return 'warn';
  if (normalized === 'pending') return 'danger';
  return 'neutral';
};
const returnStatusTone = status => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved') return 'success';
  if (normalized === 'rejected') return 'danger';
  if (normalized === 'requested') return 'warn';
  return 'neutral';
};
const getOrderAttentionSummary = order => {
  if (order.return_request_status) {
    return {
      label: `Return ${toTitle(order.return_request_status)}`,
      tone: returnStatusTone(order.return_request_status)
    };
  }

  if (String(order.status || '').toLowerCase() === 'cancelled' && order.cancellation_reason) {
    return {
      label: 'Buyer Cancelled',
      tone: 'danger'
    };
  }

  return null;
};
const OrderDetailRow = ({
  label,
  value
}) => <div className="flex items-start justify-between gap-4 border-b border-neutral-200 py-3 last:border-b-0 last:pb-0 first:pt-0">
    <span className="text-sm text-neutral-500">{label}</span>
    <strong className="text-right text-sm font-semibold text-neutral-950">{value}</strong>
  </div>;
const ReturnRequestPanel = ({ order, reviewNote, setReviewNote, approveReturn, rejectReturn, processingReturn }) => {
  if (!order.return_request_status) {
    return null;
  }

  const isPending = order.return_request_status === 'requested';

  return <article className="space-y-4 border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-950">
          <Package size={16} />
        </span>
        <div>
          <strong className="block text-base font-semibold text-neutral-950">Return & Refund Request</strong>
          <span className="text-sm text-neutral-500">Buyer-submitted request details and seller review</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <OrderDetailRow label="Request Status" value={toTitle(order.return_request_status)} />
        <OrderDetailRow label="Reason" value={order.return_request_reason || '-'} />
      </div>

      {order.return_request_note ? <div className="rounded-none border border-neutral-200 bg-neutral-50 p-4">
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Buyer Note</span>
          <p className="mt-2 text-sm leading-6 text-neutral-700">{order.return_request_note}</p>
        </div> : null}

      {order.return_request_image_url ? <div className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Buyer Image</span>
          <a href={order.return_request_image_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden border border-neutral-200 bg-neutral-50">
            <img src={order.return_request_image_url} alt="Buyer issue attachment" className="max-h-72 w-full object-contain" />
          </a>
        </div> : null}

      <div className="space-y-2">
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Seller Review Note</span>
        <textarea
          value={reviewNote}
          onChange={event => setReviewNote(event.target.value)}
          rows={4}
          className="min-h-28 w-full rounded-none border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none"
          placeholder="Add a note for the buyer about this review decision"
          disabled={!isPending || processingReturn}
        />
      </div>

      {isPending ? <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={approveReturn} disabled={processingReturn}>
            {processingReturn ? 'Processing...' : 'Approve Return'}
          </Button>
          <Button variant="outline" onClick={rejectReturn} disabled={processingReturn}>
            Reject Return
          </Button>
        </div> : order.return_review_note ? <div className="rounded-none border border-neutral-200 bg-neutral-50 p-4">
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Final Review Note</span>
          <p className="mt-2 text-sm leading-6 text-neutral-700">{order.return_review_note}</p>
        </div> : null}
    </article>;
};
const ModalFrame = ({
  title,
  icon: Icon,
  children,
  actions,
  onClose,
  className = 'max-w-4xl'
}) => <SellerModalBackdrop onClose={onClose}>
    <SellerModalCard className={className} onMouseDown={event => event.stopPropagation()}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-white text-neutral-950">
              <Icon size={18} />
            </span>}
          <div className="min-w-0">
            <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{title}</h3>
          </div>
        </div>
        <SellerIconButton onClick={onClose} aria-label={`Close ${title}`}>
          <X size={18} />
        </SellerIconButton>
      </div>

      <div>{children}</div>

      {actions && <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">{actions}</div>}
      </div>
    </SellerModalCard>
  </SellerModalBackdrop>;
const FilterModal = ({
  filters,
  setFilters,
  applyFilters,
  resetFilters,
  closeModal,
  carriers
}) => <ModalFrame title="Filter Orders" icon={Filter} onClose={closeModal} className="max-w-3xl" actions={<>
        <Button variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={resetFilters}>Reset</Button>
        <Button variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={applyFilters}>Apply Filters</Button>
      </>}>
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Order Filters</span>
        <p className="text-sm leading-6 text-neutral-500">Filter orders by status, carrier, order date range, and payment method.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
          <SellerSelect className="min-h-12 rounded-none border border-neutral-200 px-4 shadow-none" value={filters.status} onChange={event => setFilters(current => ({
        ...current,
        status: event.target.value
      }))}>
          <option value="all">All Statuses</option>
          {STATUS_ORDER.map(status => <option key={status} value={status}>{toTitle(status)}</option>)}
        </SellerSelect>
      </label>

      <label className="space-y-2">
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Carrier</span>
        <SellerSelect className="min-h-12 rounded-none border border-neutral-200 px-4 shadow-none" value={filters.carrier} onChange={event => setFilters(current => ({
        ...current,
        carrier: event.target.value
      }))}>
          <option value="all">All Carriers</option>
          {carriers.map(carrier => <option key={carrier} value={carrier}>{carrier}</option>)}
        </SellerSelect>
      </label>

      <label className="space-y-2">
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">From Date</span>
        <input className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none" type="date" value={filters.dateFrom} onChange={event => setFilters(current => ({
        ...current,
        dateFrom: event.target.value
      }))} />
      </label>

      <label className="space-y-2">
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">To Date</span>
        <input className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none" type="date" value={filters.dateTo} onChange={event => setFilters(current => ({
        ...current,
        dateTo: event.target.value
      }))} />
      </label>

      <label className="space-y-2 md:col-span-2 xl:col-span-1">
        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Payment Method</span>
        <SellerSelect className="min-h-12 rounded-none border border-neutral-200 px-4 shadow-none" value={filters.paymentMethod} onChange={event => setFilters(current => ({
        ...current,
        paymentMethod: event.target.value
      }))}>
          <option value="all">All Methods</option>
          <option value="Credit Card">Credit Card</option>
          <option value="COD">COD</option>
        </SellerSelect>
      </label>
    </div>
    </div>
  </ModalFrame>;
const OrderDetailsModal = ({
  order,
  props,
  closeModal,
  fulfillmentState,
  setField,
  updateOrder,
  carriers,
  openShipping,
  openInvoice
}) => {
  const sellerTotal = order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const [reviewNote, setReviewNote] = useState(order.return_review_note || '');
  const [processingReturn, setProcessingReturn] = useState(false);
  const approveReturn = () => {
    setProcessingReturn(true);
    router.post(`/seller/orders/${order.id}/returns/approve`, {
      review_note: reviewNote || null
    }, {
      preserveScroll: true,
      preserveState: false,
      only: ['sellerOrders', 'sellerCarriers', 'sellerFulfillmentChannels', 'flash'],
      onFinish: () => setProcessingReturn(false),
      onSuccess: () => closeModal()
    });
  };
  const rejectReturn = () => {
    setProcessingReturn(true);
    router.post(`/seller/orders/${order.id}/returns/reject`, {
      review_note: reviewNote || null
    }, {
      preserveScroll: true,
      preserveState: false,
      only: ['sellerOrders', 'sellerCarriers', 'sellerFulfillmentChannels', 'flash'],
      onFinish: () => setProcessingReturn(false),
      onSuccess: () => closeModal()
    });
  };
  return <ModalFrame title={`Order #${order.id}`} icon={Eye} onClose={closeModal} className="max-w-5xl max-h-[calc(100vh-3rem)] overflow-y-auto" actions={<>
          <Button variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={openInvoice}>
            <Download size={15} />
            Invoice
          </Button>
          <Button variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={openShipping}>
            <MapPinned size={15} />
            Shipping Slip
          </Button>
          <Button variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => updateOrder(order.id)}>
            <CheckCircle2 size={15} />
            Save Fulfillment
          </Button>
        </>}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="border border-neutral-200 bg-white px-4 py-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Invoice</span>
            <strong className="mt-2 block text-base font-semibold text-neutral-950">{order.invoice_number || 'Invoice pending'}</strong>
          </article>
          <article className="border border-neutral-200 bg-white px-4 py-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Order Date</span>
            <strong className="mt-2 block text-base font-semibold text-neutral-950">{formatDateTime(order.created_at, {
            includeTime: true
          }, props)}</strong>
          </article>
          <article className="border border-neutral-200 bg-white px-4 py-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
            <div className="mt-2">
              <SellerPill tone={statusTone(order.status)}>{toTitle(order.status)}</SellerPill>
            </div>
          </article>
          <article className="border border-neutral-200 bg-white px-4 py-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Order Total</span>
            <strong className="mt-2 block text-base font-semibold text-neutral-950">{formatOrderMoney(sellerTotal, order.currency, props)}</strong>
          </article>
        </div>

        {order.cancellation_reason ? <article className="space-y-4 border border-neutral-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-950">
                <X size={16} />
              </span>
              <div>
                <strong className="block text-base font-semibold text-neutral-950">Buyer Cancellation</strong>
                <span className="text-sm text-neutral-500">Reason shared by the buyer when this order was cancelled</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <OrderDetailRow label="Reason" value={order.cancellation_reason || '-'} />
              <OrderDetailRow label="Cancelled At" value={order.cancelled_at ? formatDateTime(order.cancelled_at, {
              includeTime: true
            }, props) : '-'} />
            </div>

            {order.cancellation_reason_note ? <div className="rounded-none border border-neutral-200 bg-neutral-50 p-4">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Buyer Note</span>
                <p className="mt-2 text-sm leading-6 text-neutral-700">{order.cancellation_reason_note}</p>
              </div> : null}
          </article> : null}

        <div className="grid gap-4 xl:grid-cols-3">
          <article className="space-y-4 border border-neutral-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-950">
                <User size={16} />
              </span>
              <div>
                <strong className="block text-base font-semibold text-neutral-950">Buyer & Delivery</strong>
                <span className="text-sm text-neutral-500">Customer and shipping details</span>
              </div>
            </div>
            <div className="space-y-3">
              <OrderDetailRow label="Buyer" value={order.buyer?.name || 'Buyer'} />
              <OrderDetailRow label="Email" value={order.buyer?.email || '-'} />
              <OrderDetailRow label="Phone" value={order.buyer_phone || order.buyer?.phone || '-'} />
              <OrderDetailRow label="Payment" value={order.payment_method || '-'} />
              <div className="space-y-1 border-t border-neutral-200 pt-3">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Ship To</span>
                <strong className="block text-sm font-medium text-neutral-950">{order.shipping_address || '-'}</strong>
              </div>
            </div>
          </article>

          <article className="space-y-4 border border-neutral-200 bg-white p-4 xl:col-span-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-950">
                <Package size={16} />
              </span>
              <div>
                <strong className="block text-base font-semibold text-neutral-950">Order Items</strong>
                <span className="text-sm text-neutral-500">Products included in this order</span>
              </div>
            </div>
            <div className="space-y-3">
              {order.items.map(item => <div key={item.id} className="flex items-start justify-between gap-4 border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-semibold text-neutral-950">{item.product?.name || 'Removed Product'}</strong>
                    <span className="mt-1 block truncate text-xs text-neutral-500">{item.product?.sku || 'SKU unavailable'}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-medium text-neutral-700">x{item.quantity}</span>
                    <strong className="mt-1 block text-sm font-semibold text-neutral-950">{formatOrderMoney(Number(item.price || 0) * Number(item.quantity || 0), item.currency || order.currency, props)}</strong>
                  </div>
                </div>)}
            </div>
          </article>
        </div>

        <article className="space-y-4 border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-950">
              <Truck size={16} />
            </span>
            <div>
              <strong className="block text-base font-semibold text-neutral-950">Fulfillment</strong>
              <span className="text-sm text-neutral-500">Update status, carrier, and tracking</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
              <SellerSelect className="min-h-12 rounded-none border border-neutral-200 px-4 shadow-none" value={fulfillmentState[order.id]?.status || 'pending'} onChange={event => setField(order.id, 'status', event.target.value)}>
                {STATUS_ORDER.map(status => <option key={status} value={status}>{toTitle(status)}</option>)}
              </SellerSelect>
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Carrier</span>
              <SellerSelect className="min-h-12 rounded-none border border-neutral-200 px-4 shadow-none" value={fulfillmentState[order.id]?.carrier || carriers[0] || 'Seller Fulfilled'} onChange={event => setField(order.id, 'carrier', event.target.value)}>
                {(carriers.length ? carriers : ['Seller Fulfilled']).map(carrier => <option key={carrier} value={carrier}>{carrier}</option>)}
              </SellerSelect>
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Acceptance Time</span>
              <input className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none" type="text" placeholder="e.g. 2 hours" value={fulfillmentState[order.id]?.acceptanceTime || ''} onChange={event => setField(order.id, 'acceptanceTime', event.target.value)} />
            </label>

            <label className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Tracking Number</span>
              <input className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none" type="text" placeholder="Enter tracking number" value={fulfillmentState[order.id]?.trackingNumber || ''} onChange={event => setField(order.id, 'trackingNumber', event.target.value)} />
            </label>
          </div>
        </article>

        <ReturnRequestPanel
          order={order}
          reviewNote={reviewNote}
          setReviewNote={setReviewNote}
          approveReturn={approveReturn}
          rejectReturn={rejectReturn}
          processingReturn={processingReturn}
        />
      </div>
    </ModalFrame>;
};
const InvoiceModal = ({
  order,
  props,
  closeModal
}) => {
  const subtotal = order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  return <ModalFrame title="Tax Invoice Preview" icon={ArrowDownToLine} onClose={closeModal} className="max-w-5xl max-h-[calc(100vh-3rem)] overflow-y-auto" actions={<>
          <Button variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={closeModal}>Close</Button>
          <a className="inline-flex min-h-10 items-center gap-2 border border-neutral-200 bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800" href={`/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
            <Download size={15} />
            Download Invoice
          </a>
        </>}>
      <div className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="border border-neutral-200 bg-white p-4">
            <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Tax Invoice</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">TAX INVOICE</h2>
            <p className="mt-2 max-w-xl text-sm leading-5 text-neutral-500">Preview before downloading the final invoice document.</p>
          </article>

          <article className="border border-neutral-200 bg-neutral-100 p-4">
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Seller</span>
            <strong className="mt-2 block text-base font-semibold text-neutral-950">{order.items[0]?.product?.user?.brand_name || 'MyStore Seller'}</strong>
            <p className="mt-2 text-sm leading-5 text-neutral-600">{order.items[0]?.product?.user?.address || 'Seller address not configured'}</p>
          </article>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[['Invoice No', order.invoice_number || `INV-${order.id}`], ['Order ID', `#${order.id}`], ['Date', formatDateTime(order.created_at, {
          includeTime: true
        }, props)], ['Supply', `${order.state || '-'}${order.country ? `, ${order.country}` : ''}`]].map(([label, value]) => <article key={label} className="border border-neutral-200 bg-white px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</span>
              <strong className="mt-2 block text-sm font-semibold text-neutral-950">{value}</strong>
            </article>)}
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <article className="border border-neutral-200 bg-white p-4">
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Bill To</span>
            <strong className="mt-2 block text-base font-semibold text-neutral-950">{order.buyer?.name || 'Buyer'}</strong>
            <p className="mt-2 text-sm leading-5 text-neutral-600">{order.shipping_address}</p>
          </article>

          <article className="border border-neutral-200 bg-white p-4">
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Payment</span>
            <strong className="mt-2 block text-base font-semibold text-neutral-950">{order.payment_method || '-'}</strong>
            <p className="mt-2 text-sm leading-5 text-neutral-600">{order.buyer_phone || order.buyer?.phone || 'Phone unavailable'}</p>
          </article>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-3">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Items</span>
                <strong className="mt-2 block text-base font-semibold text-neutral-950">Order Breakdown</strong>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {order.items.map(item => <div key={item.id} className="flex items-start justify-between gap-4 border border-neutral-200 bg-neutral-50 px-4 py-2.5">
                <div className="min-w-0">
                  <strong className="block text-sm font-semibold text-neutral-950">{item.product?.name || 'Removed Product'}</strong>
                  <span className="mt-1 block text-xs text-neutral-500">{item.product?.sku || 'SKU unavailable'}</span>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-medium text-neutral-700">x{item.quantity}</span>
                  <strong className="mt-1 block text-sm font-semibold text-neutral-950">{formatOrderMoney(Number(item.price || 0) * Number(item.quantity || 0), item.currency || order.currency, props)}</strong>
                </div>
              </div>)}
            </div>
          </article>

          <article className="border border-neutral-200 bg-white p-4">
            <div className="border-b border-neutral-200 pb-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Summary</span>
              <strong className="mt-2 block text-base font-semibold text-neutral-950">Invoice Totals</strong>
            </div>

            <div className="mt-3">
              <OrderDetailRow label="Subtotal" value={formatOrderMoney(subtotal, order.currency, props)} />
              <OrderDetailRow label="Shipping" value={formatOrderMoney(Number(order.shipping_cost || 0), order.currency, props)} />
              {!!Number(order.discount_amount || 0) && <OrderDetailRow label="Discount" value={`-${formatOrderMoney(Number(order.discount_amount || 0), order.currency, props)}`} />}
              {!!Number(order.cgst || 0) && <OrderDetailRow label="CGST" value={formatOrderMoney(Number(order.cgst || 0), order.currency, props)} />}
              {!!Number(order.sgst || 0) && <OrderDetailRow label="SGST" value={formatOrderMoney(Number(order.sgst || 0), order.currency, props)} />}
              {!!Number(order.igst || 0) && <OrderDetailRow label="IGST" value={formatOrderMoney(Number(order.igst || 0), order.currency, props)} />}
              <div className="mt-3 flex items-start justify-between gap-4 border-t border-neutral-200 pt-3">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-500">Total</span>
                <strong className="text-right text-lg font-semibold text-neutral-950">{formatOrderMoney(Number(order.total_amount || 0), order.currency, props)}</strong>
              </div>
            </div>
          </article>
        </div>
      </div>
    </ModalFrame>;
};
const ShippingModal = ({
  order,
  props,
  closeModal
}) => <ModalFrame title="Shipping Detail" icon={MapPinned} onClose={closeModal} className="max-w-5xl" actions={<>
        <Button variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={closeModal}>Close</Button>
        <a className="inline-flex min-h-10 items-center gap-2 border border-neutral-200 bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800" href={`/orders/${order.id}/shipping-slip`} target="_blank" rel="noopener noreferrer">
          <Download size={15} />
          Download Slip
        </a>
      </>}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[['Order ID', `#${order.id}`], ['Buyer', order.buyer?.name || 'Buyer'], ['Carrier', order.shipping_carrier || order.fulfillment_channel || 'Seller Fulfilled'], ['Tracking', order.tracking_number || 'Pending']].map(([label, value]) => <article key={label} className="border border-neutral-200 bg-white px-4 py-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</span>
            <strong className="mt-2 block text-base font-semibold text-neutral-950">{value}</strong>
          </article>)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="border border-neutral-200 bg-white p-5">
          <div className="border-b border-neutral-200 pb-4">
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Shipping Address</span>
            <strong className="mt-2 block text-lg font-semibold text-neutral-950">{order.buyer?.name || 'Buyer'}</strong>
          </div>
          <p className="mt-4 text-sm leading-7 text-neutral-700">{order.shipping_address}</p>
        </article>

        <article className="border border-neutral-200 bg-neutral-100 p-5">
          <div className="border-b border-neutral-200 pb-4">
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Dispatch Notes</span>
            <strong className="mt-2 block text-lg font-semibold text-neutral-950">{order.seller_shipping_acceptance_time || '2 hours'}</strong>
          </div>
          <p className="mt-4 text-sm leading-7 text-neutral-700">{formatDateTime(order.created_at, {
          includeTime: true
        }, props)}</p>
        </article>
      </div>

      <article className="border border-neutral-200 bg-white p-5">
        <div className="border-b border-neutral-200 pb-4">
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Packed Items</span>
          <strong className="mt-2 block text-lg font-semibold text-neutral-950">Shipment Contents</strong>
        </div>

        <div className="mt-4 space-y-3">
          {order.items.map(item => <div key={item.id} className="flex items-start justify-between gap-4 border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="min-w-0">
                <strong className="block text-sm font-semibold text-neutral-950">{item.product?.name || 'Removed Product'}</strong>
                <span className="mt-1 block text-xs text-neutral-500">{item.product?.sku || 'SKU unavailable'}</span>
              </div>
              <span className="shrink-0 text-sm font-semibold text-neutral-950">x{item.quantity}</span>
            </div>)}
        </div>
      </article>
    </div>
  </ModalFrame>;
const SellerOrders = () => {
  const {
    props
  } = usePage();
  const [orders, setOrders] = useState(props.sellerOrders || []);
  const [carriers, setCarriers] = useState(props.sellerFulfillmentChannels?.length ? props.sellerFulfillmentChannels : props.sellerCarriers || []);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [fulfillmentState, setFulfillmentState] = useState({});
  const [exportOpen, setExportOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sort, setSort] = useState({
    key: 'created_at',
    direction: 'desc'
  });
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [invoicePreviewOrder, setInvoicePreviewOrder] = useState(null);
  const [shippingPreviewOrder, setShippingPreviewOrder] = useState(null);
  const [filtersDraft, setFiltersDraft] = useState({
    status: 'all',
    carrier: 'all',
    dateFrom: '',
    dateTo: '',
    paymentMethod: 'all'
  });
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'all',
    carrier: 'all',
    dateFrom: '',
    dateTo: '',
    paymentMethod: 'all'
  });
  useEffect(() => {
    const nextOrders = props.sellerOrders || [];
    const nextCarriers = props.sellerFulfillmentChannels?.length ? props.sellerFulfillmentChannels : props.sellerCarriers || [];
    setOrders(nextOrders);
    setCarriers(nextCarriers);
    const nextState = {};
    nextOrders.forEach(order => {
      nextState[order.id] = {
        status: String(order.status || 'pending').toLowerCase(),
        carrier: order.fulfillment_channel || order.shipping_carrier || nextCarriers[0] || 'Seller Fulfilled',
        acceptanceTime: order.seller_shipping_acceptance_time || '2 hours',
        trackingNumber: order.tracking_number || ''
      };
    });
    setFulfillmentState(nextState);
  }, [props.sellerCarriers, props.sellerFulfillmentChannels, props.sellerOrders]);
  useEffect(() => {
    if (!orders.length) return;
    const syncSelectedOrder = current => current ? orders.find(order => order.id === current.id) || null : null;
    setDetailsOrder(syncSelectedOrder);
    setInvoicePreviewOrder(syncSelectedOrder);
    setShippingPreviewOrder(syncSelectedOrder);
  }, [orders]);
  const filteredOrders = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return orders.filter(order => {
      const status = String(order.status || '').toLowerCase();
      const carrier = order.shipping_carrier || order.fulfillment_channel || '';
      const orderDate = new Date(order.created_at);
      const paymentMethod = String(order.payment_method || '');
      const matchesQuickStatus = activeStatus === 'all' ? true : status === activeStatus;
      const matchesStatus = appliedFilters.status === 'all' ? true : status === appliedFilters.status;
      const matchesCarrier = appliedFilters.carrier === 'all' ? true : carrier === appliedFilters.carrier;
      const matchesPayment = appliedFilters.paymentMethod === 'all' ? true : paymentMethod === appliedFilters.paymentMethod;
      const matchesFrom = appliedFilters.dateFrom ? orderDate >= new Date(`${appliedFilters.dateFrom}T00:00:00`) : true;
      const matchesTo = appliedFilters.dateTo ? orderDate <= new Date(`${appliedFilters.dateTo}T23:59:59`) : true;
      if (!matchesQuickStatus || !matchesStatus || !matchesCarrier || !matchesPayment || !matchesFrom || !matchesTo) {
        return false;
      }
      if (!needle) return true;
      return [order.id, order.invoice_number, order.buyer?.name, order.buyer?.email, order.shipping_address, order.shipping_carrier, order.fulfillment_channel, order.tracking_number, ...order.items.map(item => item.product?.name), ...order.items.map(item => item.product?.sku)].filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
  }, [activeStatus, appliedFilters, orders, search]);
  const sortedOrders = useMemo(() => sortRows(filteredOrders, sort, {
    order: order => order.id,
    buyer: order => order.buyer?.name || order.buyer?.email || '',
    products: order => order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    created_at: order => order.created_at,
    fulfillment: order => order.shipping_carrier || order.fulfillment_channel || '',
    total: order => order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    status: order => order.status
  }), [filteredOrders, sort]);
  const summary = useMemo(() => {
    const shippedStates = ['shipped', 'out_for_delivery', 'completed'];
    return {
      total: orders.length,
      pending: orders.filter(order => String(order.status || '').toLowerCase() === 'pending').length,
      processing: orders.filter(order => String(order.status || '').toLowerCase() === 'processing').length,
      shipped: orders.filter(order => shippedStates.includes(String(order.status || '').toLowerCase())).length,
      revenue: orders.reduce((sum, order) => {
        const sellerTotal = order.items.reduce((lineSum, item) => lineSum + Number(item.price || 0) * Number(item.quantity || 0), 0);
        return sum + sellerTotal;
      }, 0)
    };
  }, [orders]);
  const tableColumnTemplate = '42px minmax(150px,1.05fr) minmax(150px,1.05fr) minmax(170px,1.1fr) 160px minmax(170px,1.05fr) 100px 108px 138px';
  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / perPage));
  const pageNumbers = totalPages <= 5 ? Array.from({
    length: totalPages
  }, (_, index) => index + 1) : currentPage <= 3 ? [1, 2, 3, 4, 5] : currentPage >= totalPages - 2 ? [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] : [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  const visibleOrders = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedOrders.slice(start, start + perPage);
  }, [currentPage, perPage, sortedOrders]);
  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, appliedFilters, search, sort, perPage]);
  useEffect(() => {
    setCurrentPage(current => Math.min(current, totalPages));
  }, [totalPages]);
  const setField = (orderId, field, value) => {
    setFulfillmentState(current => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        [field]: value
      }
    }));
  };
  const updateOrder = orderId => {
    const current = fulfillmentState[orderId];
    if (!current) return;
    router.put(`/seller/orders/${orderId}`, {
      status: current.status,
      shipping_carrier: current.carrier,
      fulfillment_channel: current.carrier,
      seller_shipping_acceptance_time: current.acceptanceTime,
      tracking_number: current.trackingNumber
    }, {
      preserveScroll: true,
      preserveState: false,
      only: ['sellerOrders', 'sellerCarriers', 'sellerFulfillmentChannels', 'flash']
    });
  };
  const exportOrders = format => {
    const params = new URLSearchParams({
      format
    });
    window.location.href = `/seller/export/orders?${params.toString()}`;
    setExportOpen(false);
  };
  const applyFilters = () => {
    setAppliedFilters(filtersDraft);
    setActiveStatus(filtersDraft.status === 'all' ? activeStatus : filtersDraft.status);
    setShowFilters(false);
  };
  const resetFilters = () => {
    const cleared = {
      status: 'all',
      carrier: 'all',
      dateFrom: '',
      dateTo: '',
      paymentMethod: 'all'
    };
    setFiltersDraft(cleared);
    setAppliedFilters(cleared);
    setActiveStatus('all');
  };
  const updateSort = key => setSort(current => getNextSort(current, key));
  const activeFilterCount = Object.values(appliedFilters).filter(value => value !== 'all' && value !== '').length;

  return <div>
      <Sidebar />

      <SellerPageShell>
        <SellerPageHeader title="Orders" description="Review buyer orders, update fulfillment, export order lists, and print shipment-ready details." stats={[{
        label: 'Total Orders',
        value: number(summary.total),
        icon: ShoppingBag
      }, {
        label: 'Pending',
        value: number(summary.pending),
        icon: Package,
        tone: 'amber'
      }, {
        label: 'Fulfillment Active',
        value: number(summary.processing + summary.shipped),
        icon: Truck,
        tone: 'purple'
      }, {
        label: 'Sales Value',
        value: formatOrderMoney(summary.revenue, orders[0]?.currency || 'USD', props),
        icon: CheckCircle2,
        tone: 'green'
      }]} action={<div>
            <div className="relative">
                <Button variant="outline" type="button" onClick={() => setExportOpen(current => !current)}>
                <Download size={15} />
                Export Orders
              </Button>

                {exportOpen && <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 min-w-[180px] border border-neutral-200 bg-white p-2 shadow-sm">
                    <button type="button" className="flex min-h-10 w-full items-center justify-between border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100" onClick={() => exportOrders('csv')}>
                      <span>Export CSV</span>
                      <ArrowDownToLine size={14} />
                    </button>
                    <button type="button" className="mt-2 flex min-h-10 w-full items-center justify-between border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100" onClick={() => exportOrders('excel')}>
                      <span>Export Excel</span>
                      <ArrowDownToLine size={14} />
                    </button>
                  </div>}
              </div>
            </div>} />

        <div className="space-y-6">
        <SellerTableSurface>
          <SellerToolbar search={<SellerSearchField icon={Search} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search order, buyer, tracking, SKU, or product..." className="lg:max-w-[560px]" />} actions={<SellerToolbarActions>
                {[['all', 'All'], ['pending', 'Pending'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['completed', 'Completed']].map(([value, label]) => <button key={value} type="button" onClick={() => setActiveStatus(value)} className={`inline-flex min-h-10 items-center justify-center border px-3 text-sm font-medium transition ${activeStatus === value ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100'}`}>
                    {label}
                  </button>)}
                <div className="relative">
                  <Button variant={activeFilterCount > 0 ? 'primary' : 'outline'} onClick={() => setShowFilters(true)}>
                    <Filter size={15} />
                    Filters
                    {activeFilterCount > 0 && <span className={`inline-flex h-5 min-w-5 items-center justify-center border px-1 text-[10px] font-semibold ${activeFilterCount > 0 ? 'border-white bg-white text-slate-900' : 'border-neutral-950 bg-neutral-950 text-white'}`}>
                      {activeFilterCount}
                    </span>}
                  </Button>
                </div>
              </SellerToolbarActions>} />

          <SellerTableWrap>
            <div className="hidden xl:block">
            <SellerGridHead style={{
            gridTemplateColumns: tableColumnTemplate
          }}>
              <SellerGridCell>#</SellerGridCell>
              <SellerGridCell>
                <SellerSortHeader active={sort.key === 'order'} direction={sort.direction} onClick={() => updateSort('order')}>
                  Order
                </SellerSortHeader>
              </SellerGridCell>
              <SellerGridCell>
                <SellerSortHeader active={sort.key === 'buyer'} direction={sort.direction} onClick={() => updateSort('buyer')}>
                  Buyer
                </SellerSortHeader>
              </SellerGridCell>
              <SellerGridCell>
                <SellerSortHeader active={sort.key === 'products'} direction={sort.direction} onClick={() => updateSort('products')}>
                  Products
                </SellerSortHeader>
              </SellerGridCell>
              <SellerGridCell>
                <SellerSortHeader active={sort.key === 'created_at'} direction={sort.direction} onClick={() => updateSort('created_at')}>
                  Order Date
                </SellerSortHeader>
              </SellerGridCell>
              <SellerGridCell>
                <SellerSortHeader active={sort.key === 'fulfillment'} direction={sort.direction} onClick={() => updateSort('fulfillment')}>
                  Fulfillment
                </SellerSortHeader>
              </SellerGridCell>
              <SellerGridCell>
                <SellerSortHeader active={sort.key === 'total'} direction={sort.direction} onClick={() => updateSort('total')}>
                  Total
                </SellerSortHeader>
              </SellerGridCell>
              <SellerGridCell>
                <SellerSortHeader active={sort.key === 'status'} direction={sort.direction} onClick={() => updateSort('status')}>
                  Status
                </SellerSortHeader>
              </SellerGridCell>
              <SellerGridCell>Actions</SellerGridCell>
            </SellerGridHead>

            <SellerGridBody>
              {visibleOrders.length ? visibleOrders.map((order, index) => {
              const sellerTotal = order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
              const itemCount = order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
              const attention = getOrderAttentionSummary(order);
              return <React.Fragment key={order.id}>
                    <SellerGridRow style={{
                    gridTemplateColumns: tableColumnTemplate
                  }}>
                      <SellerGridCell>{(currentPage - 1) * perPage + index + 1}</SellerGridCell>
                      <SellerGridCell className="min-w-0">
                        <span className="block min-w-0">
                          <strong className="block truncate">#{order.id}</strong>
                          <small className="block truncate">{order.invoice_number || 'Invoice pending'}</small>
                          {attention ? <span className="mt-2 inline-flex"><SellerPill tone={attention.tone}>{attention.label}</SellerPill></span> : null}
                        </span>
                      </SellerGridCell>
                      <SellerGridCell className="min-w-0">
                        <span className="block min-w-0">
                          <strong className="block truncate">{order.buyer?.name || 'Buyer'}</strong>
                          <small className="block truncate">{order.buyer?.email || '-'}</small>
                        </span>
                      </SellerGridCell>
                      <SellerGridCell className="min-w-0">
                        <span className="block min-w-0">
                          <strong className="block truncate">{number(itemCount)} units</strong>
                          <small className="block truncate">
                            {order.items[0]?.product?.name || 'Product removed'}{order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}
                          </small>
                        </span>
                      </SellerGridCell>
                      <SellerGridCell className="text-sm text-neutral-700">{formatDateTime(order.created_at, {
                      includeTime: true
                    }, props)}</SellerGridCell>
                      <SellerGridCell className="min-w-0">
                        <span className="block min-w-0">
                      <strong className="block truncate">{order.shipping_carrier || order.fulfillment_channel || 'Seller Fulfilled'}</strong>
                          <small className="block truncate">{order.tracking_number || 'Tracking pending'}</small>
                        </span>
                      </SellerGridCell>
                      <SellerGridCell className="text-sm font-semibold text-neutral-950">{formatOrderMoney(sellerTotal, order.currency, props)}</SellerGridCell>
                      <SellerGridCell>
                        <SellerPill tone={statusTone(order.status)}>{toTitle(order.status)}</SellerPill>
                      </SellerGridCell>
                      <SellerGridCell>
                        <SellerActionButtons className="flex-nowrap justify-center gap-1">
                          <SellerIconButton onClick={() => setDetailsOrder(order)} aria-label="View order details">
                            <Eye size={15} />
                          </SellerIconButton>
                          <SellerIconButton onClick={() => setShippingPreviewOrder(order)} aria-label="View shipping details">
                            <MapPinned size={15} />
                          </SellerIconButton>
                          <SellerIconButton onClick={() => setInvoicePreviewOrder(order)} aria-label="View invoice">
                            <ArrowDownToLine size={15} />
                          </SellerIconButton>
                          </SellerActionButtons>
                      </SellerGridCell>
                    </SellerGridRow>
                  </React.Fragment>;
            }) : <SellerEmptyState title="No orders matched your filters" description="Try searching by order ID, buyer, product, SKU, or tracking number." />}
            </SellerGridBody>
            </div>
          </SellerTableWrap>

          <div className="space-y-4 border-t border-neutral-200 p-4 xl:hidden">
            {visibleOrders.map(order => {
            const sellerTotal = order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
            const itemCount = order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            const attention = getOrderAttentionSummary(order);
            return <article key={`mobile-${order.id}`} className="border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong>#{order.id}</strong>
                      <span className="mt-1 block truncate text-xs text-neutral-500">{order.invoice_number || 'Invoice pending'}</span>
                      {attention ? <span className="mt-3 inline-flex"><SellerPill tone={attention.tone}>{attention.label}</SellerPill></span> : null}
                    </div>
                    <SellerPill tone={statusTone(order.status)}>{toTitle(order.status)}</SellerPill>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <strong className="block text-sm font-semibold text-neutral-950">{order.buyer?.name || 'Buyer'}</strong>
                      <span className="mt-1 block text-xs text-neutral-500">{order.buyer?.email || '-'}</span>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <strong className="block text-sm font-semibold text-neutral-950">{formatOrderMoney(sellerTotal, order.currency, props)}</strong>
                      <span className="mt-1 block text-xs text-neutral-500">{number(itemCount)} units</span>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <strong className="block text-sm font-semibold text-neutral-950">{order.shipping_carrier || order.fulfillment_channel || 'Seller Fulfilled'}</strong>
                      <span className="mt-1 block text-xs text-neutral-500">{order.tracking_number || 'Tracking pending'}</span>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <strong className="block text-sm font-semibold text-neutral-950">{formatDateTime(order.created_at, {
                      includeTime: true
                    }, props)}</strong>
                      <span className="mt-1 block text-xs text-neutral-500">{order.items[0]?.product?.name || 'Product removed'}{order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => setDetailsOrder(order)}>
                      <Eye size={15} />
                      View Details
                    </Button>
                    <Button variant="outline" onClick={() => setShippingPreviewOrder(order)}>
                      <MapPinned size={15} />
                      Shipping
                    </Button>
                    <Button variant="outline" onClick={() => setInvoicePreviewOrder(order)}>
                      <ArrowDownToLine size={15} />
                      Invoice
                    </Button>
                  </div>
                </article>;
          })}
          </div>
        </SellerTableSurface>

        <SellerPaginationCard>
          <SellerTablePaginationBar showBorder={false} className="bg-transparent px-0 pb-0 pt-0" summary={`Showing ${sortedOrders.length ? (currentPage - 1) * perPage + 1 : 0} to ${Math.min(currentPage * perPage, sortedOrders.length)} of ${sortedOrders.length} results`} currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} onPageChange={setCurrentPage} perPage={perPage} onPerPageChange={event => {
          setPerPage(Number(event.target.value));
          setCurrentPage(1);
        }} />
        </SellerPaginationCard>
        </div>
      </SellerPageShell>

      {showFilters && <FilterModal filters={filtersDraft} setFilters={setFiltersDraft} applyFilters={applyFilters} resetFilters={resetFilters} closeModal={() => setShowFilters(false)} carriers={carriers.length ? carriers : ['Seller Fulfilled']} />}

      {detailsOrder && <OrderDetailsModal order={detailsOrder} props={props} closeModal={() => setDetailsOrder(null)} fulfillmentState={fulfillmentState} setField={setField} updateOrder={updateOrder} carriers={carriers.length ? carriers : ['Seller Fulfilled']} openShipping={() => {
      setDetailsOrder(null);
      setShippingPreviewOrder(detailsOrder);
    }} openInvoice={() => {
      setDetailsOrder(null);
      setInvoicePreviewOrder(detailsOrder);
    }} />}

      {invoicePreviewOrder && <InvoiceModal order={invoicePreviewOrder} props={props} closeModal={() => setInvoicePreviewOrder(null)} />}

      {shippingPreviewOrder && <ShippingModal order={shippingPreviewOrder} props={props} closeModal={() => setShippingPreviewOrder(null)} />}
    </div>;
};
export default SellerOrders;
