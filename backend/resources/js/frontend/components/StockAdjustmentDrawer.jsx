import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { RightDrawer } from './RightDrawer';
import { Button } from './Button';
import { Input } from './Input';
import '../pages/SellerInventory.css';

const defaultAdjustmentForm = {
  product_id: '',
  warehouse_id: '',
  counted_quantity: '',
  reason: 'Cycle count correction',
  bin_location: '',
  safety_stock: '',
  unit_cost: '',
};

export const StockAdjustmentDrawer = ({ isOpen, onClose }) => {
  const { props } = usePage();
  const warehouses = props.sellerWarehouses || [];
  const products = props.sellerProducts || [];

  const [form, setForm] = useState(defaultAdjustmentForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const productOptions = products
    .filter((product) => product.type !== 'variation')
    .map((product) => ({
      id: product.id,
      label: `${product.name} (${product.sku || product.mystore_product_id || `#${product.id}`})`,
    }));

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.product_id || !form.warehouse_id || form.counted_quantity === '') {
      setError('Choose product, warehouse, and counted quantity before posting an adjustment.');
      return;
    }

    setSubmitting(true);

    router.post('/inventory/adjustments', {
      product_id: parseInt(form.product_id, 10),
      warehouse_id: parseInt(form.warehouse_id, 10),
      counted_quantity: parseInt(form.counted_quantity, 10),
      reason: form.reason,
      bin_location: form.bin_location,
      safety_stock: form.safety_stock === '' ? null : parseInt(form.safety_stock, 10),
      unit_cost: form.unit_cost === '' ? null : Number(form.unit_cost),
    }, {
      preserveScroll: true,
      only: ['sellerInventorySnapshot', 'flash'],
      onSuccess: () => {
        setForm((current) => ({
          ...defaultAdjustmentForm,
          product_id: current.product_id,
          warehouse_id: current.warehouse_id,
        }));
        setSuccess('Adjustment posted successfully.');
      },
      onError: (errors) => setError(Object.values(errors)[0] || 'Inventory adjustment could not be posted.'),
      onFinish: () => setSubmitting(false),
    });
  };

  return (
    <RightDrawer isOpen={isOpen} onClose={onClose} title="Adjust Stock" wide>
        <p className="body-md" style={{ color: 'var(--color-outline)', margin: 0, marginBottom: 12 }}>
          Post cycle counts, log damaged stock, or correct inventory variances manually.
        </p>

        {(error || success) && (
          <div style={{ color: error ? 'var(--color-error)' : '#2e7d32', fontSize: '14px', fontWeight: 600, marginBottom: 16 }}>
            {error || success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-container">
              <label className="input-label label-md">Product *</label>
              <select
                className="input-field"
                value={form.product_id}
                onChange={(e) => setField('product_id', e.target.value)}
              >
                <option value="">Select product</option>
                {productOptions.map((product) => (
                  <option key={product.id} value={product.id}>{product.label}</option>
                ))}
              </select>
            </div>

            <div className="input-container">
              <label className="input-label label-md">Warehouse *</label>
              <select
                className="input-field"
                value={form.warehouse_id}
                onChange={(e) => setField('warehouse_id', e.target.value)}
              >
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Counted Qty *"
              type="number"
              min="0"
              value={form.counted_quantity}
              onChange={(e) => setField('counted_quantity', e.target.value)}
            />
            <div className="input-container">
              <label className="input-label label-md">Reason</label>
              <select
                className="input-field"
                value={form.reason}
                onChange={(e) => setField('reason', e.target.value)}
              >
                <option>Cycle count correction</option>
                <option>Damaged stock</option>
                <option>Found stock</option>
                <option>Lost stock</option>
                <option>Opening balance</option>
                <option>Quality hold release</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Bin Location"
              type="text"
              placeholder="Z-01/A-01..."
              value={form.bin_location}
              onChange={(e) => setField('bin_location', e.target.value)}
            />
            <Input
              label="Safety Stock"
              type="number"
              min="0"
              value={form.safety_stock}
              onChange={(e) => setField('safety_stock', e.target.value)}
            />
          </div>

          <Input
            label="Unit Cost"
            type="number"
            min="0"
            step="0.01"
            value={form.unit_cost}
            onChange={(e) => setField('unit_cost', e.target.value)}
          />

          <Button type="submit" variant="primary" disabled={submitting} style={{ marginTop: 'auto' }}>
            <Save size={16} style={{ marginRight: 6 }} />
            {submitting ? 'Posting...' : 'Post Count'}
          </Button>
        </form>
    </RightDrawer>
  );
};
