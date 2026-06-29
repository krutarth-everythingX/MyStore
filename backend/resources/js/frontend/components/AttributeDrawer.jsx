import React, { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, SlidersHorizontal, X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { SellerModalBackdrop, SellerModalCard } from './seller-workspace';
import { cn } from '../utils/cn';
const USE_FOR_OPTIONS = [['product', 'Product'], ['service', 'Service'], ['both', 'Both']];
const TYPE_OPTIONS = [['dropdown', 'Dropdown'], ['free_text', 'Free Text'], ['number', 'Number'], ['color', 'Color'], ['material', 'Material'], ['custom', 'Custom']];
const defaultForm = {
  name: '',
  applies_to: 'product',
  input_type: 'dropdown',
  options: [],
  is_required: false,
  is_active: true
};

const ChoiceButton = ({
  active,
  children,
  ...props
}) => <button type="button" className={cn('min-h-11 border px-4 text-sm font-medium transition', active ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100')} {...props}>
    {children}
  </button>;
export const AttributeDrawer = ({
  isOpen,
  onClose,
  editingAttribute = null,
  onSaved
}) => {
  const [form, setForm] = useState(defaultForm);
  const [draftValue, setDraftValue] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(editingAttribute?.id);
  const sortedOptions = useMemo(() => form.options || [], [form.options]);
  useEffect(() => {
    if (!isOpen) {
      setForm(defaultForm);
      setDraftValue('');
      setError('');
      setSubmitting(false);
      return;
    }
    if (editingAttribute) {
      setForm({
        name: editingAttribute.name || '',
        applies_to: editingAttribute.applies_to || 'product',
        input_type: editingAttribute.input_type || 'dropdown',
        options: Array.isArray(editingAttribute.options) ? editingAttribute.options : [],
        is_required: Boolean(editingAttribute.is_required),
        is_active: editingAttribute.is_active !== false
      });
      setDraftValue('');
      setError('');
      return;
    }
    setForm(defaultForm);
    setDraftValue('');
    setError('');
  }, [editingAttribute, isOpen]);
  if (!isOpen) return null;
  const setField = (field, value) => {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  };
  const addOption = () => {
    const value = draftValue.trim();
    if (!value) return;
    setForm(current => ({
      ...current,
      options: Array.from(new Set([...(current.options || []), value]))
    }));
    setDraftValue('');
  };
  const removeOption = value => {
    setForm(current => ({
      ...current,
      options: (current.options || []).filter(option => option !== value)
    }));
  };
  const submitAttribute = event => {
    event.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Attribute name is required.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      applies_to: form.applies_to,
      input_type: form.input_type,
      options: form.options.length > 0 ? form.options : null,
      is_required: form.is_required,
      is_active: form.is_active
    };
    const options = {
      preserveScroll: true,
      preserveState: true,
      only: ['attributes', 'flash'],
      onSuccess: () => {
        onSaved?.(payload);
        onClose?.();
        router.reload({
          only: ['attributes'],
          preserveScroll: true,
          preserveState: true
        });
      },
      onError: errors => setError(Object.values(errors)[0] || 'Attribute could not be saved.'),
      onFinish: () => setSubmitting(false)
    };
    setSubmitting(true);
    if (isEditing) {
      router.put(`/seller/attributes/${editingAttribute.id}`, payload, options);
      return;
    }
    router.post('/seller/attributes', payload, options);
  };
  return <SellerModalBackdrop onClose={onClose}>
    <SellerModalCard className="max-w-5xl bg-white p-0" onMouseDown={event => event.stopPropagation()}>
      <form onSubmit={submitAttribute} className="space-y-6 p-6">
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
          <div className="space-y-2">
            <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Attribute Builder</span>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center border border-neutral-200 bg-white text-neutral-950">
                <SlidersHorizontal size={18} />
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">{isEditing ? 'Edit Attribute' : 'Add Attribute'}</h2>
                <p className="text-sm leading-6 text-neutral-500">Create reusable options for products, services, or both.</p>
              </div>
            </div>
          </div>
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" onClick={onClose} aria-label="Close attribute dialog">
            <X size={20} />
          </button>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <section className="space-y-5">
            {error && <div className="border border-rose-500 bg-white px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

            <Input label="Attribute Name *" labelClassName="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500" inputClassName="h-12 rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none focus:border-neutral-950 focus:ring-0" value={form.name} placeholder="e.g., Size" onChange={event => setField('name', event.target.value)} />

            <div className="space-y-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Use For *</span>
              <div className="grid gap-3 sm:grid-cols-3">
                {USE_FOR_OPTIONS.map(([value, label]) => <ChoiceButton key={value} active={form.applies_to === value} onClick={() => setField('applies_to', value)}>
                    {label}
                  </ChoiceButton>)}
              </div>
            </div>

            <div className="space-y-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Type *</span>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {TYPE_OPTIONS.map(([value, label]) => <ChoiceButton key={value} active={form.input_type === value} onClick={() => setField('input_type', value)}>
                    {label}
                  </ChoiceButton>)}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start justify-between gap-3 border border-neutral-200 bg-neutral-50 px-4 py-4">
                <span>
                  <strong className="block text-sm font-semibold text-neutral-950">Required</strong>
                  <small className="mt-1 block text-xs leading-5 text-neutral-500">Require this field during item setup.</small>
                </span>
                <input type="checkbox" className="mt-1 h-4 w-4 accent-neutral-950" checked={form.is_required} onChange={event => setField('is_required', event.target.checked)} />
              </label>

              <label className="flex items-start justify-between gap-3 border border-neutral-200 bg-neutral-50 px-4 py-4">
                <span>
                  <strong className="block text-sm font-semibold text-neutral-950">Active</strong>
                  <small className="mt-1 block text-xs leading-5 text-neutral-500">Make this attribute available immediately.</small>
                </span>
                <input type="checkbox" className="mt-1 h-4 w-4 accent-neutral-950" checked={form.is_active} onChange={event => setField('is_active', event.target.checked)} />
              </label>
            </div>
          </section>

          <aside className="space-y-5 border border-neutral-200 bg-neutral-50 p-5">
            <div className="space-y-2 border-b border-neutral-200 pb-4">
              <h3 className="text-xl font-semibold text-neutral-950">Option Values</h3>
              <p className="text-sm leading-6 text-neutral-500">Add reusable values such as Small, Medium, Large, Red, Blue, or Premium.</p>
            </div>

            <div className="space-y-3">
              <Input label="Value" labelClassName="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500" inputClassName="h-12 rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none focus:border-neutral-950 focus:ring-0" value={draftValue} placeholder="e.g., Medium" onChange={event => setDraftValue(event.target.value)} onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addOption();
            }
          }} />

              <Button type="button" variant="outline" className="min-h-11 rounded-none border border-neutral-200 px-4" onClick={addOption}>
                <Plus size={14} />
                Add Value
              </Button>
            </div>

            <div className="space-y-3">
              {sortedOptions.length === 0 ? <p className="border border-dashed border-neutral-950 bg-white px-4 py-4 text-sm leading-6 text-neutral-500">
                  Add values for dropdown-style attributes, or leave this blank for free-entry attributes.
                </p> : <div className="flex flex-wrap gap-2">
                  {sortedOptions.map(option => <span key={option} className="inline-flex items-center gap-2 border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-950">
                      {option}
                      <button type="button" className="inline-flex h-5 w-5 items-center justify-center border border-neutral-950 bg-white text-neutral-950 transition hover:bg-neutral-100" onClick={() => removeOption(option)} aria-label={`Remove ${option}`}>
                        <X size={12} />
                      </button>
                    </span>)}
                </div>}
            </div>
          </aside>
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
          <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="rounded-none border border-neutral-200 px-4" disabled={submitting}>
            {submitting ? 'Saving...' : isEditing ? 'Update Attribute' : 'Save Attribute'}
          </Button>
        </footer>
      </form>
    </SellerModalCard>
  </SellerModalBackdrop>;
};
