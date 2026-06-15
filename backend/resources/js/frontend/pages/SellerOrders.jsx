import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ShoppingBag, Truck, Calendar, User, Package, Check } from 'lucide-react';
import './SellerOrders.css';

export const SellerOrders = () => {
  const { props } = usePage();
  const { user } = useAuth();
  const [orders, setOrders] = useState(props.sellerOrders || []);
  const [carriers, setCarriers] = useState(props.sellerFulfillmentChannels || props.sellerCarriers || []);
  const [loading, setLoading] = useState(false);

  // Fulfillment form states (mapped by order ID)
  const [fulfillmentStates, setFulfillmentStates] = useState({});

  useEffect(() => {
    const nextOrders = props.sellerOrders || [];
    setOrders(nextOrders);
    setCarriers(props.sellerFulfillmentChannels?.length ? props.sellerFulfillmentChannels : (props.sellerCarriers || []));
    setLoading(false);

    const initialStates = {};
    nextOrders.forEach(order => {
      initialStates[order.id] = {
        status: order.status,
        carrier: order.fulfillment_channel || order.shipping_carrier || user?.default_fulfillment_channel || 'Seller Fulfilled',
        acceptanceTime: order.seller_shipping_acceptance_time || user?.shipping_acceptance_time || '',
        tracking: order.tracking_number || '',
        successMsg: '',
        errorMsg: ''
      };
    });
    setFulfillmentStates(initialStates);
  }, [props.sellerCarriers, props.sellerOrders]);

  const handleStateChange = (orderId, field, value) => {
    setFulfillmentStates(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value
      }
    }));
  };

  const handleUpdateFulfillment = async (orderId) => {
    const state = fulfillmentStates[orderId];
    
    // Clear messages
    handleStateChange(orderId, 'successMsg', '');
    handleStateChange(orderId, 'errorMsg', '');

    router.put(`/seller/orders/${orderId}`, {
      status: state.status,
      shipping_carrier: state.carrier,
      fulfillment_channel: state.carrier,
      seller_shipping_acceptance_time: state.acceptanceTime,
      tracking_number: state.tracking
    }, {
      preserveScroll: true,
      preserveState: false,
      only: ['sellerOrders', 'sellerCarriers', 'flash'],
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
    <div className="seller-dashboard-layout">
      <Sidebar />

      <div className="seller-dashboard-content animate-fade-in">
        <div className="seller-dashboard-container container">
          {/* Header */}
          <div className="seller-page-header">
            <div className="seller-page-title-block">
              <h2 className="headline-lg">Customer Sales Orders</h2>
              <p className="body-md" style={{ color: 'var(--color-outline)' }}>
                Fulfill purchase orders containing your items, assign logistics couriers, and track deliveries.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="seller-loading flex-center">
              <span className="body-lg">Loading sales orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="orders-empty card flex-center">
              <ShoppingBag size={48} className="orders-empty-icon" />
              <h3 className="title-lg">No orders found</h3>
              <p className="body-md">
                No customer has purchased your products yet. Keep your store inventory stocked!
              </p>
            </div>
          ) : (
            <div className="seller-orders-list">
              {orders.map((order) => {
                const fState = fulfillmentStates[order.id] || {
                  status: 'pending', carrier: user?.default_fulfillment_channel || 'Seller Fulfilled', acceptanceTime: user?.shipping_acceptance_time || '', tracking: '', successMsg: '', errorMsg: ''
                };
                
                // Calculate seller-specific total in this order
                const sellerTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                return (
                  <Card
                    key={order.id}
                    title={`Sales Order: #${order.id}`}
                    extra={
                      <span className={`order-status-badge label-md ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    }
                    className="seller-order-card"
                  >
                    <div className="seller-order-meta-grid">
                      {/* Buyer Details */}
                      <div className="meta-block body-md">
                        <User size={16} className="meta-icon" />
                        <div>
                          <span className="meta-label label-md">Buyer Name</span>
                          <strong>{order.buyer?.name}</strong>
                          <span style={{ fontSize: 12, color: 'var(--color-outline)', display: 'block' }}>
                            {order.buyer?.email}
                          </span>
                        </div>
                      </div>

                      {/* Order Time */}
                      <div className="meta-block body-md">
                        <Calendar size={16} className="meta-icon" />
                        <div>
                          <span className="meta-label label-md">Purchase Date</span>
                          <strong>
                            {new Date(order.created_at).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </strong>
                        </div>
                      </div>

                      {/* Shipping Destination */}
                      <div className="meta-block body-md">
                        <Truck size={16} className="meta-icon" />
                        <div>
                          <span className="meta-label label-md">Delivery Address</span>
                          <strong>{order.shipping_address}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="order-divider"></div>

                    {/* Ordered Items belonging to this Seller */}
                    <div className="seller-ordered-items">
                      <h5 className="section-title label-md">Your Sold Products</h5>
                      <div className="ordered-items-list">
                        {order.items.map((item) => (
                          <div key={item.id} className="ordered-item-row body-md">
                            <span className="ordered-prod-name">
                              {item.product?.name || 'Removed Product'} <strong style={{ color: 'var(--color-outline)' }}>x{item.quantity}</strong>
                            </span>
                            <span className="ordered-prod-price font-weight-600">
                              ${parseFloat(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="seller-order-subtotal body-lg text-align-right" style={{ marginTop: 12 }}>
                        Your Sales Total: <strong style={{ color: 'var(--color-primary)' }}>${sellerTotal.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="order-divider"></div>

                    {/* Logistics Fulfillment Actions */}
                    <div className="logistics-fulfillment-section">
                      <h5 className="section-title label-md">Logistics & Order Fulfillment</h5>
                      
                      {fState.successMsg && <div className="fulfill-alert fulfill-alert-success body-md">{fState.successMsg}</div>}
                      {fState.errorMsg && <div className="fulfill-alert fulfill-alert-error body-md">{fState.errorMsg}</div>}

                      <div className="shiprocket-actions-row">
                        {order.shipping_label_url && (
                          <a 
                            href={order.shipping_label_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-outline seller-order-link-btn"
                          >
                            Download Shipping Label
                          </a>
                        )}

                        {order.status.toLowerCase() !== 'cancelled' && (
                          <Button
                            variant="outline"
                            onClick={() => handleViewInvoice(order.id)}
                          >
                            Print GST Invoice
                          </Button>
                        )}
                      </div>

                      {/* If order is already shipped/has tracking, lock the logistics fields and only allow status update */}
                      {order.tracking_number ? (
                        <div className="tracking-status-panel">
                          <div className="body-md">
                            <strong>Fulfillment Carrier:</strong> {order.shipping_carrier || 'N/A'}<br/>
                            <strong>Tracking Number:</strong> {order.tracking_number}
                          </div>
                          <div className="tracking-status-controls">
                            <div className="input-container" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
                              <label className="input-label label-md">Update Status</label>
                              <select
                                className="input-field"
                                value={fState.status}
                                onChange={(e) => handleStateChange(order.id, 'status', e.target.value)}
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                            <Button
                              variant="primary"
                              onClick={() => handleUpdateFulfillment(order.id)}
                              className="tracking-status-btn"
                            >
                              Update Status
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Otherwise, allow manual inputs as fallback */
                        <div className="logistics-controls-grid">
                          <div className="input-container" style={{ marginBottom: 0 }}>
                            <label className="input-label label-md">Shipping Status</label>
                            <select
                              className="input-field"
                              value={fState.status}
                              onChange={(e) => handleStateChange(order.id, 'status', e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>

                          <div className="input-container" style={{ marginBottom: 0 }}>
                            <label className="input-label label-md">Fulfillment Channel</label>
                            <select
                              className="input-field"
                              value={fState.carrier}
                              onChange={(e) => handleStateChange(order.id, 'carrier', e.target.value)}
                            >
                              {carriers.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          <div className="input-container" style={{ marginBottom: 0 }}>
                            <label className="input-label label-md">Order Acceptance Time</label>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="e.g. 2 hours"
                              value={fState.acceptanceTime || ''}
                              onChange={(e) => handleStateChange(order.id, 'acceptanceTime', e.target.value)}
                            />
                          </div>

                          <div className="input-container" style={{ marginBottom: 0 }}>
                            <label className="input-label label-md">Logistics Tracking Number</label>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="Enter carrier tracking number"
                              value={fState.tracking}
                              onChange={(e) => handleStateChange(order.id, 'tracking', e.target.value)}
                            />
                          </div>

                          <div className="logistics-action-btn flex-center">
                            <Button
                              variant="primary"
                              onClick={() => handleUpdateFulfillment(order.id)}
                              style={{ height: '42px', width: '100%', marginTop: '20px' }}
                            >
                              <Check size={16} style={{ marginRight: 6 }} />
                              Update Fulfillment Info
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SellerOrders;
