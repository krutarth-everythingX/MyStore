import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { RightDrawer } from './RightDrawer';
import { Button } from './Button';
import { Input } from './Input';
import { SellerSelect, SellerTextarea } from './seller-workspace';
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
  default_carrier: 'Blue Dart'
};
export const WarehouseDrawer = ({
  isOpen,
  onClose
}) => {
  const {
    props
  } = usePage();
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
    setWarehouseForm(current => ({
      ...current,
      [field]: value
    }));
  };
  const handleDelete = id => {
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
  const handleEdit = warehouse => {
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
      default_carrier: warehouse.default_carrier || 'Blue Dart'
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
  const handleSubmitWarehouse = event => {
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
      capacity_units: warehouseForm.capacity_units ? parseInt(warehouseForm.capacity_units, 10) : null
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
      onError: errors => setError(Object.values(errors)[0] || `Warehouse could not be ${editingId ? 'updated' : 'created'}.`),
      onFinish: () => setLoading(false)
    };
    if (editingId) {
      router.put(`/warehouses/${editingId}`, requestData, requestOptions);
    } else {
      router.post('/warehouses', requestData, requestOptions);
    }
  };
  return <RightDrawer isOpen={isOpen} onClose={onClose} title="Manage Warehouses">
        {(error || success) && <div>
            {error || success}
          </div>}

        <div>
          <form onSubmit={handleSubmitWarehouse}>
            <div>
              <div>
                <h3>{editingId ? 'Edit Warehouse' : 'Add New Warehouse'}</h3>
                <p>
                  {editingId ? 'Edit an existing warehouse.' : 'Create a new warehouse and default bin hierarchy.'}
                </p>
              </div>
            </div>
          <div>
            <div>
              <Input label="Warehouse Name" value={warehouseForm.name} onChange={event => setWarehouseField('name', event.target.value)} required />
              <Input label="Code" placeholder="WH-AHM-01" value={warehouseForm.code} onChange={event => setWarehouseField('code', event.target.value)} required />
            </div>
            <div>
              <div>
                <label>Type</label>
                <SellerSelect value={warehouseForm.type} onChange={event => setWarehouseField('type', event.target.value)}>
                  <option value="fulfillment">Fulfillment</option>
                  <option value="returns">Returns</option>
                  <option value="dark_store">Dark store</option>
                  <option value="3pl">3PL</option>
                  <option value="cross_dock">Cross dock</option>
                </SellerSelect>
              </div>
              <div>
                <label>Default Carrier</label>
                <SellerSelect value={warehouseForm.default_carrier} onChange={event => setWarehouseField('default_carrier', event.target.value)}>
                  {carriers.map(carrier => <option key={carrier} value={carrier}>{carrier}</option>)}
                </SellerSelect>
              </div>
            </div>
            <div>
              <label>Street Address</label>
              <SellerTextarea rows={2} value={warehouseForm.address} onChange={event => setWarehouseField('address', event.target.value)} />
            </div>
            <div>
              <Input label="City" value={warehouseForm.city} onChange={event => setWarehouseField('city', event.target.value)} />
              <Input label="State" value={warehouseForm.state} onChange={event => setWarehouseField('state', event.target.value)} />
              <Input label="Country" value={warehouseForm.country} onChange={event => setWarehouseField('country', event.target.value)} />
            </div>
            <div>
              <Input label="Postal Code" value={warehouseForm.postal_code} onChange={event => setWarehouseField('postal_code', event.target.value)} />
              <Input label="Timezone" value={warehouseForm.timezone} onChange={event => setWarehouseField('timezone', event.target.value)} />
              <Input label="Capacity Units" type="number" min="0" value={warehouseForm.capacity_units} onChange={event => setWarehouseField('capacity_units', event.target.value)} />
            </div>
          </div>
          <div>
            <Button variant="secondary" onClick={editingId ? handleCancelEdit : onClose} type="button">Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {!editingId && <Plus size={16} />}
              {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>

        {/* Existing Warehouses List */}
        <div>
          <div>
            <div>
              <h3>Existing Warehouses</h3>
            </div>
          </div>
          
          {warehouses.length === 0 ? <div>
              <h3>No warehouses yet</h3>
              <p>Create your first warehouse above.</p>
            </div> : <div>
              {warehouses.map(w => <article key={w.id}>
                  <div>
                    <div>
                      <h3>{w.name}</h3>
                      <span>{w.code}</span>
                    </div>
                    {w.address && <p>{w.address}{w.city ? `, ${w.city}` : ''}{w.state ? `, ${w.state}` : ''} {w.postal_code}</p>}
                    <div>
                      <span>Type: <strong>{w.type?.replace('_', ' ')}</strong></span>
                      {w.capacity_units && <span>Capacity: <strong>{w.capacity_units} units</strong></span>}
                    </div>
                  </div>
                  <div>
                    <button type="button" onClick={() => handleEdit(w)} title="Edit Warehouse">
                      <Edit2 size={14} />
                    </button>
                    <button type="button" onClick={() => handleDelete(w.id)} title="Delete Warehouse">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>)}
            </div>}
        </div>
      </div>
    </RightDrawer>;
};
