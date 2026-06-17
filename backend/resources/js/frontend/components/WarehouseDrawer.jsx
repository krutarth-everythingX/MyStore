import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { RightDrawer } from './RightDrawer';
import { Button } from './Button';
import { Input } from './Input';
import '../pages/SellerInventory.css';

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

export const WarehouseDrawer = ({ isOpen, onClose }) => {
  const { props } = usePage();
  const carriers = props.sellerCarriers || [];
  const warehouses = props.sellerWarehouses || [];
  
  const [warehouseForm, setWarehouseForm] = useState(defaultWarehouseForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSuccess('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const setWarehouseField = (field, value) => {
    setWarehouseForm((current) => ({ ...current, [field]: value }));
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this warehouse?')) {
      router.delete(`/warehouses/${id}`, {
        preserveScroll: true,
        only: ['sellerWarehouses', 'flash'],
        onSuccess: () => {
          setSuccess('Warehouse deleted successfully.');
          if (editingId === id) handleCancelEdit();
        },
        onError: () => setError('Warehouse could not be deleted.')
      });
    }
  };

  const handleEdit = (warehouse) => {
    setEditingId(warehouse.id);
    setWarehouseForm({
      name: warehouse.name || '',
      code: warehouse.code || '',
      type: warehouse.type || 'fulfillment',
      address: warehouse.address || '',
      city: warehouse.city || '',
      state: warehouse.state || '',
      postal_code: warehouse.postal_code || '',
      country: warehouse.country || '',
      timezone: warehouse.timezone || 'Asia/Kolkata',
      capacity_units: warehouse.capacity_units || '',
      notes: warehouse.notes || '',
      default_carrier: warehouse.default_carrier || 'Blue Dart',
    });
    setSuccess('');
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setWarehouseForm(defaultWarehouseForm);
    setSuccess('');
    setError('');
  };

  const handleSubmitWarehouse = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!warehouseForm.name || !warehouseForm.code || !warehouseForm.default_carrier) {
      setError('Add warehouse name, code, and default carrier.');
      return;
    }

    setLoading(true);

    const requestData = {
      ...warehouseForm,
      capacity_units: warehouseForm.capacity_units ? parseInt(warehouseForm.capacity_units, 10) : null,
    };

    const requestOptions = {
      preserveScroll: true,
      preserveState: true,
      only: ['sellerWarehouses', 'sellerInventorySnapshot', 'flash'],
      onSuccess: () => {
        setWarehouseForm(defaultWarehouseForm);
        setEditingId(null);
        setSuccess(`Warehouse ${editingId ? 'updated' : 'created'} successfully.`);
      },
      onError: (errors) => setError(Object.values(errors)[0] || `Warehouse could not be ${editingId ? 'updated' : 'created'}.`),
      onFinish: () => setLoading(false),
    };

    if (editingId) {
      router.put(`/warehouses/${editingId}`, requestData, requestOptions);
    } else {
      router.post('/warehouses', requestData, requestOptions);
    }
  };

  return (
    <RightDrawer isOpen={isOpen} onClose={onClose} title="Manage Warehouses">
        {(error || success) && (
          <div style={{ color: error ? 'var(--color-error)' : '#2e7d32', fontSize: '14px', fontWeight: 600, marginBottom: 16 }}>
            {error || success}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <form className="seller-category-form" onSubmit={handleSubmitWarehouse} style={{ position: 'static', padding: 24, gap: 16, boxShadow: 'none', border: '1px solid rgba(26,28,26,0.08)' }}>
            <div className="seller-category-form-head">
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>{editingId ? 'Edit Warehouse' : 'Add New Warehouse'}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-outline)' }}>
                  {editingId ? 'Edit an existing warehouse.' : 'Create a new warehouse and default bin hierarchy.'}
                </p>
              </div>
            </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <Input label="Warehouse Name" value={warehouseForm.name} onChange={(event) => setWarehouseField('name', event.target.value)} required />
              <Input label="Code" placeholder="WH-AHM-01" value={warehouseForm.code} onChange={(event) => setWarehouseField('code', event.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-container" style={{ marginBottom: 0 }}>
                <label className="input-label label-md">Type</label>
                <select className="input-field" value={warehouseForm.type} onChange={(event) => setWarehouseField('type', event.target.value)}>
                  <option value="fulfillment">Fulfillment</option>
                  <option value="returns">Returns</option>
                  <option value="dark_store">Dark store</option>
                  <option value="3pl">3PL</option>
                  <option value="cross_dock">Cross dock</option>
                </select>
              </div>
              <div className="input-container" style={{ marginBottom: 0 }}>
                <label className="input-label label-md">Default Carrier</label>
                <select className="input-field" value={warehouseForm.default_carrier} onChange={(event) => setWarehouseField('default_carrier', event.target.value)}>
                  {carriers.map((carrier) => (
                    <option key={carrier} value={carrier}>{carrier}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="input-container" style={{ marginBottom: 0 }}>
              <label className="input-label label-md">Street Address</label>
              <textarea
                className="input-field"
                rows="2"
                style={{ padding: '10px 14px' }}
                value={warehouseForm.address}
                onChange={(event) => setWarehouseField('address', event.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Input label="City" value={warehouseForm.city} onChange={(event) => setWarehouseField('city', event.target.value)} />
              <Input label="State" value={warehouseForm.state} onChange={(event) => setWarehouseField('state', event.target.value)} />
              <Input label="Country" value={warehouseForm.country} onChange={(event) => setWarehouseField('country', event.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Input label="Postal Code" value={warehouseForm.postal_code} onChange={(event) => setWarehouseField('postal_code', event.target.value)} />
              <Input label="Timezone" value={warehouseForm.timezone} onChange={(event) => setWarehouseField('timezone', event.target.value)} />
              <Input label="Capacity Units" type="number" min="0" value={warehouseForm.capacity_units} onChange={(event) => setWarehouseField('capacity_units', event.target.value)} />
            </div>
          </div>
          <div className="inventory-form-actions" style={{ marginTop: 0, paddingTop: 16, borderTop: 'none', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="secondary" onClick={editingId ? handleCancelEdit : onClose} type="button" style={{ width: 'fit-content' }}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading} style={{ width: 'fit-content' }}>
              {!editingId && <Plus size={16} />}
              {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>

        {/* Existing Warehouses List */}
        <div className="seller-category-panel" style={{ padding: 24, boxShadow: 'none', border: '1px solid rgba(26,28,26,0.08)' }}>
          <div className="seller-category-panel-head" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>Existing Warehouses</h3>
            </div>
          </div>
          
          {warehouses.length === 0 ? (
            <div className="seller-category-empty" style={{ minHeight: 150 }}>
              <h3 style={{ fontSize: 15, margin: '8px 0 4px' }}>No warehouses yet</h3>
              <p style={{ fontSize: 13, margin: 0 }}>Create your first warehouse above.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {warehouses.map((w) => (
                <article key={w.id} className="seller-category-row" style={{ gridTemplateColumns: 'minmax(0, 1fr) auto', padding: '16px', alignItems: 'flex-start' }}>
                  <div className="seller-category-row-main" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 650, color: 'var(--color-on-surface)' }}>{w.name}</h3>
                      <span style={{ fontSize: '11px', background: 'rgba(26,28,26,0.06)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{w.code}</span>
                    </div>
                    {w.address && <p style={{ margin: 0, fontSize: 13, color: 'var(--color-outline)' }}>{w.address}{w.city ? `, ${w.city}` : ''}{w.state ? `, ${w.state}` : ''} {w.postal_code}</p>}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: 4 }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-outline)' }}>Type: <strong style={{ color: 'var(--color-on-surface)', textTransform: 'capitalize' }}>{w.type?.replace('_', ' ')}</strong></span>
                      {w.capacity_units && <span style={{ fontSize: '12px', color: 'var(--color-outline)' }}>Capacity: <strong style={{ color: 'var(--color-on-surface)' }}>{w.capacity_units} units</strong></span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(w)}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, color: 'var(--color-outline)', background: 'rgba(26,28,26,0.05)', border: 'none', cursor: 'pointer', borderRadius: '50%', transition: 'background 0.2s ease' }}
                      title="Edit Warehouse"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(w.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, color: 'var(--color-error)', background: 'var(--color-error-container)', border: 'none', cursor: 'pointer', borderRadius: '50%', transition: 'background 0.2s ease' }}
                      title="Delete Warehouse"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </RightDrawer>
  );
};
