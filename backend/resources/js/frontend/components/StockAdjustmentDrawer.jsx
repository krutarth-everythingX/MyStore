import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { SellerModalBackdrop, SellerModalCard, SellerSelect } from './seller-workspace';
const defaultAdjustmentForm = {
  product_id: '',
  warehouse_id: '',
  counted_quantity: '',
  reason: 'Cycle count correction',
  bin_location: '',
  safety_stock: '',
  unit_cost: ''
};
export const StockAdjustmentDrawer = ({
  isOpen,
  onClose
}) => {
  const {
    props
  } = usePage();
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
  const productOptions = products.filter(product => product.type !== 'variation').map(product => ({
    id: product.id,
    label: `${product.name} (${product.sku || product.mystore_product_id || `#${product.id}`})`
  }));
  const setField = (field, value) => {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  };
  const handleSubmit = event => {
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
      unit_cost: form.unit_cost === '' ? null : Number(form.unit_cost)
    }, {
      preserveScroll: true,
      only: ['sellerInventorySnapshot', 'flash'],
      onSuccess: () => {
        setForm(current => ({
          ...defaultAdjustmentForm,
          product_id: current.product_id,
          warehouse_id: current.warehouse_id
        }));
        setSuccess('Adjustment posted successfully.');
      },
      onError: errors => setError(Object.values(errors)[0] || 'Inventory adjustment could not be posted.'),
      onFinish: () => setSubmitting(false)
    });
  };
  if (!isOpen) {
    return null;
  }

  return <SellerModalBackdrop onClose={onClose}>
        <SellerModalCard className="max-w-4xl p-0" onMouseDown={e => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 sm:px-6">
            <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Adjust Stock</h3>
            <button
              onClick={onClose}
              aria-label="Close modal"
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[80dvh] overflow-y-auto px-5 py-5 sm:px-6">
        <div className="space-y-6">
          <div className="border border-neutral-200 bg-white p-5">
            <p className="text-sm leading-7 text-neutral-700">
              Post cycle counts, log damaged stock, or correct inventory variances manually.
            </p>
          </div>

          {(error || success) && <div className={`border p-4 text-sm font-medium ${error ? 'border-rose-700 bg-white text-rose-700' : 'border-emerald-700 bg-white text-emerald-700'}`}>
              {error || success}
            </div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Product *</label>
                <SellerSelect className="rounded-none border shadow-none" value={form.product_id} onChange={e => setField('product_id', e.target.value)}>
                  <option value="">Select product</option>
                  {productOptions.map(product => <option key={product.id} value={product.id}>{product.label}</option>)}
                </SellerSelect>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Warehouse *</label>
                <SellerSelect className="rounded-none border shadow-none" value={form.warehouse_id} onChange={e => setField('warehouse_id', e.target.value)}>
                  <option value="">Select warehouse</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>)}
                </SellerSelect>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Counted Qty *" type="number" min="0" inputClassName="rounded-none border border-neutral-200 shadow-none focus:ring-0" value={form.counted_quantity} onChange={e => setField('counted_quantity', e.target.value)} />
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Reason</label>
                <SellerSelect className="rounded-none border shadow-none" value={form.reason} onChange={e => setField('reason', e.target.value)}>
                  <option>Cycle count correction</option>
                  <option>Damaged stock</option>
                  <option>Found stock</option>
                  <option>Lost stock</option>
                  <option>Opening balance</option>
                  <option>Quality hold release</option>
                </SellerSelect>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Bin Location" type="text" placeholder="Z-01/A-01..." inputClassName="rounded-none border border-neutral-200 shadow-none focus:ring-0" value={form.bin_location} onChange={e => setField('bin_location', e.target.value)} />
              <Input label="Safety Stock" type="number" min="0" inputClassName="rounded-none border border-neutral-200 shadow-none focus:ring-0" value={form.safety_stock} onChange={e => setField('safety_stock', e.target.value)} />
            </div>

            <Input label="Unit Cost" type="number" min="0" step="0.01" inputClassName="rounded-none border border-neutral-200 shadow-none focus:ring-0" value={form.unit_cost} onChange={e => setField('unit_cost', e.target.value)} />

            <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-5">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                <Save size={16} />
                {submitting ? 'Posting...' : 'Post Count'}
              </Button>
            </div>
          </form>
        </div>
          </div>
        </SellerModalCard>
    </SellerModalBackdrop>;
};
