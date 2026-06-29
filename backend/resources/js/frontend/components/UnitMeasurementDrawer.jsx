import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Plus, Scale, X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { SellerModalBackdrop, SellerModalCard } from './seller-workspace';
import { cn } from '../utils/cn';
export const DEFAULT_UNITS = [{
  id: 'uom-1',
  name: 'Hourly',
  symbol: 'hour',
  type: 'Time',
  precision: '0',
  scope: 'product',
  is_active: true,
  items_count: 0,
  formulaFields: [],
  formula: ''
}, {
  id: 'uom-2',
  name: 'Per User',
  symbol: 'er_ser',
  type: 'Count',
  precision: '0',
  scope: 'product',
  is_active: true,
  items_count: 1,
  formulaFields: [],
  formula: ''
}, {
  id: 'uom-3',
  name: 'T15 Unit',
  symbol: 'T15-UNIT',
  type: 'Stock',
  precision: '0',
  scope: 'product',
  is_active: true,
  items_count: 0,
  formulaFields: [],
  formula: ''
}, {
  id: 'uom-4',
  name: 'Pieces',
  symbol: 'pcs',
  type: 'Count',
  precision: '0',
  scope: 'product',
  is_active: true,
  items_count: 0,
  formulaFields: [],
  formula: ''
}, {
  id: 'uom-5',
  name: 'Unit',
  symbol: 'unit',
  type: 'Count',
  precision: '0',
  scope: 'both',
  is_active: true,
  items_count: 6,
  formulaFields: [],
  formula: ''
}, {
  id: 'uom-6',
  name: 'Kilogram',
  symbol: 'kg',
  type: 'Weight',
  precision: '2',
  scope: 'product',
  is_active: true,
  items_count: 0,
  formulaFields: [],
  formula: ''
}, {
  id: 'uom-7',
  name: 'Gram',
  symbol: 'gm',
  type: 'Weight',
  precision: '0',
  scope: 'product',
  is_active: true,
  items_count: 0,
  formulaFields: [],
  formula: ''
}, {
  id: 'uom-8',
  name: 'Liter',
  symbol: 'ltr',
  type: 'Volume',
  precision: '2',
  scope: 'product',
  is_active: true,
  items_count: 0,
  formulaFields: [],
  formula: ''
}, {
  id: 'uom-9',
  name: 'Milliliter',
  symbol: 'ml',
  type: 'Volume',
  precision: '2',
  scope: 'product',
  is_active: true,
  items_count: 0,
  formulaFields: [],
  formula: ''
}, {
  id: 'uom-10',
  name: 'Box',
  symbol: 'box',
  type: 'Count',
  precision: '0',
  scope: 'product',
  is_active: true,
  items_count: 0,
  formulaFields: [],
  formula: ''
}, {
  id: 'uom-11',
  name: 'Meter',
  symbol: 'm',
  type: 'Length',
  precision: '2',
  scope: 'product',
  is_active: true,
  items_count: 0,
  formulaFields: [],
  formula: ''
}, {
  id: 'uom-12',
  name: 'Centimeter',
  symbol: 'cm',
  type: 'Length',
  precision: '2',
  scope: 'product',
  is_active: true,
  items_count: 0,
  formulaFields: [],
  formula: ''
}];
const TYPE_OPTIONS = ['Weight', 'Volume', 'Count', 'Area', 'Length', 'Time', 'Custom'];
const SCOPE_OPTIONS = [{
  key: 'product',
  label: 'Product'
}, {
  key: 'service',
  label: 'Service'
}, {
  key: 'both',
  label: 'Both'
}];
const emptyForm = {
  name: '',
  symbol: '',
  scope: 'product',
  type: 'Count',
  precision: '0',
  is_active: true,
  formulaFields: [],
  formulaDraft: '',
  formula: ''
};
const formatType = value => String(value || 'Count').replace(/\b\w/g, letter => letter.toUpperCase());
const normalizeFormulaField = value => String(value || '').trim().replace(/\s+/g, ' ');
const ChoiceButton = ({
  active,
  children,
  ...props
}) => <button type="button" className={cn('min-h-11 border px-4 text-sm font-medium transition', active ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100')} {...props}>
    {children}
  </button>;
export const UnitMeasurementDrawer = ({
  isOpen,
  onClose,
  units,
  onUnitsChange,
  editingUnit = null,
  onSubmitSuccess
}) => {
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formulaFieldDraft, setFormulaFieldDraft] = useState('');
  const isEditing = Boolean(editId);
  const isCustomType = form.type === 'Custom';
  const normalizedFields = useMemo(() => Array.isArray(form.formulaFields) ? form.formulaFields : [], [form.formulaFields]);
  useEffect(() => {
    if (!isOpen) {
      setForm(emptyForm);
      setEditId(null);
      setError('');
      setSuccess('');
      setFormulaFieldDraft('');
      return;
    }
    if (editingUnit) {
      setForm({
        name: editingUnit.name || '',
        symbol: editingUnit.symbol || '',
        scope: editingUnit.scope || 'product',
        type: formatType(editingUnit.type),
        precision: String(editingUnit.precision ?? '0'),
        is_active: editingUnit.is_active !== false,
        formulaFields: Array.isArray(editingUnit.formulaFields) ? editingUnit.formulaFields : [],
        formulaDraft: '',
        formula: editingUnit.formula || ''
      });
      setEditId(editingUnit.id);
      setError('');
      setSuccess('');
      setFormulaFieldDraft('');
      return;
    }
    setForm(emptyForm);
    setEditId(null);
    setError('');
    setSuccess('');
    setFormulaFieldDraft('');
  }, [editingUnit, isOpen]);
  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(''), 2500);
    return () => window.clearTimeout(timer);
  }, [success]);
  if (!isOpen) return null;
  const setField = (field, value) => {
    setForm(current => ({
      ...current,
      [field]: value,
      ...(field === 'type' && value !== 'Custom' ? {
        formulaFields: [],
        formulaDraft: '',
        formula: ''
      } : {})
    }));
  };
  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setFormulaFieldDraft('');
  };
  const addFormulaField = () => {
    const next = normalizeFormulaField(formulaFieldDraft);
    if (!next) return;
    if (normalizedFields.includes(next)) {
      setFormulaFieldDraft('');
      return;
    }
    setForm(current => ({
      ...current,
      formulaFields: [...normalizedFields, next]
    }));
    setFormulaFieldDraft('');
  };
  const removeFormulaField = field => {
    setForm(current => ({
      ...current,
      formulaFields: normalizedFields.filter(value => value !== field)
    }));
  };
  const handleSubmit = event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name.trim() || !form.symbol.trim()) {
      setError('Unit name and abbreviation are required.');
      return;
    }
    if (isCustomType && !form.formula.trim()) {
      setError('Formula is required for custom units.');
      return;
    }
    const payload = {
      id: editId || `uom-${Date.now()}`,
      name: form.name.trim(),
      symbol: form.symbol.trim(),
      type: form.type,
      precision: form.precision,
      scope: form.scope,
      is_active: form.is_active,
      items_count: editingUnit?.items_count || 0,
      formulaFields: isCustomType ? normalizedFields : [],
      formula: isCustomType ? form.formula.trim() : ''
    };
    if (isEditing) {
      onUnitsChange(current => current.map(item => item.id === editId ? payload : item));
      setSuccess('Unit updated successfully.');
    } else {
      onUnitsChange(current => [payload, ...current]);
      setSuccess('Unit created successfully.');
    }
    onSubmitSuccess?.(payload, isEditing ? 'update' : 'create');
    resetForm();
  };
  return <SellerModalBackdrop onClose={onClose}>
      <SellerModalCard className="max-w-5xl bg-white p-0" onMouseDown={event => event.stopPropagation()}>
        <div className="space-y-6 p-6">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
            <div className="space-y-2">
              <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Unit Builder</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center border border-neutral-200 bg-white text-neutral-950">
                  <Scale size={18} />
                </span>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{isEditing ? 'Edit Unit' : 'Add New Unit'}</h3>
                  <p className="text-sm leading-6 text-neutral-500">Create standardized units for products, services, and custom formulas.</p>
                </div>
              </div>
            </div>
            <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={onClose} aria-label="Close unit modal">
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_360px]">
            <section className="space-y-5">
              {(error || success) && <div className={cn('border px-4 py-3 text-sm font-medium', error ? 'border-rose-500 bg-white text-rose-700' : 'border-emerald-500 bg-white text-emerald-700')}>
                  {error || success}
                </div>}

              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Unit Name *" labelClassName="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500" inputClassName="h-12 rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none focus:border-neutral-950 focus:ring-0" value={form.name} placeholder="e.g., Kilogram" onChange={event => setField('name', event.target.value)} />
                <Input label="Abbreviation *" labelClassName="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500" inputClassName="h-12 rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none focus:border-neutral-950 focus:ring-0" value={form.symbol} placeholder="e.g., kg" onChange={event => setField('symbol', event.target.value)} />
              </div>

              <Input label="Precision" type="number" min="0" labelClassName="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500" inputClassName="h-12 rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none focus:border-neutral-950 focus:ring-0" value={form.precision} onChange={event => setField('precision', event.target.value)} />

              <div className="space-y-3">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Use For *</span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {SCOPE_OPTIONS.map(option => <ChoiceButton key={option.key} active={form.scope === option.key} onClick={() => setField('scope', option.key)}>
                      {option.label}
                    </ChoiceButton>)}
                </div>
              </div>

              <div className="space-y-3">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Type *</span>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {TYPE_OPTIONS.map(option => <ChoiceButton key={option} active={form.type === option} onClick={() => setField('type', option)}>
                      {option}
                    </ChoiceButton>)}
                </div>
              </div>

              <label className="flex items-start justify-between gap-3 border border-neutral-200 bg-neutral-50 px-4 py-4">
                <span>
                  <strong className="block text-sm font-semibold text-neutral-950">Active</strong>
                  <small className="mt-1 block text-xs leading-5 text-neutral-500">Make this unit available for selection immediately.</small>
                </span>
                <input type="checkbox" className="mt-1 h-4 w-4 accent-neutral-950" checked={form.is_active} onChange={event => setField('is_active', event.target.checked)} />
              </label>
            </section>

            <aside className="space-y-5 border border-neutral-200 bg-neutral-50 p-5">
              <div className="space-y-2 border-b border-neutral-200 pb-4">
                <h4 className="text-xl font-semibold text-neutral-950">Formula Builder</h4>
                <p className="text-sm leading-6 text-neutral-500">Select Custom type to enable formula fields and expressions.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-3">
                  <Input label="Input Fields" labelClassName="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500" inputClassName="h-12 rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none focus:border-neutral-950 focus:ring-0 disabled:bg-neutral-100 disabled:text-neutral-400" value={formulaFieldDraft} placeholder="e.g., L or Breadth" disabled={!isCustomType} onChange={event => setFormulaFieldDraft(event.target.value)} />
                  <Button type="button" variant="outline" className="min-h-11 rounded-none border border-neutral-200 px-4" disabled={!isCustomType} onClick={addFormulaField}>
                    <Plus size={14} />
                    Add
                  </Button>
                </div>

                <p className="text-sm leading-6 text-neutral-500">No fields yet? Add inputs like L, B, H, Users, or Hours.</p>

                {normalizedFields.length > 0 && <div className="flex flex-wrap gap-2">
                    {normalizedFields.map(field => <button key={field} type="button" className="inline-flex items-center gap-2 border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-950" onClick={() => removeFormulaField(field)}>
                        {field}
                        <X size={12} />
                      </button>)}
                  </div>}

                <Input as="textarea" rows={6} label="Formula" labelClassName="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500" inputClassName="min-h-40 rounded-none border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 shadow-none focus:border-neutral-950 focus:ring-0 disabled:bg-neutral-100 disabled:text-neutral-400" placeholder="e.g., L * B" disabled={!isCustomType} value={form.formula} onChange={event => setField('formula', event.target.value)} />
              </div>
            </aside>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
            <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={handleSubmit}>
              <CheckCircle2 size={14} />
              {isEditing ? 'Update Unit' : 'Create Unit'}
            </Button>
          </div>
        </div>
      </SellerModalCard>
    </SellerModalBackdrop>;
};
export default UnitMeasurementDrawer;
