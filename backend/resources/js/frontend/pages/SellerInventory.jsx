import React, { useEffect, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
  AlertTriangle,
  ArrowUpRight,
  Box,
  CheckCircle2,
  ChevronRight,
  Cuboid,
  Package,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { StockAdjustmentDrawer } from '../components/StockAdjustmentDrawer';
import { SellerCard, SellerPageHeader, SellerPageShell } from '../components/seller-workspace';

const compactCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const number = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));
const titleCase = (value) => String(value || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const toneClasses = {
  blue: 'bg-white',
  purple: 'bg-orange-50',
  amber: 'bg-white',
  green: 'bg-white',
};

const EmptyPanel = ({ icon: Icon = CheckCircle2, children }) => (
  <div className="flex items-center gap-3 border border-neutral-200 bg-neutral-100 px-4 py-4 text-sm text-neutral-700">
    <span className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white">
      <Icon size={18} />
    </span>
    <span>{children}</span>
  </div>
);

const ViewAll = ({ href }) => (
  <Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-950">
    View All
    <ChevronRight size={15} />
  </Link>
);

const StatCard = ({ label, value, caption, icon: Icon, tone = 'blue' }) => (
  <SellerCard className={`shadow-none ${toneClasses[tone]}`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</span>
        <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{value}</strong>
        <span className="mt-2 block text-sm text-neutral-600">{caption}</span>
      </div>
      <span className="inline-flex h-12 w-12 items-center justify-center border border-neutral-200 bg-white">
        <Icon size={20} />
      </span>
    </div>
  </SellerCard>
);

const MiniMetric = ({ label, value }) => (
  <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</span>
    <strong className="mt-2 block text-2xl font-semibold tracking-tight text-neutral-950">{value}</strong>
  </div>
);

const Panel = ({ title, subtitle, href, children, className = '' }) => (
  <SellerCard className={`shadow-none ${className}`}>
    <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
      <div>
        <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{title}</h3>
        {subtitle ? <p className="mt-2 text-sm leading-7 text-neutral-600">{subtitle}</p> : null}
      </div>
      {href ? <ViewAll href={href} /> : null}
    </div>
    <div className="mt-5">{children}</div>
  </SellerCard>
);

const AreaTrendChart = ({ data }) => {
  const width = 760;
  const height = 260;
  const padding = { top: 12, right: 16, bottom: 36, left: 56 };
  const maxValue = Math.max(1, ...data.flatMap((item) => [item.incoming || 0, item.outgoing || 0]));
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xFor = (index) => padding.left + (data.length <= 1 ? 0 : (index / (data.length - 1)) * chartWidth);
  const yFor = (value) => padding.top + chartHeight - ((value || 0) / maxValue) * chartHeight;
  const incomingPoints = data.map((item, index) => [xFor(index), yFor(item.incoming)]);
  const outgoingPoints = data.map((item, index) => [xFor(index), yFor(item.outgoing)]);
  const incomingPath = incomingPoints.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const outgoingPath = outgoingPoints.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const areaPath = `${incomingPath} L ${xFor(data.length - 1)} ${padding.top + chartHeight} L ${xFor(0)} ${padding.top + chartHeight} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(maxValue * ratio));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Stock movement trend" className="min-w-[760px]">
        <defs>
          <linearGradient id="inventoryTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#d4d4d4" strokeWidth="1" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fill="#737373" fontSize="11">
                {number(tick)}
              </text>
            </g>
          );
        })}
        {data.map((item, index) => {
          const x = xFor(index);
          return (
            <g key={item.label}>
              <line x1={x} x2={x} y1={padding.top} y2={padding.top + chartHeight} stroke="#f1f5f9" />
              <text x={x} y={height - 8} textAnchor="middle" fill="#737373" fontSize="11">
                {item.label}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#inventoryTrendFill)" />
        <path d={incomingPath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        <path d={outgoingPath} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
};

const BarChart = ({ data }) => {
  const maxValue = Math.max(1, ...data.map((item) => item.count || 0));
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.name} className="grid grid-cols-[minmax(0,13rem)_minmax(0,1fr)_3rem] items-center gap-3">
          <span className="truncate text-sm font-medium text-neutral-950">{item.name}</span>
          <div className="h-4 border border-neutral-200 bg-neutral-100">
            <div className="h-full bg-neutral-950" style={{ width: `${(Number(item.count || 0) / maxValue) * 100}%` }} />
          </div>
          <small className="text-right text-sm font-semibold text-neutral-700">{item.count}</small>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (!total) {
    return <EmptyPanel icon={Cuboid}>No stock entry mix yet</EmptyPanel>;
  }

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row">
      <svg viewBox="0 0 160 160" aria-label="Stock entry mix" className="h-56 w-56 shrink-0">
        <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#e5e5e5" strokeWidth="20" />
        {data.map((item, index) => {
          const length = (Number(item.count || 0) / total) * circumference;
          const dash = `${length} ${circumference - length}`;
          const segment = (
            <circle
              key={item.type}
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke={['#0f172a', '#10b981', '#f59e0b', '#ef4444'][index % 4]}
              strokeWidth="20"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return segment;
        })}
      </svg>
      <div className="grid w-full gap-3">
        {data.slice(0, 4).map((item, index) => (
          <div key={item.type} className="flex items-center justify-between border border-neutral-200 bg-neutral-50 px-4 py-3">
            <span className="inline-flex items-center gap-3 text-sm font-medium text-neutral-950">
              <span className="h-3 w-3 border border-neutral-950" style={{ backgroundColor: ['#0f172a', '#10b981', '#f59e0b', '#ef4444'][index % 4] }} />
              {titleCase(item.type)}
            </span>
            <strong className="text-sm font-semibold text-neutral-950">{number(item.count)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SellerInventory = () => {
  const { props } = usePage();
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const snapshot = props.sellerInventorySnapshot || {};
  const metrics = snapshot.metrics || {};
  const dashboard = snapshot.dashboard || {};
  const allocations = snapshot.allocations || [];
  const lowStockRows = allocations.filter((row) => Number(row.available_quantity || 0) <= Math.max(1, Number(row.safety_stock || 0))).slice(0, 4);
  const batches = snapshot.traceability?.batches || [];
  const movementTrend = useMemo(() => {
    const fallback = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01'].map((label) => ({
      label,
      incoming: 0,
      outgoing: 0,
    }));
    const rows = dashboard.movement_trend?.length ? dashboard.movement_trend : fallback;
    return rows.map((row) => ({
      ...row,
      label: row.label,
      incoming: Number(row.incoming || 0),
      outgoing: Number(row.outgoing || 0),
    }));
  }, [dashboard.movement_trend]);
  const categoryCounts = dashboard.category_counts?.length
    ? dashboard.category_counts
    : [{ name: 'Uncategorized', count: Number(metrics.products || 0) }];
  const movementMix = dashboard.movement_types || [];
  const stockEntryTotal = Number(metrics.movements || 0) + Number(metrics.adjustments || 0);

  useEffect(() => {
    setSuccess(props.flash?.success || '');
    setError(props.flash?.error || '');
  }, [props.flash]);

  return (
    <div>
      <Sidebar />

      <SellerPageShell>
        <SellerPageHeader
          title="Inventory Dashboard"
          description="Stock, supply, production, and quality overview."
          action={
            <>
              <Button variant="outline" onClick={() => router.visit('/seller/products')}>
                <Box size={16} />
                Add Product
              </Button>
              <Button variant="primary" onClick={() => setShowAdjustmentForm(true)}>
                <RefreshCw size={16} />
                Stock Entry
              </Button>
            </>
          }
        />

        {error || success ? (
          <SellerCard className={error ? 'bg-white' : 'bg-white'}>
            <p className="text-sm font-medium text-neutral-900">{error || success}</p>
          </SellerCard>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-4">
          <StatCard
            label="Total Products"
            value={number(metrics.products)}
            caption={`${number(metrics.active_products ?? metrics.products)} active products`}
            icon={Cuboid}
            tone="blue"
          />
          <StatCard
            label="Stock Value"
            value={compactCurrency(metrics.valuation)}
            caption={`${number(metrics.on_hand)} total quantity`}
            icon={ArrowUpRight}
            tone="purple"
          />
          <StatCard
            label="Low Stock"
            value={number(metrics.low_stock)}
            caption={`${number(metrics.out_of_stock)} out of stock`}
            icon={AlertTriangle}
            tone="amber"
          />
          <StatCard
            label="Traceability"
            value={number((metrics.batches || 0) + (metrics.serials || 0))}
            caption={`${number(metrics.serials)} serials tracked`}
            icon={ShieldCheck}
            tone="green"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)]">
          <Panel title="Stock Movement Trend" subtitle="Incoming versus outgoing value, last 6 months" href="/seller/inventory/stock-movements">
            <AreaTrendChart data={movementTrend} />
          </Panel>

          <Panel title="Traceability" subtitle="Batches, serials, and expiry risk" href="/seller/inventory/batch-tracking">
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniMetric label="Batches" value={number(metrics.batches)} />
              <MiniMetric label="Serials" value={number(metrics.serials)} />
              <MiniMetric label="Expired" value={number(metrics.expired_batches)} />
              <MiniMetric label="Near Expiry" value={number(metrics.near_expiry_batches)} />
            </div>
            <p className="mt-4 text-sm leading-7 text-neutral-600">Traceability data appears when batches and serial numbers exist.</p>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Panel title="Stock Health">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <MiniMetric label="In Stock" value={number(Math.max(0, Number(metrics.products || 0) - Number(metrics.out_of_stock || 0)))} />
              <MiniMetric label="Low Stock" value={number(metrics.low_stock)} />
              <MiniMetric label="Out of Stock" value={number(metrics.out_of_stock)} />
              <MiniMetric label="Stocked %" value={`${number(metrics.stocked_percent)}%`} />
            </div>
          </Panel>

          <Panel title="Traceability Status">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <MiniMetric label="Batches" value={number(metrics.batches)} />
              <MiniMetric label="Serials" value={number(metrics.serials)} />
              <MiniMetric label="Expired Batches" value={number(metrics.expired_batches)} />
              <MiniMetric label="Near Expiry" value={number(metrics.near_expiry_batches)} />
            </div>
          </Panel>

          <Panel title="QC and Delivery">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <MiniMetric label="Pending" value="0" />
              <MiniMetric label="Accepted" value="0" />
              <MiniMetric label="Rejected" value="0" />
              <MiniMetric label="Delivery Notes" value={number(metrics.open_reservations)} />
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Product Categories" subtitle="Top categories by product count" href="/seller/categories">
            <BarChart data={categoryCounts} />
          </Panel>

          <Panel title="Low Stock Watch" subtitle="Products closest to action" href="/seller/inventory/reconciliation">
            {lowStockRows.length ? (
              <div className="space-y-3">
                {lowStockRows.map((row) => (
                  <article key={row.id} className="flex items-center justify-between gap-4 border border-neutral-200 bg-neutral-50 px-4 py-4">
                    <div className="min-w-0">
                      <strong className="block truncate text-sm font-semibold text-neutral-950">{row.product_name}</strong>
                      <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-neutral-500">{row.warehouse_name}</span>
                    </div>
                    <b className="text-lg font-semibold text-neutral-950">{number(row.available_quantity)}</b>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyPanel>No low stock products</EmptyPanel>
            )}
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Recent Batches" subtitle="Latest traceable stock created in the system" href="/seller/inventory/batch-tracking">
            {batches.length ? (
              <div className="space-y-3">
                {batches.slice(0, 4).map((batch) => (
                  <article key={batch.id} className="flex items-center gap-4 border border-neutral-200 bg-neutral-50 px-4 py-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center border border-neutral-200 bg-white">
                      <Package size={18} />
                    </span>
                    <div className="min-w-0">
                      <strong className="block truncate text-base font-semibold text-neutral-950">{batch.batch_no}</strong>
                      <small className="mt-1 block text-sm text-neutral-600">
                        {batch.product?.name || 'Product'} / {number(batch.quantity)} units
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyPanel icon={Package}>No batch records yet</EmptyPanel>
            )}
          </Panel>

          <Panel title="Stock Entry Mix" subtitle="Movement types created so far" href="/seller/inventory/stock-entries">
            <DonutChart data={movementMix} />
          </Panel>
        </div>

        <Panel title="Inventory Snapshot" subtitle="Warehouse, supplier, stock entry, and reconciliation pulse">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric label="Warehouses" value={`${number(metrics.warehouses)}/${number(metrics.warehouses)}`} />
            <MiniMetric label="Vendors" value={number(props.sellerWarehouses?.length || metrics.warehouses)} />
            <MiniMetric label="Stock Entries" value={`${number(stockEntryTotal)}/${number(Math.max(stockEntryTotal, metrics.products || 0))}`} />
            <MiniMetric label="Reconciliations" value={number(metrics.adjustments)} />
          </div>
        </Panel>
      </SellerPageShell>

      <StockAdjustmentDrawer isOpen={showAdjustmentForm} onClose={() => setShowAdjustmentForm(false)} />
    </div>
  );
};

export default SellerInventory;
