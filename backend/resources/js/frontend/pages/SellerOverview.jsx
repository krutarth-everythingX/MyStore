import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, usePage } from '@inertiajs/react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { SellerCard, SellerPageHeader, SellerPageShell } from '../components/seller-workspace';
import { convertMoney, formatMoney, getUserLocalization } from '../utils/localization';
import { AlertTriangle, ArrowRight, Boxes, PackagePlus, ShieldCheck, TrendingUp } from 'lucide-react';
const StatCard = ({
  label,
  value,
  support,
  icon: Icon,
  tone = 'slate'
}) => <SellerCard>
    <div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <span>{support}</span>
      </div>
      <span>
        <Icon size={20} />
      </span>
    </div>
  </SellerCard>;
export const SellerOverview = () => {
  const {
    user
  } = useAuth();
  const {
    props
  } = usePage();
  const localization = getUserLocalization(props, user?.country);
  const money = (value, sourceCurrency = 'USD') => formatMoney(convertMoney(value, sourceCurrency, localization.currency, props), {
    currency: localization.currency,
    locale: localization.locale
  }, props);
  const [stats, setStats] = useState(props.sellerStats || null);
  const [loading, setLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  useEffect(() => {
    setStats(props.sellerStats || null);
    setLoading(false);
  }, [props.sellerStats]);
  const handleExport = type => {
    const endpoint = type === 'orders' ? 'orders' : 'inventory';
    window.location.assign(`/seller/export/${endpoint}`);
  };
  const salesData = stats?.sales_velocity || [];
  const maxSales = Math.max(...salesData.map(item => item.total_sales), 100);
  const points = salesData.map((item, index) => {
    const x = index / Math.max(salesData.length - 1, 1) * 460 + 20;
    const y = 180 - item.total_sales / maxSales * 150;
    return {
      x,
      y,
      date: item.date,
      total: item.total_sales
    };
  });
  const pathD = points.reduce((accumulator, point, index) => index === 0 ? `M ${point.x} ${point.y}` : `${accumulator} L ${point.x} ${point.y}`, '');
  const fillD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z` : '';
  const catData = stats?.category_split || [];
  const totalCatValue = catData.reduce((accumulator, category) => accumulator + category.value, 0);
  let accumulatedPercent = 0;
  const donutSlices = catData.map((category, index) => {
    const percent = totalCatValue > 0 ? category.value / totalCatValue : 0;
    const strokeDash = `${percent * 100} ${100 - percent * 100}`;
    const strokeDashoffset = -accumulatedPercent * 100;
    accumulatedPercent += percent;
    return {
      category: category.category,
      value: category.value,
      percent,
      strokeDash,
      strokeDashoffset,
      color: `hsl(${index * 360 / Math.max(catData.length, 1) % 360}, 65%, 50%)`
    };
  });
  return <div>
      <Sidebar />

      <SellerPageShell>
        <SellerPageHeader title="Dashboard Overview" description={`Welcome back, ${user?.name || 'Seller'}! Managing ${user?.brand_name || 'your store'}.`} action={<div>
              <Button variant="outline" onClick={() => handleExport('inventory')}>Export Inventory</Button>
              <Button variant="outline" onClick={() => handleExport('orders')}>Export Orders</Button>
              <Button variant="primary" onClick={() => window.location.assign('/seller/products')}>Manage Products</Button>
            </div>} />

        <SellerCard>
          <div>
            <div>
              <span>Inventory Dashboard</span>
              <h2>Stock, supply, production, and quality overview</h2>
              <p>Use this workspace to monitor catalog health, recent revenue movement, and products that need replenishment.</p>
            </div>

            <div>
              <Link href="/seller/products">
                <PackagePlus size={15} />
                Add Product
              </Link>
              <Link href="/seller/inventory/stock-entries/create">
                <Boxes size={15} />
                Stock Entry
              </Link>
            </div>
          </div>
        </SellerCard>

        {loading ? <SellerCard>
            <span>Loading sales analytics...</span>
          </SellerCard> : <>
            <div>
              <StatCard label="Total Products" value={stats?.products_count || 0} support={`${stats?.products_count || 0} active products`} icon={Boxes} tone="blue" />
              <StatCard label="Sales Value" value={money(parseFloat(stats?.revenue || 0))} support={`${stats?.orders_count || 0} total orders`} icon={TrendingUp} tone="purple" />
              <StatCard label="Low Stock" value={stats?.low_stock_count || 0} support="Products that need replenishment" icon={AlertTriangle} tone="amber" />
              <StatCard label="Completed Orders" value={stats?.completed_orders_count || 0} support={`${stats?.orders_count || 0} total orders handled`} icon={ShieldCheck} tone="green" />
            </div>

            <div>
              <SellerCard>
                <div>
                  <div>
                    <h3>Sales Velocity (Past 30 Days)</h3>
                    <p>Track revenue movement across recent days.</p>
                  </div>
                  {hoveredPoint && <div>
                      <span>{hoveredPoint.date}</span>
                      <strong>{money(hoveredPoint.total)}</strong>
                    </div>}
                </div>

                <div>
                  {salesData.length > 0 ? <svg viewBox="0 0 500 200">
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => <line key={index} x1="20" y1={30 + ratio * 150} x2="480" y2={30 + ratio * 150} stroke="#e2e8f0" strokeWidth="1" />)}
                      {fillD && <path d={fillD} fill="url(#salesGradient)" />}
                      {pathD && <path d={pathD} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />}
                      {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r={hoveredPoint?.date === point.date ? 6 : 4} fill={hoveredPoint?.date === point.date ? '#0f172a' : '#1e293b'} onMouseEnter={() => setHoveredPoint(point)} onMouseLeave={() => setHoveredPoint(null)} />)}
                      {points.length > 0 && <>
                          <text x="20" y="195" fill="#64748b" fontSize="10" textAnchor="start">{points[0].date}</text>
                          <text x="250" y="195" fill="#64748b" fontSize="10" textAnchor="middle">{points[Math.floor(points.length / 2)].date}</text>
                          <text x="480" y="195" fill="#64748b" fontSize="10" textAnchor="end">{points[points.length - 1].date}</text>
                        </>}
                    </svg> : <div>No sales velocity data</div>}
                </div>
              </SellerCard>

              <SellerCard>
                <div>
                  <h3>Sales by Category</h3>
                  <p>See how sales distribute across product groups.</p>
                </div>

                <div>
                  {catData.length > 0 && totalCatValue > 0 ? <>
                      <svg viewBox="0 0 42 42">
                        {donutSlices.map((slice, index) => <circle key={index} cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke={slice.color} strokeWidth={hoveredCategory?.category === slice.category ? '5.8' : '4.5'} strokeDasharray={slice.strokeDash} strokeDashoffset={slice.strokeDashoffset} onMouseEnter={() => setHoveredCategory(slice)} onMouseLeave={() => setHoveredCategory(null)} />)}
                      </svg>

                      <div>
                        {donutSlices.map((slice, index) => <div key={index}>
                            <span>
                              <span />
                              <span>{slice.category}</span>
                            </span>
                            <strong>{Math.round(slice.percent * 100)}%</strong>
                          </div>)}
                      </div>
                    </> : <div>No category sales data</div>}
                </div>
              </SellerCard>
            </div>

            <SellerCard>
              <div>
                <div>
                  <h3>Recent Sales Activity</h3>
                  <p>Latest order line items across your catalog.</p>
                </div>
                <Link href="/seller/orders">
                  View All Orders
                  <ArrowRight size={14} />
                </Link>
              </div>

              {stats?.recent_sales && stats.recent_sales.length > 0 ? <div>
                  {stats.recent_sales.map(sale => <div key={sale.id}>
                      <div>
                        <span>{sale.product?.name || 'Removed Product'}</span>
                        <span>
                          Customer: {sale.order?.buyer?.name} ({sale.order?.buyer?.email})
                        </span>
                      </div>
                      <div>
                        <span>
                          {sale.quantity} x {money(parseFloat(sale.price), sale.currency || sale.order?.currency || 'USD')}
                        </span>
                        <span>
                          {money(parseFloat(sale.price * sale.quantity), sale.currency || sale.order?.currency || 'USD')}
                        </span>
                      </div>
                    </div>)}
                </div> : <div>No sales transactions recorded yet.</div>}
            </SellerCard>

            {stats?.low_stock_products && stats.low_stock_products.length > 0 && <SellerCard>
                <div>
                  <h3>Low Stock Alerts</h3>
                  <p>Products that are close to or below their replenishment threshold.</p>
                </div>

                <div>
                  {stats.low_stock_products.map(product => <div key={product.id}>
                      <div>
                        <span>{product.name}</span>
                        <span>
                          Qty: <strong>{product.stock_quantity}</strong> (Threshold: {product.low_stock_amount})
                        </span>
                      </div>
                      <Link href="/seller/products">
                        Restock
                      </Link>
                    </div>)}
                </div>
              </SellerCard>}
          </>}
      </SellerPageShell>
    </div>;
};
export default SellerOverview;
