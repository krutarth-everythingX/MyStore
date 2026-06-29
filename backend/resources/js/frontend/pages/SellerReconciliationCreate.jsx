import React, { useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, Box, Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { SellerCard, SellerPageHeader, SellerPageShell, SellerSelect, SellerTextarea } from '../components/seller-workspace';
import { useToast } from '../context/ToastContext';

const purposeOptions = [
  { value: 'Physical Count', label: 'Physical Count' },
  { value: 'Cycle Count', label: 'Cycle Count' },
  { value: 'Stock Audit', label: 'Stock Audit' },
];

const createEmptyItem = () => ({
  product_id: '',
  counted_quantity: 1,
});

const formatDateInput = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeInput = (value = new Date()) => {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const fieldClassName = 'h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-0';
const readOnlyFieldClassName = `${fieldClassName} bg-slate-50 text-slate-500`;

export const SellerReconciliationCreate = () => {
  const { props } = usePage();
  const { showToast } = useToast();
  const products = props.sellerProducts || [];
  const warehouses = props.sellerWarehouses || [];

  const [form, setForm] = useState({
    purpose: 'Physical Count',
    warehouse_id: '',
    posting_date: formatDateInput(),
    posting_time: formatTimeInput(),
    remarks: '',
  });
  const [items, setItems] = useState([createEmptyItem()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku || product.mystore_product_id || 'SKU',
        unit: 'Unit',
        rate: Number(product.sale_price || product.regular_price || 0),
      })),
    [products],
  );

  const productMap = useMemo(
    () => Object.fromEntries(productOptions.map((product) => [String(product.id), product])),
    [productOptions],
  );

  const updateItem = (index, patch) => {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => setItems((current) => [...current, createEmptyItem()]);
  const removeItem = (index) =>
    setItems((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)));
  const duplicateItem = (index) =>
    setItems((current) =>
      current.flatMap((item, itemIndex) => (itemIndex === index ? [item, { ...item }] : [item])),
    );

  const currentValue = 0;
  const newValue = items.reduce((sum, item) => {
    const product = productMap[String(item.product_id)];
    return sum + (product?.rate || 0) * Number(item.counted_quantity || 0);
  }, 0);
  const netDifference = newValue - currentValue;

  const handleSubmit = () => {
    setSaving(true);
    setErrors({});
    router.post(
      '/inventory/reconciliations',
      {
        ...form,
        items: items.map((item) => ({
          product_id: Number(item.product_id),
          counted_quantity: Number(item.counted_quantity || 0),
        })),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          showToast('Reconciliation created successfully.', 'success');
        },
        onError: (nextErrors) => {
          setErrors(nextErrors);
          showToast(Object.values(nextErrors)[0] || 'Reconciliation could not be created.', 'error');
        },
        onFinish: () => setSaving(false),
      },
    );
  };

  const columnTemplate =
    '24px 40px minmax(230px,1.55fr) minmax(140px,1fr) minmax(84px,0.7fr) minmax(100px,0.8fr) minmax(100px,0.8fr) minmax(120px,0.95fr) 88px';

  return (
    <div>
      <Sidebar />

      <SellerPageShell>
        <SellerPageHeader
          title="Create Stock Reconciliation"
          description="Record physical stock counts and adjustments."
          action={
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-none border border-neutral-200 px-4"
                onClick={() => router.visit('/seller/inventory/reconciliation')}
              >
                <ArrowLeft size={15} />
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                className="rounded-none border border-neutral-200 px-4"
                onClick={handleSubmit}
                disabled={saving}
              >
                <Plus size={15} />
                {saving ? 'Creating...' : 'Create Reconciliation'}
              </Button>
            </div>
          }
        />

        <SellerCard>
          <div className="space-y-5">
            <div className="space-y-2 border-b border-neutral-200 pb-4">
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Reconciliation Details</h2>
              <p className="text-sm leading-6 text-neutral-500">
                Choose the warehouse and count purpose before recording counted quantities.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Purpose *</span>
                <SellerSelect
                  className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none"
                  value={form.purpose}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      purpose: event.target.value,
                    }))
                  }
                >
                  {purposeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SellerSelect>
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Warehouse *</span>
                <SellerSelect
                  className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none"
                  value={form.warehouse_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      warehouse_id: event.target.value,
                    }))
                  }
                >
                  <option value="">Select an option</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </SellerSelect>
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Posting Date *</span>
                <input
                  className={fieldClassName}
                  type="date"
                  value={form.posting_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      posting_date: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Posting Time</span>
                <input
                  className={fieldClassName}
                  type="time"
                  value={form.posting_time}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      posting_time: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Remarks</label>
              <SellerTextarea
                className="min-h-[140px] rounded-none border border-neutral-200 px-4 py-3 text-sm text-neutral-950 shadow-none"
                rows={3}
                placeholder="Additional notes..."
                value={form.remarks}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    remarks: event.target.value,
                  }))
                }
              />
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="border border-rose-500 bg-white px-4 py-3 text-sm font-medium text-rose-700">
                {Object.values(errors)[0]}
              </div>
            )}
          </div>
        </SellerCard>

        <SellerCard>
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-4">
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-neutral-950">
                  <Box size={18} />
                  Items
                </h2>
                <p className="text-sm leading-6 text-neutral-500">
                  Add products and counted quantities for the selected warehouse.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-none border border-neutral-200 px-4"
                onClick={addItem}
              >
                <Plus size={15} />
                Add Line
              </Button>
            </div>

            <div className="hidden overflow-hidden border border-neutral-200 xl:block">
              <div
                className="grid border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500"
                style={{ gridTemplateColumns: columnTemplate }}
              >
                <div />
                <div>#</div>
                <div>Item / Description*</div>
                <div>SKU</div>
                <div className="text-left">Unit</div>
                <div className="text-left">Counted Qty</div>
                <div className="text-left">Rate</div>
                <div className="text-left">Amount</div>
                <div className="text-center">Actions</div>
              </div>

              <div className="divide-y-2 divide-neutral-950">
                {items.map((item, index) => {
                  const product = productMap[String(item.product_id)];
                  const amount = (product?.rate || 0) * Number(item.counted_quantity || 0);
                  return (
                    <div
                      key={`${index}-${item.product_id || 'new'}`}
                      className="grid items-center gap-3 bg-white px-4 py-4"
                      style={{ gridTemplateColumns: columnTemplate }}
                    >
                      <div className="flex items-center text-neutral-500">
                        <GripVertical size={16} />
                      </div>
                      <div className="flex items-center text-sm font-medium text-neutral-500">{index + 1}</div>
                      <div>
                        <select
                          className={fieldClassName}
                          value={item.product_id}
                          onChange={(event) =>
                            updateItem(index, {
                              product_id: event.target.value,
                            })
                          }
                        >
                          <option value="">Search or type item...</option>
                          {productOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input className={readOnlyFieldClassName} value={product?.sku || 'SKU'} readOnly />
                      </div>
                      <div>
                        <input className={readOnlyFieldClassName} value={product?.unit || 'Unit'} readOnly />
                      </div>
                      <div>
                        <input
                          className={fieldClassName}
                          type="number"
                          min="0"
                          value={item.counted_quantity}
                          onChange={(event) =>
                            updateItem(index, {
                              counted_quantity: event.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <input
                          className={readOnlyFieldClassName}
                          value={product ? product.rate.toFixed(2) : '0.00'}
                          readOnly
                        />
                      </div>
                      <div>
                        <input className={readOnlyFieldClassName} value={`$${amount.toFixed(2)}`} readOnly />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-10 rounded-none border border-neutral-200 px-2.5"
                          onClick={() => duplicateItem(index)}
                          aria-label="Duplicate row"
                        >
                          <Copy size={15} />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-10 rounded-none border border-neutral-200 px-2.5"
                          onClick={() => removeItem(index)}
                          aria-label="Delete row"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 xl:hidden">
              {items.map((item, index) => {
                const product = productMap[String(item.product_id)];
                const amount = (product?.rate || 0) * Number(item.counted_quantity || 0);
                return (
                  <article
                    key={`mobile-${index}-${item.product_id || 'new'}`}
                    className="border border-neutral-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                      <strong className="text-base font-semibold text-neutral-950">Line {index + 1}</strong>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-none border border-neutral-200 px-3"
                          onClick={() => duplicateItem(index)}
                          aria-label="Duplicate row"
                        >
                          <Copy size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-none border border-neutral-200 px-3"
                          onClick={() => removeItem(index)}
                          aria-label="Delete row"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <select
                        className={fieldClassName}
                        value={item.product_id}
                        onChange={(event) =>
                          updateItem(index, {
                            product_id: event.target.value,
                          })
                        }
                      >
                        <option value="">Search or type item...</option>
                        {productOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      <input className={readOnlyFieldClassName} value={product?.sku || 'SKU'} readOnly />
                      <input className={readOnlyFieldClassName} value={product?.unit || 'Unit'} readOnly />
                      <input
                        className={fieldClassName}
                        type="number"
                        min="0"
                        value={item.counted_quantity}
                        onChange={(event) =>
                          updateItem(index, {
                            counted_quantity: event.target.value,
                          })
                        }
                        placeholder="Counted Qty"
                      />
                      <input
                        className={readOnlyFieldClassName}
                        value={product ? product.rate.toFixed(2) : '0.00'}
                        readOnly
                      />
                      <div className="border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-950">
                        Amount: ${amount.toFixed(2)}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <article className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Current Value</span>
                <strong className="mt-2 block text-lg font-semibold text-neutral-950">${currentValue.toFixed(2)}</strong>
              </article>
              <article className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">New Value</span>
                <strong className="mt-2 block text-lg font-semibold text-neutral-950">${newValue.toFixed(2)}</strong>
              </article>
              <article className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Net Difference</span>
                <strong className="mt-2 block text-lg font-semibold text-neutral-950">${netDifference.toFixed(2)}</strong>
              </article>
            </div>
          </div>
        </SellerCard>
      </SellerPageShell>
    </div>
  );
};

export default SellerReconciliationCreate;
