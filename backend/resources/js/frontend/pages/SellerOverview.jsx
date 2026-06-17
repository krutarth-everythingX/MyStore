import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, usePage } from '@inertiajs/react';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import {
  ArrowRight,
} from 'lucide-react';
import './SellerOverview.css';

export const SellerOverview = () => {
  const { user } = useAuth();
  const { props } = usePage();
  const [stats, setStats] = useState(props.sellerStats || null);
  const [loading, setLoading] = useState(false);
  
  // Interactive charting state
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  useEffect(() => {
    setStats(props.sellerStats || null);
    setLoading(false);
  }, [props.sellerStats]);

  const handleExport = (type) => {
    const endpoint = type === 'orders' ? 'orders' : 'inventory';
    window.location.assign(`/seller/export/${endpoint}`);
  };

  // SVG Chart Setup
  const salesData = stats?.sales_velocity || [];
  const maxSales = Math.max(...salesData.map(d => d.total_sales), 100);
  const points = salesData.map((d, i) => {
    const x = (i / Math.max(salesData.length - 1, 1)) * 460 + 20;
    const y = 180 - (d.total_sales / maxSales) * 150;
    return { x, y, date: d.date, total: d.total_sales };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const fillD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z` 
    : '';

  const catData = stats?.category_split || [];
  const totalCatValue = catData.reduce((acc, c) => acc + c.value, 0);
  let accumulatedPercent = 0;
  const donutSlices = catData.map((c, i) => {
    const percent = totalCatValue > 0 ? (c.value / totalCatValue) : 0;
    const strokeDash = `${percent * 100} ${100 - percent * 100}`;
    const strokeDashoffset = -accumulatedPercent * 100;
    accumulatedPercent += percent;
    return {
      category: c.category,
      value: c.value,
      percent,
      strokeDash,
      strokeDashoffset,
      color: `hsl(${(i * 360 / Math.max(catData.length, 1)) % 360}, 65%, 50%)`
    };
  });

  return (
    <div className="seller-dashboard-layout">
      <Sidebar />
      
      <div className="seller-dashboard-content animate-fade-in">
        <div className="seller-dashboard-container container">
          {/* Header */}
          <div className="seller-page-header">
            <div className="seller-page-title-block">
              <h2 className="headline-lg">Dashboard Overview</h2>
              <p className="body-md" style={{ color: 'var(--color-outline)' }}>
                Welcome back, {user?.name}! Managing <strong>{user?.brand_name}</strong>.
              </p>
            </div>
            <div className="seller-header-actions">
              <div className="export-buttons-group">
                <button type="button" onClick={() => handleExport('inventory')} className="action-btn">
                  Export Inventory
                </button>
                <button type="button" onClick={() => handleExport('orders')} className="action-btn">
                  Export Orders
                </button>
              </div>
              <Link href="/seller/products" className="action-btn primary">
                Manage Products
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="seller-loading flex-center">
              <span className="body-lg">Loading sales analytics...</span>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="seller-stats-grid">
                <Card className="stat-card">
                  <div className="stat-details">
                    <span className="stat-label label-md">Total Sales Revenue</span>
                    <span className="stat-value headline-md">${parseFloat(stats?.revenue || 0).toFixed(2)}</span>
                  </div>
                </Card>

                <Card className="stat-card">
                  <div className="stat-details">
                    <span className="stat-label label-md">Total Orders</span>
                    <span className="stat-value headline-md">{stats?.orders_count || 0}</span>
                  </div>
                </Card>

                <Card className="stat-card">
                  <div className="stat-details">
                    <span className="stat-label label-md">Products Cataloged</span>
                    <span className="stat-value headline-md">{stats?.products_count || 0}</span>
                  </div>
                </Card>

                <Card className="stat-card stat-card-alert">
                  <div className="stat-details">
                    <span className="stat-label label-md">Low Stock Warnings</span>
                    <span className="stat-value headline-md" style={{ color: stats?.low_stock_count > 0 ? 'var(--color-error)' : 'inherit' }}>
                      {stats?.low_stock_count || 0}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Interactive Charts */}
              <div className="chart-section-grid">
                <Card title="Sales Velocity (Past 30 Days)" className="chart-card">
                  {hoveredPoint && (
                    <div className="chart-tooltip">
                      <span className="label-md" style={{ fontWeight: 600 }}>{hoveredPoint.date}</span>
                      <span className="body-sm" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                        ${hoveredPoint.total.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="chart-container">
                    {salesData.length > 0 ? (
                      <svg viewBox="0 0 500 200" className="chart-svg">
                        <defs>
                          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25"/>
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => (
                          <line
                            key={idx}
                            x1="20"
                            y1={30 + r * 150}
                            x2="480"
                            y2={30 + r * 150}
                            className="chart-grid-line"
                          />
                        ))}
                        {fillD && <path d={fillD} className="chart-line-gradient" />}
                        {pathD && <path d={pathD} className="chart-line" />}
                        {points.map((p, idx) => (
                          <circle
                            key={idx}
                            cx={p.x}
                            cy={p.y}
                            r={hoveredPoint?.date === p.date ? 6 : 4}
                            className={`chart-dot ${hoveredPoint?.date === p.date ? 'active' : ''}`}
                            onMouseEnter={() => setHoveredPoint(p)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        ))}
                        {points.length > 0 && (
                          <>
                            <text x="20" y="195" fill="var(--color-outline)" fontSize="10" textAnchor="start">
                              {points[0].date}
                            </text>
                            <text x="250" y="195" fill="var(--color-outline)" fontSize="10" textAnchor="middle">
                              {points[Math.floor(points.length / 2)].date}
                            </text>
                            <text x="480" y="195" fill="var(--color-outline)" fontSize="10" textAnchor="end">
                              {points[points.length - 1].date}
                            </text>
                          </>
                        )}
                      </svg>
                    ) : (
                      <span className="body-md" style={{ color: 'var(--color-outline)' }}>No sales velocity data</span>
                    )}
                  </div>
                </Card>

                <Card title="Sales by Category" className="chart-card">
                  <div className="chart-container" style={{ flexDirection: 'column' }}>
                    {catData.length > 0 && totalCatValue > 0 ? (
                      <>
                        <svg viewBox="0 0 42 42" style={{ width: '130px', height: '130px', transform: 'rotate(-90deg)', overflow: 'visible', marginBottom: 12 }}>
                          {donutSlices.map((slice, idx) => (
                            <circle
                              key={idx}
                              cx="21"
                              cy="21"
                              r="15.91549430918954"
                              fill="transparent"
                              stroke={slice.color}
                              strokeWidth="4.5"
                              strokeDasharray={slice.strokeDash}
                              strokeDashoffset={slice.strokeDashoffset}
                              style={{ transition: 'stroke-width 0.2s ease', cursor: 'pointer' }}
                              onMouseEnter={() => setHoveredCategory(slice)}
                              onMouseLeave={() => setHoveredCategory(null)}
                            />
                          ))}
                        </svg>
                        
                        <div className="donut-legend-row">
                          {donutSlices.map((slice, idx) => (
                            <div 
                              key={idx} 
                              className="legend-item"
                              style={{ 
                                fontWeight: hoveredCategory?.category === slice.category ? 'bold' : 'normal',
                                color: hoveredCategory?.category === slice.category ? 'var(--color-primary)' : 'inherit'
                              }}
                            >
                              <span className="legend-color" style={{ backgroundColor: slice.color }}></span>
                              <span>{slice.category} ({Math.round(slice.percent * 100)}%)</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <span className="body-md" style={{ color: 'var(--color-outline)' }}>No category sales data</span>
                    )}
                  </div>
                </Card>
              </div>

              {/* Recent Sales Activity */}
              <Card
                title="Recent Sales Activity"
                extra={
                  <Link href="/seller/orders" className="recent-sales-link label-md">
                    View All Orders <ArrowRight size={14} style={{ marginLeft: 4 }} />
                  </Link>
                }
              >
                {stats?.recent_sales && stats.recent_sales.length > 0 ? (
                  <div className="recent-sales-list">
                    {stats.recent_sales.map((sale) => (
                      <div key={sale.id} className="recent-sale-row body-md">
                        <div className="sale-product">
                          <span className="sale-prod-name font-weight-600">{sale.product?.name || 'Removed Product'}</span>
                          <span className="sale-buyer-email body-md" style={{ color: 'var(--color-outline)', fontSize: 12 }}>
                            Customer: {sale.order?.buyer?.name} ({sale.order?.buyer?.email})
                          </span>
                        </div>
                        <div className="sale-meta text-align-right">
                          <span className="sale-price-qty font-weight-600">{sale.quantity} x ${parseFloat(sale.price).toFixed(2)}</span>
                          <span className="sale-total" style={{ color: 'var(--color-primary)', display: 'block', fontWeight: 700 }}>
                            ${parseFloat(sale.price * sale.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="body-md" style={{ color: 'var(--color-outline)', textAlign: 'center', padding: '24px 0' }}>
                    No sales transactions recorded yet.
                  </p>
                )}
              </Card>

              {/* Low Stock Alerts */}
              {stats?.low_stock_products && stats.low_stock_products.length > 0 && (
                <Card title="Low Stock Alerts" style={{ border: '1px solid var(--color-error-container)', marginTop: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    {stats.low_stock_products.map((p) => (
                      <div key={p.id} className="low-stock-alert-item animate-fade-in" style={{ marginBottom: 0 }}>
                        <div className="low-stock-meta">
                          <span className="body-md font-weight-600" style={{ color: 'var(--color-error)' }}>{p.name}</span>
                          <span className="label-sm" style={{ color: 'var(--color-outline)', marginTop: 2 }}>
                            Qty: <strong>{p.stock_quantity}</strong> (Threshold: {p.low_stock_amount})
                          </span>
                        </div>
                        <Link href="/seller/products" className="low-stock-action-link">
                          Restock
                        </Link>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default SellerOverview;
