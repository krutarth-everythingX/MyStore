import React, { useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Layers,
  LayoutList,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Truck,
  Warehouse,
  X,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import { Input } from '../components/Input';
import { RightDrawer } from '../components/RightDrawer';
import { WarehouseDrawer } from '../components/WarehouseDrawer';
import { StockAdjustmentDrawer } from '../components/StockAdjustmentDrawer';
import { TraceabilityDrawer } from '../components/TraceabilityDrawer';
import './SellerInventory.css';

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return 'Not recorded';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const titleCase = (value) => String(value || 'unknown')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const firstBinPath = (warehouse) => {
  const zone = warehouse?.zones?.[0];
  const aisle = zone?.aisles?.[0];
  const rack = aisle?.racks?.[0];
  const shelf = rack?.shelves?.[0];
  const bin = shelf?.bins?.[0];

  return [zone?.code, aisle?.code, rack?.code, shelf?.code, bin?.code].filter(Boolean).join(' / ') || 'No bin mapped';
};

const locationTotals = (warehouse) => {
  const zones = warehouse?.zones || [];
  const aisles = zones.flatMap((zone) => zone.aisles || []);
  const racks = aisles.flatMap((aisle) => aisle.racks || []);
  const shelves = racks.flatMap((rack) => rack.shelves || []);
  const bins = shelves.flatMap((shelf) => shelf.bins || []);

  return {
    zones: zones.length,
    aisles: aisles.length,
    racks: racks.length,
    shelves: shelves.length,
    bins: bins.length,
  };
};

const MetricItem = ({ icon: Icon, label, value, tone = 'neutral' }) => (
  <div className={`inventory-metric inventory-metric-${tone}`}>
    <span className="inventory-metric-icon"><Icon size={16} /></span>
    <span className="inventory-metric-copy">
      <strong>{value}</strong>
      <small>{label}</small>
    </span>
  </div>
);

const EmptyState = ({ icon: Icon = LayoutList, title, copy }) => (
  <div className="inventory-empty-state">
    <Icon size={36} className="inventory-empty-icon" />
    <h4>{title}</h4>
    <p>{copy}</p>
  </div>
);

export const SellerInventory = () => {
  const { props } = usePage();
  const [warehouses, setWarehouses] = useState(props.sellerWarehouses || []);
  const [carriers, setCarriers] = useState(props.sellerCarriers || []);
  const [products, setProducts] = useState(props.sellerProducts || []);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [showTraceabilityForm, setShowTraceabilityForm] = useState(false);
  const [showLocationDrawer, setShowLocationDrawer] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const snapshot = props.sellerInventorySnapshot || {};
  const metrics = snapshot.metrics || {};
  const locationCounts = snapshot.location_counts || {};
  const allocations = snapshot.allocations || [];
  const movements = snapshot.recent_movements || [];
  const adjustments = snapshot.recent_adjustments || [];
  const traceability = snapshot.traceability || {};

  useEffect(() => {
    setWarehouses(props.sellerWarehouses || []);
    setCarriers(props.sellerCarriers || []);
    setProducts(props.sellerProducts || []);
    setSuccess(props.flash?.success || '');
    setError(props.flash?.error || '');
  }, [
    props.flash,
    props.sellerCarriers,
    props.sellerInventorySnapshot,
    props.sellerProducts,
    props.sellerWarehouses,
  ]);

  const productOptions = useMemo(() => (
    products
      .filter((product) => product.type !== 'variation')
      .map((product) => ({
        id: product.id,
        label: `${product.name} (${product.sku || product.mystore_product_id || `#${product.id}`})`,
      }))
  ), [products]);

  const refreshOnly = [
    'sellerWarehouses',
    'sellerCarriers',
    'sellerProducts',
    'sellerInventorySnapshot',
    'flash',
  ];

  const allocationColumns = [
    {
      header: 'Product',
      render: (row) => (
        <div className="inventory-table-product">
          <strong>{row.product_name}</strong>
          <span>{row.sku || 'No SKU'}</span>
        </div>
      ),
    },
    {
      header: 'Location',
      render: (row) => (
        <div className="inventory-table-location">
          <strong>{row.warehouse_name}</strong>
          <span>{row.warehouse_code} / {row.bin_location || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      header: 'On Hand',
      align: 'right',
      render: (row) => <strong>{formatNumber(row.quantity)}</strong>,
    },
    {
      header: 'Available',
      align: 'right',
      render: (row) => (
        <span className={row.available_quantity <= row.safety_stock ? 'inventory-number-low' : ''}>
          {formatNumber(row.available_quantity)}
        </span>
      ),
    },
    {
      header: 'Reserved',
      align: 'right',
      render: (row) => formatNumber(row.reserved_quantity),
    },
    {
      header: 'Safety',
      align: 'right',
      render: (row) => formatNumber(row.safety_stock),
    },
    {
      header: 'Value',
      align: 'right',
      render: (row) => formatCurrency(row.valuation),
    },
    {
      header: 'Status',
      render: (row) => <span className={`inventory-status ${row.stock_status}`}>{titleCase(row.stock_status)}</span>,
    },
  ];

  return (
    <div className="seller-dashboard-layout">
      <Sidebar />

      <div className="seller-dashboard-content animate-fade-in">
        <div className="seller-dashboard-container container inventory-page">
          <div className="seller-page-header inventory-header">
            <div className="seller-page-title-block">
              <span className="inventory-kicker">PIM and WMS control</span>
              <h2 className="headline-lg">Inventory Operations</h2>
              <p>
                Manage product stock, warehouse locations, reservations, cycle counts, batches, serials, and audit movement from one seller workspace.
              </p>
            </div>
            <div className="inventory-header-actions">
              <Button variant="secondary" onClick={() => router.reload({ only: refreshOnly })}>
                <RefreshCw size={16} />
                Refresh
              </Button>
              <Button variant="secondary" onClick={() => setShowAdjustmentForm(true)}>
                Adjust Stock
              </Button>
              <Button variant="primary" onClick={() => setShowWarehouseForm(true)}>
                <Plus size={16} />
                Warehouse
              </Button>
            </div>
          </div>

          {(error || success) && (
            <div className={`inventory-alert ${error ? 'inventory-alert-error' : 'inventory-alert-success'}`}>
              {error || success}
            </div>
          )}

          <section className="inventory-metrics-strip" aria-label="Inventory summary">
            <MetricItem icon={Package} label="Products" value={formatNumber(metrics.products)} />
            <MetricItem icon={Warehouse} label="Warehouses" value={formatNumber(metrics.warehouses)} />
            <MetricItem icon={Boxes} label="On hand" value={formatNumber(metrics.on_hand)} />
            <MetricItem icon={ClipboardCheck} label="Available" value={formatNumber(metrics.available)} tone="success" />
            <MetricItem icon={Archive} label="Reserved" value={formatNumber(metrics.reserved)} />
            <MetricItem icon={AlertTriangle} label="Low stock" value={formatNumber(metrics.low_stock)} tone={metrics.low_stock ? 'warning' : 'neutral'} />
            <MetricItem icon={BarChart3} label="Valuation" value={formatCurrency(metrics.valuation)} />
            <MetricItem icon={ShieldCheck} label="Batches / Serials" value={`${formatNumber(metrics.batches)} / ${formatNumber(metrics.serials)}`} />
          </section>

          <section className="inventory-section">
            <div className="inventory-section-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="inventory-kicker">Sellable inventory</span>
                <h3>Warehouse allocations</h3>
              </div>
              <div className="inventory-allocation-actions">
                <Button variant="secondary" onClick={() => setShowLocationDrawer(true)} style={{ padding: '8px 14px', fontSize: '12px', minHeight: 'auto', whiteSpace: 'nowrap' }}>
                  Locations & Bins
                </Button>
                <div className="inventory-search-chip" style={{ whiteSpace: 'nowrap' }}>
                  {formatNumber(metrics.unassigned_bins)} unassigned bins
                </div>
              </div>
            </div>

            <DataTable
              className="inventory-allocations-table desktop-only"
              columns={allocationColumns}
              data={allocations}
              emptyMessage={(
                <EmptyState
                  icon={LayoutList}
                  title="No stock allocations"
                  copy="Create a product with warehouse stock or post a manual count to start tracking on-hand, available, reserved, and safety stock."
                />
              )}
            />

            <div className="mobile-only mobile-allocations-list">
              {allocations.length === 0 ? (
                <EmptyState icon={LayoutList} title="No stock allocations" />
              ) : (
                allocations.map((row) => (
                  <div key={`${row.product_id}-${row.warehouse_id}`} className="mobile-allocation-card" onClick={() => setSelectedAllocation(row)}>
                    <div className="mobile-allocation-head" style={{ flexDirection: 'row', marginBottom: 0, paddingBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                        <strong style={{ display: 'block', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.product_name}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--inventory-muted)', display: 'block', marginTop: '4px', fontWeight: 500 }}>{row.warehouse_name}</span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <strong style={{ fontSize: '16px', display: 'block', color: 'var(--color-primary)' }}>{formatNumber(row.available_quantity)}</strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Bottom layout: Grid for Counts & Traceability, then full-width Recent Movements */}
          <section className="inventory-dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {adjustments.length > 0 && (
              <section className="inventory-section">
                <div className="inventory-section-head">
                  <div>
                    <span className="inventory-kicker">Reconciliation</span>
                    <h3>Posted counts</h3>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button type="button" onClick={() => setShowAdjustmentForm(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-outline)', display: 'flex', alignItems: 'center' }}>
                      <Plus size={18} />
                    </button>
                    <ClipboardCheck size={18} style={{ color: 'var(--color-outline)' }} />
                  </div>
                </div>
                <div className="inventory-event-list">
                  {adjustments.map((adjustment) => (
                    <div className="inventory-event" key={adjustment.id}>
                      <span className={adjustment.variance_quantity < 0 ? 'inventory-event-type negative' : 'inventory-event-type'}>
                        Variance {formatNumber(adjustment.variance_quantity)}
                      </span>
                      <strong>{adjustment.product?.name || 'Product'}</strong>
                      <p>{formatNumber(adjustment.system_quantity)} system / {formatNumber(adjustment.counted_quantity)} counted</p>
                      <small>{adjustment.reason || 'Manual stock count'} / {formatDate(adjustment.created_at)}</small>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="inventory-section inventory-compact-section">
              <div className="inventory-section-head" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span className="inventory-kicker">Traceability</span>
                  <h3 style={{ whiteSpace: 'nowrap' }}>Batches and serials</h3>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button variant="secondary" onClick={() => setShowTraceabilityForm(true)} style={{ padding: '8px 14px', fontSize: '12px', minHeight: 'auto' }}>
                    <Plus size={14} style={{ marginRight: 4 }} />
                    Register<span className="desktop-only">&nbsp;Traceability</span>
                  </Button>
                </div>
              </div>
              <div className="inventory-traceability">
                <div>
                  <strong>Recent batches</strong>
                  {(traceability.batches || []).length === 0 ? (
                    <p>No batch or lot records yet.</p>
                  ) : (
                    (traceability.batches || []).map((batch) => (
                      <span key={batch.id}>{batch.batch_no} / {batch.product?.name || 'Product'} / {formatNumber(batch.quantity)}</span>
                    ))
                  )}
                </div>
                <div>
                  <strong>Recent serials</strong>
                  {(traceability.serials || []).length === 0 ? (
                    <p>No serial records yet.</p>
                  ) : (
                    (traceability.serials || []).map((serial) => (
                      <span key={serial.id}>{serial.serial_no} / {serial.product?.name || 'Product'} / {titleCase(serial.status)}</span>
                    ))
                  )}
                </div>
              </div>
            </section>
          </section>

          <section className="inventory-section">
            <div className="inventory-section-head" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="inventory-kicker">Audit Trail</span>
                <h3>Recent movements</h3>
              </div>
            </div>
            <div className="desktop-only">
              <div className="inventory-movement-list">
                {movements.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="No movements yet"
                    copy="Stock movements, adjustments, and receipts will appear here."
                  />
                ) : (
                  movements.map((movement) => (
                    <div key={movement.id} className="inventory-movement-item">
                      <div className="inventory-movement-header">
                        <strong>{movement.product?.name || 'Unknown Product'}</strong>
                        <span className="inventory-movement-type">{titleCase(movement.type)}</span>
                      </div>
                      <div className="inventory-movement-details">
                        <p>
                          <span style={{ color: 'var(--color-on-surface)' }}>{movement.warehouse?.name || 'Unknown Location'}</span>
                          <span style={{ margin: '0 8px', color: 'var(--inventory-line)' }}>|</span>
                          Qty Change: <strong style={{ color: movement.quantity > 0 ? 'var(--color-success)' : movement.quantity < 0 ? 'var(--color-error)' : 'inherit' }}>{movement.quantity > 0 ? '+' : ''}{formatNumber(movement.quantity)}</strong>
                        </p>
                        <p style={{ marginTop: '4px' }}>
                          Final: <strong>{formatNumber(movement.after_quantity)}</strong>
                        </p>
                      </div>
                      <div className="inventory-movement-footer">
                        <small>{movement.reason || 'No reason provided'}</small>
                        <small>{formatDate(movement.created_at)}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="mobile-only">
              <div className="inventory-movement-list">
                {movements.length === 0 ? (
                  <EmptyState icon={Activity} title="No movements yet" copy="Stock movements will appear here." />
                ) : (
                  movements.slice(0, 3).map((movement) => (
                    <div key={movement.id} className="inventory-movement-item" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setSelectedMovement(movement)}>
                      <div className="inventory-movement-header" style={{ marginBottom: 0 }}>
                        <strong>{movement.product?.name || 'Unknown Product'}</strong>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          Qty Change: <strong style={{ color: movement.quantity > 0 ? 'var(--color-success)' : movement.quantity < 0 ? 'var(--color-error)' : 'inherit' }}>{movement.quantity > 0 ? '+' : ''}{formatNumber(movement.quantity)}</strong>
                        </span>
                        <span className="inventory-movement-type" style={{ fontSize: '10px', padding: '2px 6px' }}>{titleCase(movement.type)}</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <WarehouseDrawer isOpen={showWarehouseForm} onClose={() => setShowWarehouseForm(false)} />
      <StockAdjustmentDrawer isOpen={showAdjustmentForm} onClose={() => setShowAdjustmentForm(false)} />
      <TraceabilityDrawer isOpen={showTraceabilityForm} onClose={() => setShowTraceabilityForm(false)} />

      <RightDrawer isOpen={showLocationDrawer} onClose={() => setShowLocationDrawer(false)} title="Locations and Bin Hierarchy">
        <div className="inventory-location-counts" style={{ alignSelf: 'flex-start' }}>
          <span>{formatNumber(locationCounts.zones)} zones</span>
          <span>{formatNumber(locationCounts.aisles)} aisles</span>
          <span>{formatNumber(locationCounts.bins)} bins</span>
        </div>
        <div className="inventory-warehouse-list">
          {warehouses.length === 0 ? (
            <EmptyState
              icon={Warehouse}
              title="No warehouses yet"
              copy="Create a warehouse to seed the first zone, aisle, rack, shelf, and pick bin."
            />
          ) : (
            warehouses.map((warehouse) => {
              const totals = locationTotals(warehouse);

              return (
                <article className="inventory-warehouse-row" key={warehouse.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                  <div className="inventory-warehouse-title">
                    <span className="inventory-warehouse-icon"><Warehouse size={18} /></span>
                    <div>
                      <h4>{warehouse.name}</h4>
                      <p>{warehouse.code} / {titleCase(warehouse.type)} / {titleCase(warehouse.status)}</p>
                    </div>
                  </div>
                  <div className="inventory-warehouse-meta">
                    <span><MapPin size={14} />{[warehouse.city, warehouse.state, warehouse.country].filter(Boolean).join(', ') || 'No address'}</span>
                    <span><Truck size={14} />{warehouse.default_carrier || 'No carrier'}</span>
                    <span><Layers size={14} />{firstBinPath(warehouse)}</span>
                  </div>
                  <div className="inventory-location-grid" style={{ width: '100%' }}>
                    <span>{totals.zones} Zones</span>
                    <span>{totals.aisles} Aisles</span>
                    <span>{totals.racks} Racks</span>
                    <span>{totals.shelves} Shelves</span>
                    <span>{totals.bins} Bins</span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </RightDrawer>

      <div className={`bottom-sheet-overlay ${selectedMovement ? 'is-open' : ''}`} onClick={() => setSelectedMovement(null)}>
        <div className="bottom-sheet-container" onClick={(e) => e.stopPropagation()}>
          <div className="bottom-sheet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--inventory-line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '750', color: 'var(--color-on-surface)' }}>Movement Details</h4>
              {selectedMovement && (
                <span className="inventory-movement-type" style={{ fontSize: '10px', padding: '4px 8px', display: 'inline-flex', background: 'var(--color-surface-variant)', color: 'var(--color-on-surface)', borderRadius: '20px', fontWeight: '700', letterSpacing: '0.05em' }}>
                  {titleCase(selectedMovement.type)}
                </span>
              )}
            </div>
            <button className="bottom-sheet-close" onClick={() => setSelectedMovement(null)}>
              <X size={18} />
            </button>
          </div>
          <div className="bottom-sheet-content" style={{ padding: '12px 20px 20px' }}>
            {selectedMovement && (
              <div className="inventory-movement-item" style={{ border: 'none', padding: 0, boxShadow: 'none', background: 'transparent' }}>
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <strong style={{ fontSize: '20px', display: 'block', lineHeight: 1.2, color: 'var(--color-on-surface)' }}>
                    {selectedMovement.product?.name || 'Unknown Product'}
                  </strong>
                </div>
                <div className="inventory-movement-details" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'var(--color-surface-variant)', padding: '12px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <small style={{ color: 'var(--color-outline)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity Change</small>
                      <span style={{ fontSize: '24px', fontWeight: '800', color: selectedMovement.quantity > 0 ? 'var(--color-success)' : selectedMovement.quantity < 0 ? 'var(--color-error)' : 'var(--color-on-surface)' }}>
                        {selectedMovement.quantity > 0 ? '+' : ''}{formatNumber(selectedMovement.quantity)}
                      </span>
                    </div>
                    <div style={{ background: 'var(--color-surface-variant)', padding: '12px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <small style={{ color: 'var(--color-outline)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Final Quantity</small>
                      <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-on-surface)' }}>
                        {formatNumber(selectedMovement.after_quantity)}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '12px 16px', border: '1px solid var(--inventory-line)', borderRadius: '12px', background: 'var(--color-surface)' }}>
                    <small style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-outline)', marginBottom: '4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <MapPin size={12} /> Location
                    </small>
                    <span style={{ fontSize: '14px', color: 'var(--color-on-surface)', fontWeight: 600 }}>{selectedMovement.warehouse?.name || 'Unknown Location'}</span>
                  </div>

                  <div style={{ padding: '12px 16px', border: '1px solid var(--inventory-line)', borderRadius: '12px', background: 'var(--color-surface)' }}>
                    <small style={{ display: 'block', color: 'var(--color-outline)', marginBottom: '4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason</small>
                    <span style={{ fontSize: '14px', color: 'var(--color-on-surface)', lineHeight: 1.4 }}>{selectedMovement.reason || 'No reason provided'}</span>
                  </div>

                  <div style={{ padding: '12px 16px', background: 'rgba(26, 28, 26, 0.03)', borderRadius: '12px', textAlign: 'center', marginTop: '4px' }}>
                    <small style={{ display: 'block', color: 'var(--color-outline)', marginBottom: '2px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logged At</small>
                    <span style={{ fontSize: '13px', color: 'var(--color-on-surface)', fontWeight: 500 }}>{formatDate(selectedMovement.created_at)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <RightDrawer isOpen={!!selectedAllocation} onClose={() => setSelectedAllocation(null)} title="Allocation Details">
        {selectedAllocation && (
          <>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 750, color: 'var(--color-on-surface)' }}>{selectedAllocation.product_name}</h4>
              <span style={{ fontSize: '13px', color: 'var(--color-outline)', fontWeight: 650 }}>{selectedAllocation.sku || 'No SKU'}</span>
            </div>

            <div>
              <strong style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-outline)', letterSpacing: '0.05em' }}>Location</strong>
              <div style={{ color: 'var(--color-on-surface)', fontSize: '15px', fontWeight: 650 }}>{selectedAllocation.warehouse_name}</div>
              <div style={{ color: 'var(--color-outline)', fontSize: '13px' }}>{selectedAllocation.warehouse_code} / {selectedAllocation.bin_location || 'Unassigned'}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', borderRadius: '16px', background: 'rgba(26, 28, 26, 0.04)' }}>
              <div>
                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-outline)', letterSpacing: '0.05em', marginBottom: '4px' }}>On Hand</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-on-surface)' }}>{formatNumber(selectedAllocation.quantity)}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-outline)', letterSpacing: '0.05em', marginBottom: '4px' }}>Available</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-on-surface)' }}>{formatNumber(selectedAllocation.available_quantity)}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-outline)', letterSpacing: '0.05em', marginBottom: '4px' }}>Reserved</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-on-surface)' }}>{formatNumber(selectedAllocation.reserved_quantity)}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-outline)', letterSpacing: '0.05em', marginBottom: '4px' }}>Safety Stock</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-on-surface)' }}>{formatNumber(selectedAllocation.safety_stock)}</strong>
              </div>
            </div>

            <div style={{ paddingTop: '20px', borderTop: '1px solid var(--inventory-line)', marginTop: 'auto' }}>
              <span className={`inventory-status ${selectedAllocation.stock_status}`}>{titleCase(selectedAllocation.stock_status)}</span>
              <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--color-on-surface)' }}>
                <strong>Valuation:</strong> {formatCurrency(selectedAllocation.valuation)}
              </div>
            </div>
          </>
        )}
      </RightDrawer>
    </div>
  );
};

export default SellerInventory;
