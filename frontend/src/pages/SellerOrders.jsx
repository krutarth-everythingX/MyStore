import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ShoppingBag, Truck, Calendar, User, Package, Check } from 'lucide-react';
import './SellerOrders.css';

export const SellerOrders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fulfillment form states (mapped by order ID)
  const [fulfillmentStates, setFulfillmentStates] = useState({});

  const API_BASE = 'http://127.0.0.1:8000/api';

  const fetchOrders = () => {
    setLoading(true);
    fetch(`${API_BASE}/seller/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    .then(res => res.json())
    .then(data => {
      setOrders(data);
      // Pre-fill form states
      const initialStates = {};
      data.forEach(order => {
        initialStates[order.id] = {
          status: order.status,
          carrier: order.shipping_carrier || 'Blue Dart',
          tracking: order.tracking_number || '',
          successMsg: '',
          errorMsg: ''
        };
      });
      setFulfillmentStates(initialStates);
    })
    .catch(err => console.error('Error fetching seller orders', err))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) {
      fetchOrders();

      // Fetch carriers list
      fetch(`${API_BASE}/shipping-carriers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setCarriers(data.carriers || []));
    }
  }, [token]);

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

    try {
      const res = await fetch(`${API_BASE}/seller/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: state.status,
          shipping_carrier: state.carrier,
          tracking_number: state.tracking
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update order');
      }

      handleStateChange(orderId, 'successMsg', 'Fulfillment details updated!');
      setTimeout(() => {
        fetchOrders();
      }, 1000);
    } catch (err) {
      handleStateChange(orderId, 'errorMsg', err.message || 'Error occurred.');
    }
  };

  const handleShipViaShiprocket = async (orderId) => {
    handleStateChange(orderId, 'successMsg', '');
    handleStateChange(orderId, 'errorMsg', '');
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/ship`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Shiprocket shipping failed');
      }
      handleStateChange(orderId, 'successMsg', 'Successfully shipped via Shiprocket!');
      setTimeout(() => {
        fetchOrders();
      }, 1000);
    } catch (err) {
      handleStateChange(orderId, 'errorMsg', err.message || 'Error shipping via Shiprocket.');
    }
  };

  const handleViewInvoice = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch invoice');
      }
      const html = await res.text();
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } catch (err) {
      alert(err.message || 'Failed to open invoice');
    }
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
            <div>
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
            <div className="orders-empty card flex-center" style={{ height: 350 }}>
              <ShoppingBag size={48} style={{ color: 'var(--color-outline)', marginBottom: 16 }} />
              <h3 className="title-lg">No orders found</h3>
              <p className="body-md" style={{ color: 'var(--color-outline)', marginTop: 8 }}>
                No customer has purchased your products yet. Keep your store inventory stocked!
              </p>
            </div>
          ) : (
            <div className="seller-orders-list">
              {orders.map((order) => {
                const fState = fulfillmentStates[order.id] || {
                  status: 'pending', carrier: 'Blue Dart', tracking: '', successMsg: '', errorMsg: ''
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

                      <div className="shiprocket-actions-row" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                        {order.status.toLowerCase() === 'processing' && !order.tracking_number && (
                          <Button
                            variant="primary"
                            onClick={() => handleShipViaShiprocket(order.id)}
                            style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
                          >
                            Ship via Shiprocket
                          </Button>
                        )}
                        
                        {order.shipping_label_url && (
                          <a 
                            href={order.shipping_label_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-outline"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              padding: '8px 16px', 
                              border: '1px solid var(--color-outline)', 
                              borderRadius: '8px', 
                              textDecoration: 'none', 
                              color: 'var(--color-on-surface)',
                              fontSize: '14px',
                              fontWeight: 500,
                              backgroundColor: 'transparent'
                            }}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', border: '1px solid var(--color-outline-variant)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', marginTop: 16 }}>
                          <div className="body-md">
                            <strong>Fulfillment Carrier:</strong> {order.shipping_carrier || 'N/A'}<br/>
                            <strong>Tracking Number:</strong> {order.tracking_number}
                          </div>
                          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
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
                              style={{ height: '42px' }}
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
                            <label className="input-label label-md">Fulfillment Carrier (e.g. Blue Dart)</label>
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
