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

const defaultWarehouseForm = {
  name: '',
  code: '',
  type: 'fulfillment',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  timezone: 'Asia/Kolkata',
  capacity_units: '',
  notes: '',
  default_carrier: 'Blue Dart',
};

const defaultAdjustmentForm = {
  product_id: '',
  warehouse_id: '',
  counted_quantity: '',
  reason: 'Cycle count correction',
  bin_location: '',
  safety_stock: '',
  unit_cost: '',
};

const defaultTraceabilityForm = {
  record_type: 'batch',
  product_id: '',
  warehouse_id: '',
  batch_no: '',
  manufactured_at: '',
  expires_at: '',
  quantity: '',
  serial_no: '',
  inventory_batch_id: '',
  status: 'active',
};

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
  const [warehouseForm, setWarehouseForm] = useState(defaultWarehouseForm);
  const [adjustmentForm, setAdjustmentForm] = useState(defaultAdjustmentForm);
  const [traceabilityForm, setTraceabilityForm] = useState(defaultTraceabilityForm);
  const [loadingAction, setLoadingAction] = useState('');
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
    setLoadingAction('');
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

  const setWarehouseField = (field, value) => {
    setWarehouseForm((current) => ({ ...current, [field]: value }));
  };

  const setAdjustmentField = (field, value) => {
    setAdjustmentForm((current) => ({ ...current, [field]: value }));
  };

  const setTraceabilityField = (field, value) => {
    setTraceabilityForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'record_type'
        ? {
          status: value === 'batch' ? 'active' : 'available',
          batch_no: '',
          manufactured_at: '',
          expires_at: '',
          quantity: '',
          serial_no: '',
          inventory_batch_id: '',
        }
        : {}),
    }));
  };

  const handleSubmitWarehouse = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!warehouseForm.name || !warehouseForm.code || !warehouseForm.default_carrier) {
      setError('Add warehouse name, code, and default carrier.');
      return;
    }

    setLoadingAction('warehouse');

    router.post('/warehouses', {
      ...warehouseForm,
      capacity_units: warehouseForm.capacity_units ? parseInt(warehouseForm.capacity_units, 10) : null,
    }, {
      preserveScroll: true,
      only: refreshOnly,
      onSuccess: () => {
        setWarehouseForm(defaultWarehouseForm);
        setShowWarehouseForm(false);
      },
      onError: (errors) => setError(Object.values(errors)[0] || 'Warehouse could not be created.'),
      onFinish: () => setLoadingAction(''),
    });
  };

  const handleSubmitTraceability = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!traceabilityForm.product_id) {
      setError('Choose a product before saving traceability.');
      return;
    }

    if (traceabilityForm.record_type === 'batch' && (!traceabilityForm.batch_no || traceabilityForm.quantity === '')) {
      setError('Batch number and quantity are required for lot tracking.');
      return;
    }

    if (traceabilityForm.record_type === 'serial' && !traceabilityForm.serial_no) {
      setError('Serial number is required for serial tracking.');
      return;
    }

    setLoadingAction('traceability');

    router.post('/inventory/traceability', {
      record_type: traceabilityForm.record_type,
      product_id: parseInt(traceabilityForm.product_id, 10),
      warehouse_id: traceabilityForm.warehouse_id ? parseInt(traceabilityForm.warehouse_id, 10) : null,
      batch_no: traceabilityForm.batch_no,
      manufactured_at: traceabilityForm.manufactured_at || null,
      expires_at: traceabilityForm.expires_at || null,
      quantity: traceabilityForm.quantity === '' ? null : parseInt(traceabilityForm.quantity, 10),
      serial_no: traceabilityForm.serial_no,
      inventory_batch_id: traceabilityForm.inventory_batch_id ? parseInt(traceabilityForm.inventory_batch_id, 10) : null,
      status: traceabilityForm.status,
    }, {
      preserveScroll: true,
      only: refreshOnly,
      onSuccess: () => {
        setTraceabilityForm((current) => ({
          ...defaultTraceabilityForm,
          record_type: current.record_type,
          status: current.record_type === 'batch' ? 'active' : 'available',
        }));
      },
      onError: (errors) => setError(Object.values(errors)[0] || 'Traceability record could not be saved.'),
      onFinish: () => setLoadingAction(''),
    });
  };

  const handleSubmitAdjustment = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!adjustmentForm.product_id || !adjustmentForm.warehouse_id || adjustmentForm.counted_quantity === '') {
      setError('Choose product, warehouse, and counted quantity before posting an adjustment.');
      return;
    }

    setLoadingAction('adjustment');

    router.post('/inventory/adjustments', {
      product_id: parseInt(adjustmentForm.product_id, 10),
      warehouse_id: parseInt(adjustmentForm.warehouse_id, 10),
      counted_quantity: parseInt(adjustmentForm.counted_quantity, 10),
      reason: adjustmentForm.reason,
      bin_location: adjustmentForm.bin_location,
      safety_stock: adjustmentForm.safety_stock === '' ? null : parseInt(adjustmentForm.safety_stock, 10),
      unit_cost: adjustmentForm.unit_cost === '' ? null : Number(adjustmentForm.unit_cost),
    }, {
      preserveScroll: true,
      only: refreshOnly,
      onSuccess: () => {
        setAdjustmentForm((current) => ({
          ...defaultAdjustmentForm,
          product_id: current.product_id,
          warehouse_id: current.warehouse_id,
        }));
      },
      onError: (errors) => setError(Object.values(errors)[0] || 'Inventory adjustment could not be posted.'),
      onFinish: () => setLoadingAction(''),
    });
  };

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

          <section className="inventory-control-panel">
            <div className="inventory-panel-head">
              <div>
                <span className="inventory-kicker">Stock control</span>
                <h3>Cycle count and manual adjustment</h3>
              </div>
              <span className="inventory-panel-note">
                {formatNumber(metrics.movements)} movements, {formatNumber(metrics.adjustments)} adjustments
              </span>
            </div>

            <form className="inventory-adjustment-grid" onSubmit={handleSubmitAdjustment}>
              <div className="input-container">
                <label className="input-label label-md">Product</label>
                <select
                  className="input-field"
                  value={adjustmentForm.product_id}
                  onChange={(event) => setAdjustmentField('product_id', event.target.value)}
                >
                  <option value="">Select product</option>
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>{product.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-container">
                <label className="input-label label-md">Warehouse</label>
                <select
                  className="input-field"
                  value={adjustmentForm.warehouse_id}
                  onChange={(event) => setAdjustmentField('warehouse_id', event.target.value)}
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Counted Qty"
                type="number"
                min="0"
                value={adjustmentForm.counted_quantity}
                onChange={(event) => setAdjustmentField('counted_quantity', event.target.value)}
              />

              <Input
                label="Bin Location"
                type="text"
                placeholder="Z-01/A-01/R-01/S-01/BIN-01"
                value={adjustmentForm.bin_location}
                onChange={(event) => setAdjustmentField('bin_location', event.target.value)}
              />

              <Input
                label="Safety Stock"
                type="number"
                min="0"
                value={adjustmentForm.safety_stock}
                onChange={(event) => setAdjustmentField('safety_stock', event.target.value)}
              />

              <Input
                label="Unit Cost"
                type="number"
                min="0"
                step="0.01"
                value={adjustmentForm.unit_cost}
                onChange={(event) => setAdjustmentField('unit_cost', event.target.value)}
              />

              <div className="input-container inventory-adjustment-reason">
                <label className="input-label label-md">Reason</label>
                <select
                  className="input-field"
                  value={adjustmentForm.reason}
                  onChange={(event) => setAdjustmentField('reason', event.target.value)}
                >
                  <option>Cycle count correction</option>
                  <option>Damaged stock</option>
                  <option>Found stock</option>
                  <option>Lost stock</option>
                  <option>Opening balance</option>
                  <option>Quality hold release</option>
                </select>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="inventory-submit-adjustment"
                disabled={loadingAction === 'adjustment'}
              >
                <Save size={16} />
                {loadingAction === 'adjustment' ? 'Posting' : 'Post Count'}
              </Button>
            </form>
          </section>

          {showWarehouseForm && (
            <section className="inventory-control-panel inventory-warehouse-form">
              <div className="inventory-panel-head">
                <div>
                  <span className="inventory-kicker">Warehouse master</span>
                  <h3>Create warehouse and default bin hierarchy</h3>
                </div>
                <button type="button" className="inventory-close-button" onClick={() => setShowWarehouseForm(false)} aria-label="Close warehouse form">
                  <X size={17} />
                </button>
              </div>

              <form onSubmit={handleSubmitWarehouse}>
                <div className="inventory-warehouse-grid">
                  <Input label="Warehouse Name" value={warehouseForm.name} onChange={(event) => setWarehouseField('name', event.target.value)} />
                  <Input label="Code" placeholder="WH-AHM-01" value={warehouseForm.code} onChange={(event) => setWarehouseField('code', event.target.value)} />
                  <div className="input-container">
                    <label className="input-label label-md">Type</label>
                    <select className="input-field" value={warehouseForm.type} onChange={(event) => setWarehouseField('type', event.target.value)}>
                      <option value="fulfillment">Fulfillment</option>
                      <option value="returns">Returns</option>
                      <option value="dark_store">Dark store</option>
                      <option value="3pl">3PL</option>
                      <option value="cross_dock">Cross dock</option>
                    </select>
                  </div>
                  <div className="input-container">
                    <label className="input-label label-md">Default Carrier</label>
                    <select className="input-field" value={warehouseForm.default_carrier} onChange={(event) => setWarehouseField('default_carrier', event.target.value)}>
                      {carriers.map((carrier) => (
                        <option key={carrier} value={carrier}>{carrier}</option>
                      ))}
                    </select>
                  </div>
                  <Input label="Street Address" value={warehouseForm.address} onChange={(event) => setWarehouseField('address', event.target.value)} />
                  <Input label="City" value={warehouseForm.city} onChange={(event) => setWarehouseField('city', event.target.value)} />
                  <Input label="State" value={warehouseForm.state} onChange={(event) => setWarehouseField('state', event.target.value)} />
                  <Input label="Postal Code" value={warehouseForm.postal_code} onChange={(event) => setWarehouseField('postal_code', event.target.value)} />
                  <Input label="Country" value={warehouseForm.country} onChange={(event) => setWarehouseField('country', event.target.value)} />
                  <Input label="Timezone" value={warehouseForm.timezone} onChange={(event) => setWarehouseField('timezone', event.target.value)} />
                  <Input label="Capacity Units" type="number" min="0" value={warehouseForm.capacity_units} onChange={(event) => setWarehouseField('capacity_units', event.target.value)} />
                  <div className="input-container inventory-warehouse-notes">
                    <label className="input-label label-md">Notes</label>
                    <textarea
                      className="input-field"
                      rows="3"
                      value={warehouseForm.notes}
                      onChange={(event) => setWarehouseField('notes', event.target.value)}
                    />
                  </div>
                </div>
                <div className="inventory-form-actions">
                  <Button variant="secondary" onClick={() => setShowWarehouseForm(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={loadingAction === 'warehouse'}>
                    <Plus size={16} />
                    {loadingAction === 'warehouse' ? 'Creating' : 'Create Warehouse'}
                  </Button>
                </div>
              </form>
            </section>
          )}

          <section className="inventory-split-layout">
            <div className="inventory-main-column">
              <section className="inventory-section">
                <div className="inventory-section-head">
                  <div>
                    <span className="inventory-kicker">Sellable inventory</span>
                    <h3>Warehouse allocations</h3>
                  </div>
                  <div className="inventory-search-chip">
                    <Search size={15} />
                    {formatNumber(metrics.unassigned_bins)} unassigned bins
                  </div>
                </div>

                <DataTable
                  className="inventory-allocations-table"
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
              </section>

              <section className="inventory-section">
                <div className="inventory-section-head">
                  <div>
                    <span className="inventory-kicker">Warehouse management</span>
                    <h3>Locations and bin hierarchy</h3>
                  </div>
                  <div className="inventory-location-counts">
                    <span>{formatNumber(locationCounts.zones)} zones</span>
                    <span>{formatNumber(locationCounts.aisles)} aisles</span>
                    <span>{formatNumber(locationCounts.bins)} bins</span>
                  </div>
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
                        <article className="inventory-warehouse-row" key={warehouse.id}>
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
                          <div className="inventory-location-grid">
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
              </section>
            </div>

            <aside className="inventory-side-column">
              <section className="inventory-section inventory-compact-section">
                <div className="inventory-section-head">
                  <div>
                    <span className="inventory-kicker">Audit trail</span>
                    <h3>Recent movements</h3>
                  </div>
                  <Activity size={18} />
                </div>
                <div className="inventory-event-list">
                  {movements.length === 0 ? (
                    <EmptyState
                      icon={Activity}
                      title="No movement yet"
                      copy="Stock movements appear after counts, reservations, shipments, returns, and product opening stock."
                    />
                  ) : (
                    movements.map((movement) => (
                      <div className="inventory-event" key={movement.id}>
                        <span className="inventory-event-type">{titleCase(movement.type)}</span>
                        <strong>{movement.product?.name || 'Product'}</strong>
                        <p>{movement.warehouse?.name || 'Product level'} / Qty {formatNumber(movement.quantity)} / After {formatNumber(movement.quantity_after)}</p>
                        <small>{movement.reason || 'No reason'} / {formatDate(movement.created_at)}</small>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="inventory-section inventory-compact-section">
                <div className="inventory-section-head">
                  <div>
                    <span className="inventory-kicker">Reconciliation</span>
                    <h3>Posted counts</h3>
                  </div>
                  <ClipboardCheck size={18} />
                </div>
                <div className="inventory-event-list">
                  {adjustments.length === 0 ? (
                    <EmptyState
                      icon={ClipboardCheck}
                      title="No counts posted"
                      copy="Manual cycle counts and variance corrections will show here."
                    />
                  ) : (
                    adjustments.map((adjustment) => (
                      <div className="inventory-event" key={adjustment.id}>
                        <span className={adjustment.variance_quantity < 0 ? 'inventory-event-type negative' : 'inventory-event-type'}>
                          Variance {formatNumber(adjustment.variance_quantity)}
                        </span>
                        <strong>{adjustment.product?.name || 'Product'}</strong>
                        <p>{formatNumber(adjustment.system_quantity)} system / {formatNumber(adjustment.counted_quantity)} counted</p>
                        <small>{adjustment.reason || 'Manual stock count'} / {formatDate(adjustment.created_at)}</small>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="inventory-section inventory-compact-section">
                <div className="inventory-section-head">
                  <div>
                    <span className="inventory-kicker">Traceability</span>
                    <h3>Batches and serials</h3>
                  </div>
                  <ShieldCheck size={18} />
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

              <section className="inventory-section inventory-compact-section">
                <div className="inventory-section-head">
                  <div>
                    <span className="inventory-kicker">Register traceability</span>
                    <h3>Lot or serial intake</h3>
                  </div>
                  <Archive size={18} />
                </div>
                <form className="inventory-traceability-form" onSubmit={handleSubmitTraceability}>
                  <div className="inventory-segmented-control">
                    <button
                      type="button"
                      className={traceabilityForm.record_type === 'batch' ? 'is-active' : ''}
                      onClick={() => setTraceabilityField('record_type', 'batch')}
                    >
                      Batch
                    </button>
                    <button
                      type="button"
                      className={traceabilityForm.record_type === 'serial' ? 'is-active' : ''}
                      onClick={() => setTraceabilityField('record_type', 'serial')}
                    >
                      Serial
                    </button>
                  </div>

                  <div className="input-container">
                    <label className="input-label label-md">Product</label>
                    <select
                      className="input-field"
                      value={traceabilityForm.product_id}
                      onChange={(event) => setTraceabilityField('product_id', event.target.value)}
                    >
                      <option value="">Select product</option>
                      {productOptions.map((product) => (
                        <option key={product.id} value={product.id}>{product.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-container">
                    <label className="input-label label-md">Warehouse</label>
                    <select
                      className="input-field"
                      value={traceabilityForm.warehouse_id}
                      onChange={(event) => setTraceabilityField('warehouse_id', event.target.value)}
                    >
                      <option value="">Product level</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                      ))}
                    </select>
                  </div>

                  {traceabilityForm.record_type === 'batch' ? (
                    <>
                      <Input label="Batch / Lot No." value={traceabilityForm.batch_no} onChange={(event) => setTraceabilityField('batch_no', event.target.value)} />
                      <Input label="Quantity" type="number" min="0" value={traceabilityForm.quantity} onChange={(event) => setTraceabilityField('quantity', event.target.value)} />
                      <div className="inventory-traceability-dates">
                        <Input label="Mfg Date" type="date" value={traceabilityForm.manufactured_at} onChange={(event) => setTraceabilityField('manufactured_at', event.target.value)} />
                        <Input label="Expiry" type="date" value={traceabilityForm.expires_at} onChange={(event) => setTraceabilityField('expires_at', event.target.value)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <Input label="Serial No." value={traceabilityForm.serial_no} onChange={(event) => setTraceabilityField('serial_no', event.target.value)} />
                      <div className="input-container">
                        <label className="input-label label-md">Batch Link</label>
                        <select
                          className="input-field"
                          value={traceabilityForm.inventory_batch_id}
                          onChange={(event) => setTraceabilityField('inventory_batch_id', event.target.value)}
                        >
                          <option value="">No batch link</option>
                          {(traceability.batches || []).map((batch) => (
                            <option key={batch.id} value={batch.id}>{batch.batch_no}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <Button type="submit" variant="secondary" disabled={loadingAction === 'traceability'}>
                    <Save size={16} />
                    {loadingAction === 'traceability' ? 'Saving' : 'Save Record'}
                  </Button>
                </form>
              </section>
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SellerInventory;
