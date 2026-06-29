import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { RightDrawer } from './RightDrawer';
import { Button } from './Button';
import { Input } from './Input';
import { SellerSelect } from './seller-workspace';
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
  status: 'active'
};
export const TraceabilityDrawer = ({
  isOpen,
  onClose
}) => {
  const {
    props
  } = usePage();
  const warehouses = props.sellerWarehouses || [];
  const products = props.sellerProducts || [];
  const snapshot = props.sellerInventorySnapshot || {};
  const traceability = snapshot.traceability || {};
  const [form, setForm] = useState(defaultTraceabilityForm);
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
  const productOptions = products.filter(product => product.type !== 'variation').map(product => ({
    id: product.id,
    label: `${product.name} (${product.sku || product.mystore_product_id || `#${product.id}`})`
  }));
  const setField = (field, value) => {
    setForm(current => ({
      ...current,
      [field]: value,
      ...(field === 'record_type' ? {
        status: value === 'batch' ? 'active' : 'available',
        batch_no: '',
        manufactured_at: '',
        expires_at: '',
        quantity: '',
        serial_no: '',
        inventory_batch_id: ''
      } : {})
    }));
  };
  const handleSubmit = event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!form.product_id) {
      setError('Choose a product before saving traceability.');
      return;
    }
    if (form.record_type === 'batch' && (!form.batch_no || form.quantity === '')) {
      setError('Batch number and quantity are required for lot tracking.');
      return;
    }
    if (form.record_type === 'serial' && !form.serial_no) {
      setError('Serial number is required for serial tracking.');
      return;
    }
    setSubmitting(true);
    router.post('/inventory/traceability', {
      record_type: form.record_type,
      product_id: parseInt(form.product_id, 10),
      warehouse_id: form.warehouse_id ? parseInt(form.warehouse_id, 10) : null,
      batch_no: form.batch_no,
      manufactured_at: form.manufactured_at || null,
      expires_at: form.expires_at || null,
      quantity: form.quantity === '' ? null : parseInt(form.quantity, 10),
      serial_no: form.serial_no,
      inventory_batch_id: form.inventory_batch_id ? parseInt(form.inventory_batch_id, 10) : null,
      status: form.status
    }, {
      preserveScroll: true,
      only: ['sellerInventorySnapshot', 'flash'],
      onSuccess: () => {
        setForm(current => ({
          ...defaultTraceabilityForm,
          record_type: current.record_type,
          status: current.record_type === 'batch' ? 'active' : 'available'
        }));
        setSuccess('Traceability record saved successfully.');
      },
      onError: errors => setError(Object.values(errors)[0] || 'Traceability record could not be saved.'),
      onFinish: () => setSubmitting(false)
    });
  };
  return <RightDrawer isOpen={isOpen} onClose={onClose} title="Register Traceability" wide>
        <p>
          Log incoming batch/lot numbers and assign individual serial numbers to stock.
        </p>

        {(error || success) && <div>
            {error || success}
          </div>}

        <form onSubmit={handleSubmit}>
          <div>
            <button type="button" onClick={() => setField('record_type', 'batch')}>
              Batch / Lot
            </button>
            <button type="button" onClick={() => setField('record_type', 'serial')}>
              Serial Number
            </button>
          </div>

          <div>
            <div>
              <label>Product *</label>
              <SellerSelect value={form.product_id} onChange={e => setField('product_id', e.target.value)}>
                <option value="">Select product</option>
                {productOptions.map(product => <option key={product.id} value={product.id}>{product.label}</option>)}
              </SellerSelect>
            </div>

            <div>
              <label>Warehouse</label>
              <SellerSelect value={form.warehouse_id} onChange={e => setField('warehouse_id', e.target.value)}>
                <option value="">All Warehouses</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </SellerSelect>
            </div>
          </div>

          {form.record_type === 'batch' ? <>
              <div>
                <Input label="Batch / Lot No. *" value={form.batch_no} onChange={e => setField('batch_no', e.target.value)} />
                <Input label="Quantity *" type="number" min="0" value={form.quantity} onChange={e => setField('quantity', e.target.value)} />
              </div>
              <div>
                <Input label="Mfg Date" type="date" value={form.manufactured_at} onChange={e => setField('manufactured_at', e.target.value)} />
                <Input label="Expiry Date" type="date" value={form.expires_at} onChange={e => setField('expires_at', e.target.value)} />
              </div>
            </> : <>
              <Input label="Serial No. *" value={form.serial_no} onChange={e => setField('serial_no', e.target.value)} />
              <div>
                <label>Link to Batch</label>
                <SellerSelect value={form.inventory_batch_id} onChange={e => setField('inventory_batch_id', e.target.value)}>
                  <option value="">No batch link</option>
                  {(traceability.batches || []).map(batch => <option key={batch.id} value={batch.id}>{batch.batch_no}</option>)}
                </SellerSelect>
              </div>
            </>}

          <Button type="submit" variant="primary" disabled={submitting}>
            <Save size={16} />
            {submitting ? 'Saving...' : 'Save Record'}
          </Button>
        </form>
    </RightDrawer>;
};
