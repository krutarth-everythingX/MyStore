import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { router, usePage } from '@inertiajs/react';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import { Input } from '../components/Input';
import { Warehouse, Plus, Archive, MapPin, Truck, LayoutList } from 'lucide-react';
import './SellerInventory.css';

export const SellerInventory = () => {
  const { user } = useAuth();
  const { props } = usePage();

  const [warehouses, setWarehouses] = useState(props.sellerWarehouses || []);
  const [carriers, setCarriers] = useState(props.sellerCarriers || []);
  const [products, setProducts] = useState(props.sellerProducts || []);
  const [loading, setLoading] = useState(false);

  // New warehouse states
  const [showAddWh, setShowAddWh] = useState(false);
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whAddress, setWhAddress] = useState('');
  const [whCity, setWhCity] = useState('');
  const [whState, setWhState] = useState('');
  const [whZip, setWhZip] = useState('');
  const [whCarrier, setWhCarrier] = useState('Blue Dart');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setWarehouses(props.sellerWarehouses || []);
    setCarriers(props.sellerCarriers || []);
    setProducts(props.sellerProducts || []);
    setLoading(false);
    setSuccess(props.flash?.success || '');
    setError(props.flash?.error || '');
  }, [props.flash, props.sellerCarriers, props.sellerProducts, props.sellerWarehouses]);

  const handleSubmitWarehouse = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!whName || !whCode || !whCarrier) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    router.post('/warehouses', {
      name: whName,
      code: whCode,
      address: whAddress,
      city: whCity,
      state: whState,
      postal_code: whZip,
      default_carrier: whCarrier
    }, {
      preserveScroll: true,
      preserveState: false,
      only: ['sellerWarehouses', 'sellerCarriers', 'sellerProducts', 'flash'],
      onSuccess: () => {
        setSuccess('Warehouse added successfully!');
        setWhName('');
        setWhCode('');
        setWhAddress('');
        setWhCity('');
        setWhState('');
        setWhZip('');
        setWhCarrier('Blue Dart');
        setShowAddWh(false);
      },
      onError: (errors) => {
        setError(Object.values(errors)[0] || 'An error occurred.');
      },
      onFinish: () => setLoading(false),
    });
  };

  // Prepare table data for inventory allocations
  // We extract entries from products that have warehouse relationships loaded
  const inventoryRows = [];
  products.forEach(p => {
    if (p.warehouses && p.warehouses.length > 0) {
      p.warehouses.forEach(wh => {
        inventoryRows.push({
          id: `${p.id}-${wh.id}`,
          prodName: p.name,
          sku: p.sku || 'N/A',
          whName: wh.name,
          whCode: wh.code,
          qty: wh.pivot?.quantity || 0,
          bin: wh.pivot?.bin_location || 'Unassigned',
          carrier: wh.default_carrier
        });
      });
    }
  });

  const allocationEmptyState = (
    <div className="inventory-empty-state flex-center">
      <LayoutList size={42} className="inventory-empty-icon" />
      <h4 className="title-lg">No Shelf Allocations</h4>
      <p className="body-md">
        Assign products to warehouses during creation or edit to monitor bin locations.
      </p>
    </div>
  );

  const columns = [
    {
      header: 'Product',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong>{row.prodName}</strong>
          <span style={{ fontSize: 11, color: 'var(--color-outline)' }}>SKU: {row.sku}</span>
        </div>
      )
    },
    {
      header: 'Warehouse',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong>{row.whName}</strong>
          <span style={{ fontSize: 11, color: 'var(--color-outline)' }}>{row.whCode}</span>
        </div>
      )
    },
    {
      header: 'Shelf Bin Location',
      field: 'bin'
    },
    {
      header: 'Fulfillment Courier',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Truck size={14} style={{ color: 'var(--color-outline)' }} />
          {row.carrier}
        </span>
      )
    },
    {
      header: 'In Stock Qty',
      align: 'right',
      render: (row) => (
        <strong style={{ color: row.qty <= 2 ? 'var(--color-error)' : 'var(--color-primary)' }}>
          {row.qty}
        </strong>
      )
    }
  ];

  return (
    <div className="seller-dashboard-layout">
      <Sidebar />

      <div className="seller-dashboard-content animate-fade-in">
        <div className="seller-dashboard-container container">
          {/* Header */}
          <div className="seller-page-header">
            <div className="seller-page-title-block">
              <h2 className="headline-lg">Inventory & Warehouses</h2>
              <p className="body-md" style={{ color: 'var(--color-outline)' }}>
                Configure warehouses, shipping carriers, and track exact product stock shelf locations.
              </p>
            </div>
            {!showAddWh && (
              <Button variant="primary" className="inventory-add-btn" onClick={() => setShowAddWh(true)}>
                <Plus size={16} style={{ marginRight: 6 }} />
                Add Warehouse
              </Button>
            )}
          </div>

          {showAddWh ? (
            /* Add Warehouse Form */
            <Card title="Add New Warehouse Location">
              {error && <div className="inventory-alert inventory-alert-error body-md">{error}</div>}
              {success && <div className="inventory-alert inventory-alert-success body-md">{success}</div>}

              <form onSubmit={handleSubmitWarehouse}>
                <div className="inventory-form-grid">
                  <div className="inventory-form-section">
                    <h5 className="form-section-title label-md">Warehouse Identifiers</h5>
                    <Input
                      label="Warehouse Name *"
                      type="text"
                      placeholder="E.g. Central Depot LA"
                      value={whName}
                      onChange={(e) => setWhName(e.target.value)}
                      required
                    />
                    <Input
                      label="Unique Warehouse Code *"
                      type="text"
                      placeholder="E.g. WH-LA-02"
                      value={whCode}
                      onChange={(e) => setWhCode(e.target.value)}
                      required
                    />
                    <div className="input-container">
                      <label className="input-label label-md">Default Shipping Carrier *</label>
                      <select
                        className="input-field"
                        value={whCarrier}
                        onChange={(e) => setWhCarrier(e.target.value)}
                        required
                      >
                        {carriers.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="inventory-form-section">
                    <h5 className="form-section-title label-md">Location Address</h5>
                    <div className="input-container">
                      <label className="input-label label-md">Street Address</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="E.g. 50 Commerce Way"
                        value={whAddress}
                        onChange={(e) => setWhAddress(e.target.value)}
                      />
                    </div>
                    <div className="inventory-subfields">
                      <Input
                        label="City"
                        type="text"
                        placeholder="Los Angeles"
                        value={whCity}
                        onChange={(e) => setWhCity(e.target.value)}
                      />
                      <Input
                        label="State"
                        type="text"
                        placeholder="CA"
                        value={whState}
                        onChange={(e) => setWhState(e.target.value)}
                      />
                    </div>
                    <Input
                      label="ZIP / Postal Code"
                      type="text"
                      placeholder="90015"
                      value={whZip}
                      onChange={(e) => setWhZip(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-buttons-row" style={{ marginTop: 24 }}>
                  <Button variant="secondary" onClick={() => setShowAddWh(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Create Warehouse
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <>
              {/* Warehouses Grid List */}
              <div className="warehouses-grid-list">
                {warehouses.map((wh) => (
                  <Card key={wh.id} title={wh.name} className="warehouse-card">
                    <div className="wh-info-blocks">
                      <div className="wh-info-block body-md">
                        <Archive className="wh-info-icon" size={16} />
                        <span>Code: <strong>{wh.code}</strong></span>
                      </div>
                      <div className="wh-info-block body-md">
                        <MapPin className="wh-info-icon" size={16} />
                        <span>Address: {wh.address ? `${wh.address}, ${wh.city || ''}, ${wh.state || ''} ${wh.postal_code || ''}` : 'No address provided'}</span>
                      </div>
                      <div className="wh-info-block body-md">
                        <Truck className="wh-info-icon" size={16} />
                        <span>Default Carrier: <strong style={{ color: 'var(--color-primary)' }}>{wh.default_carrier}</strong></span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Inventory Stock Allocations Table */}
              <Card title="Product Shelf Allocations (Bin Locations)" className="inventory-allocations-card">
                <DataTable
                  className="inventory-allocations-table"
                  columns={columns}
                  data={inventoryRows}
                  emptyMessage={allocationEmptyState}
                />

                <div className="inventory-mobile-allocations">
                  {inventoryRows.length === 0 ? (
                    allocationEmptyState
                  ) : (
                    inventoryRows.map((row) => (
                      <article key={row.id} className="inventory-allocation-card">
                        <div className="inventory-allocation-top">
                          <div>
                            <h3>{row.prodName}</h3>
                            <span>SKU: {row.sku}</span>
                          </div>
                          <strong className={row.qty <= 2 ? 'qty-low' : ''}>{row.qty}</strong>
                        </div>
                        <div className="inventory-allocation-grid">
                          <div>
                            <span>Warehouse</span>
                            <strong>{row.whName}</strong>
                            <small>{row.whCode}</small>
                          </div>
                          <div>
                            <span>Bin</span>
                            <strong>{row.bin}</strong>
                          </div>
                          <div>
                            <span>Carrier</span>
                            <strong>{row.carrier}</strong>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default SellerInventory;
