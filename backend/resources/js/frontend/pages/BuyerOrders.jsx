import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { CheckCircle2, Package, Truck, Calendar, CreditCard, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import './BuyerOrders.css';

export const BuyerOrders = () => {
  const { props, url } = usePage();
  const [orders, setOrders] = useState(props.buyerOrders || []);
  const [loading, setLoading] = useState(false);
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

  const getTimelineProgressWidth = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 0;
      case 'processing': return 25;
      case 'shipped': return 50;
      case 'out_for_delivery': return 75;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const getStepStatus = (status, index) => {
    const statusOrder = ['pending', 'processing', 'shipped', 'out_for_delivery', 'completed'];
    const currentIdx = statusOrder.indexOf(status.toLowerCase());
    if (currentIdx === -1) return 'upcoming';
    if (index < currentIdx) return 'completed';
    if (index === currentIdx) return 'active';
    return 'upcoming';
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    router.post(`/orders/${orderId}/cancel`, {}, {
      preserveScroll: true,
      preserveState: false,
      only: ['buyerOrders', 'flash'],
    });
  };

  const handleReturnOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to request a return and refund for this order?')) return;
    router.post(`/orders/${orderId}/return`, {}, {
      preserveScroll: true,
      preserveState: false,
      only: ['buyerOrders', 'flash'],
    });
  };

  const handleViewInvoice = (orderId) => {
    window.open(`/orders/${orderId}/invoice`, '_blank', 'noopener,noreferrer');
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <div className="buyer-layout">
      <Navbar />

      <main className="container orders-main animate-fade-in">
        <Breadcrumbs items={[{ label: 'My Orders' }]} />
        {isSuccessCheckout && (
          <div className="orders-success-banner flex-center card">
            <CheckCircle2 size={36} className="success-banner-icon" />
            <div>
              <h4 className="title-lg" style={{ color: '#1b5e20' }}>Order Placed Successfully!</h4>
              <p className="body-md" style={{ color: '#2e7d32', marginTop: 4 }}>
                Thank you for your purchase. The seller(s) will fulfill your items and update logistics tracking.
              </p>
            </div>
          </div>
        )}

        <div className="orders-header-row">
          <h1 className="headline-lg">My Purchase History</h1>
          <span className="orders-count body-lg">Total Orders: {orders.length}</span>
        </div>

        {loading ? (
          <div className="orders-loading flex-center">
            <span className="body-lg">Loading order history...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty card flex-center">
            <Package size={48} className="orders-empty-icon" />
            <h3 className="title-lg">No orders found</h3>
            <p className="body-md" style={{ color: 'var(--color-outline)', marginTop: 8 }}>
              You haven't placed any orders in MyStore yet.
            </p>
            <Link href="/">
              <Button variant="primary" style={{ marginTop: 16 }}>
                Browse Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <Card
                key={order.id}
                title={`Order ID: #${order.id}`}
                extra={
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className={`order-status-badge label-md ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                    {order.refund_status && (
                      <span className="order-status-badge label-md status-cancelled">
                        {order.refund_status}
                      </span>
                    )}
                  </div>
                }
                className="order-record-card"
              >
                <div className="order-details-grid">
                  <div className="order-detail-item">
                    <Calendar size={16} className="detail-icon" />
                    <div>
                      <span className="detail-label label-md">Order Date</span>
                      <span className="detail-value body-md">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="order-detail-item">
                    <CreditCard size={16} className="detail-icon" />
                    <div>
                      <span className="detail-label label-md">Payment Info</span>
                      <span className="detail-value body-md">{order.payment_method}</span>
                    </div>
                  </div>

                  <div className="order-detail-item">
                    <Truck size={16} className="detail-icon" />
                    <div>
                      <span className="detail-label label-md">Logistics Tracking</span>
                      <span className="detail-value body-md">
                        {order.shipping_carrier ? (
                          <span>
                            <strong>{order.shipping_carrier}</strong> - {order.tracking_number ? (
                              <a 
                                href={getTrackingUrl(order.shipping_carrier, order.tracking_number)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: 600 }}
                              >
                                {order.tracking_number}
                              </a>
                            ) : (
                              'Awaiting tracking ID'
                            )}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-outline)' }}>Not yet shipped</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {order.status.toLowerCase() !== 'cancelled' && (
                  <div className="order-tracking-timeline-container" style={{ margin: '24px 0 16px 0', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '24px' }}>
                    <div className="order-tracking-timeline">
                      <div 
                        className="timeline-progress-bar" 
                        style={{ width: `${getTimelineProgressWidth(order.status)}%` }}
                      ></div>
                      
                      {['Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'].map((step, idx) => {
                        const stepStatus = getStepStatus(order.status, idx);
                        return (
                          <div key={step} className={`timeline-step ${stepStatus}`}>
                            <div className="step-node">
                              {stepStatus === 'completed' ? '✓' : idx + 1}
                            </div>
                            <span className="step-label">{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="order-shipping-block body-md">
                  <strong>Ship To Address:</strong> {order.shipping_address}
                </div>

                <div className="order-items-table-header label-md">Items Ordered</div>
                <div className="order-items-list">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item-line body-md">
                      <div className="item-name-cell">
                        {item.product ? (
                          <Link href={`/products/${item.product.id}`} className="item-product-link">
                            {item.product.name}
                          </Link>
                        ) : (
                          <span style={{ color: 'var(--color-outline)' }}>Product Removed</span>
                        )}
                        {item.product?.brand && (
                          <span className="item-brand-tag label-md">{item.product.brand.name}</span>
                        )}
                        {item.product?.user?.brand_name && (
                          <span className="item-brand-tag label-md" style={{ backgroundColor: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)', marginLeft: 8 }}>
                            Seller: {item.product.user.brand_name}
                          </span>
                        )}
                      </div>
                      <div className="item-qty-price-cell">
                        <span>{item.quantity} x ${parseFloat(item.price).toFixed(2)}</span>
                        <span className="item-total-val">${parseFloat(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-total-bar">
                   <span className="total-label title-lg">Grand Total</span>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                     {order.status.toLowerCase() !== 'cancelled' && (
                       <Button 
                         variant="outline" 
                         size="sm" 
                         onClick={() => handleViewInvoice(order.id)}
                       >
                         Download GST Invoice
                       </Button>
                     )}
                     {(order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'processing') && (
                       <Button 
                         variant="outline" 
                         size="sm" 
                         onClick={() => handleCancelOrder(order.id)}
                         style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                       >
                         Cancel Order
                       </Button>
                     )}
                     {(order.status.toLowerCase() === 'completed') && !order.refund_status && (
                       <Button 
                         variant="outline" 
                         size="sm" 
                         onClick={() => handleReturnOrder(order.id)}
                       >
                         Return & Refund
                       </Button>
                     )}
                     <span className="total-price headline-md">${parseFloat(order.total_amount).toFixed(2)}</span>
                   </div>
                 </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
export default BuyerOrders;
