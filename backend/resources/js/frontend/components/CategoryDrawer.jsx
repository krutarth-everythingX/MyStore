import React, { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { CheckCircle2, Search, Tag, X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { SellerModalBackdrop, SellerSelect, SellerTextarea } from './seller-workspace';
const defaultForm = {
  id: '',
  name: '',
  type: 'product',
  parent_id: '',
  description: '',
  image: '',
  is_active: true
};
const ChoiceButton = ({
  active,
  children,
  ...props
}) => <button type="button" {...props}>
    {children}
  </button>;
export const CategoryDrawer = ({
  isOpen,
  onClose,
  editingCategory = null,
  parentCategory = null,
  mode = 'create'
}) => {
  const {
    props
  } = usePage();
  const categories = props.categories || [];
  const imageInputRef = useRef(null);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(editingCategory?.id || form.id);
  useEffect(() => {
    if (!isOpen) {
      setForm(defaultForm);
      setError('');
      setSubmitting(false);
      return;
    }
    if (editingCategory) {
      setForm({
        id: editingCategory.id,
        name: editingCategory.name || '',
        type: editingCategory.type || (/service/i.test(`${editingCategory.name || ''} ${editingCategory.slug || ''}`) ? 'service' : 'product'),
        parent_id: editingCategory.parent_id || '',
        description: editingCategory.description || '',
        image: editingCategory.image || '',
        is_active: editingCategory.is_active !== false
      });
      setError('');
      return;
    }
    setForm({
      ...defaultForm,
      parent_id: parentCategory?.id || '',
      type: parentCategory?.type || 'product'
    });
    setError('');
  }, [editingCategory, isOpen, parentCategory]);
  if (!isOpen) return null;
  const setField = (field, value) => {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  };
  const submitCategory = event => {
    event.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Category name is required.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      type: form.type,
      parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
      description: form.description || null,
      image: form.image || null,
      is_active: form.is_active
    };
    const options = {
      preserveScroll: true,
      preserveState: true,
      only: ['categories', 'flash'],
      onSuccess: () => {
        onClose?.();
        router.reload({
          only: ['categories'],
          preserveScroll: true,
          preserveState: true
        });
      },
      onError: errors => setError(Object.values(errors)[0] || 'Category could not be saved.'),
      onFinish: () => setSubmitting(false)
    };
    setSubmitting(true);
    if (isEditing) {
      router.put(`/categories/${form.id}`, payload, options);
      return;
    }
    router.post('/categories', payload, options);
  };
  const handleImageFile = file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setField('image', String(reader.result || ''));
    reader.readAsDataURL(file);
  };
  return <SellerModalBackdrop onClose={onClose}>
      <div className="w-full max-w-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm" onMouseDown={event => event.stopPropagation()}>
        <form onSubmit={submitCategory} className="flex flex-col">
          <header className="mb-6 flex items-start justify-between gap-4 border-b border-neutral-200 pb-5">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-11 w-11 items-center justify-center border border-neutral-200 bg-white text-neutral-950">
                <Tag size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="text-2xl font-bold text-neutral-950">{isEditing ? 'Edit Category' : mode === 'child' ? 'Add Subcategory' : 'Add Category'}</h3>
                <p className="mt-1 text-sm leading-6 text-neutral-500">Create and organize categories with hierarchy, imagery, and visibility controls.</p>
              </div>
            </div>
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950" onClick={onClose} aria-label="Close category dialog">
              <X size={18} />
            </button>
          </header>
  
          <div className="space-y-5">
            {error && <div className="rounded-none border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}
  
            <label className="block space-y-2">
              <span className="block text-sm font-semibold text-neutral-950">Name <span className="text-red-500">*</span></span>
              <input className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-0" value={form.name} placeholder="Software" onChange={event => setField('name', event.target.value)} />
            </label>
  
            <div className="space-y-2">
              <span className="block text-sm font-semibold text-neutral-950">Type <span className="text-red-500">*</span></span>
              <div className="flex flex-wrap gap-2">
                {['product', 'service'].map(type => <ChoiceButton key={type} className={`inline-flex min-h-10 items-center justify-center border px-4 text-sm font-semibold transition ${form.type === type ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-950 hover:border-neutral-950'}`} active={form.type === type} onClick={() => setField('type', type)}>
                    {type === 'product' ? 'Product' : 'Service'}
                  </ChoiceButton>)}
              </div>
            </div>
  
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
                <Search size={15} className="text-neutral-500" />
                Parent Category
              </span>
              <SellerSelect className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-950 focus:ring-0" value={form.parent_id} onChange={event => setField('parent_id', event.target.value)}>
                <option value="">Select parent category</option>
                {categories.filter(category => String(category.id) !== String(form.id || '')).map(category => <option key={category.id} value={category.id}>
                      {category.parent ? `${category.parent.name} / ` : ''}{category.name}
                    </option>)}
              </SellerSelect>
              <small className="block text-xs text-neutral-500">Leave empty to create a root category, or select a parent to create a subcategory.</small>
            </label>
  
            <label className="block space-y-2">
              <span className="block text-sm font-semibold text-neutral-950">Description</span>
              <SellerTextarea className="w-full rounded-none border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-0" value={form.description} placeholder="Brief description of this category..." onChange={event => setField('description', event.target.value)} />
            </label>
  
            <div className="border border-neutral-200 bg-white p-5">
              <div className="flex items-center gap-4">
                <button type="button" className="inline-flex h-16 w-16 items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-50 text-neutral-400 transition hover:border-neutral-950" onClick={() => imageInputRef.current?.click()}>
                  {form.image ? <img src={form.image} alt="" className="h-full w-full object-cover" /> : 'IMG'}
                </button>
                <div className="min-w-0 flex-1 space-y-1">
                  <strong className="block text-sm font-semibold text-neutral-950">Category Image</strong>
                  <span className="block text-xs leading-5 text-neutral-500">Upload an image for this category.</span>
                  <div className="mt-3 flex items-center gap-3">
                    <Button type="button" variant="outline" className="h-9 whitespace-nowrap rounded-none border border-neutral-200 px-3 text-xs" onClick={() => imageInputRef.current?.click()}>
                      Choose File
                    </Button>
                    <small className="truncate text-xs text-neutral-500">{form.image ? 'Image selected' : 'No file chosen'}</small>
                  </div>
                </div>
                <input ref={imageInputRef} type="file" className="hidden" accept="image/*" onChange={event => handleImageFile(event.target.files?.[0])} />
              </div>
            </div>
  
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4 rounded-none border-neutral-300 text-neutral-950 focus:ring-neutral-950 focus:ring-offset-0" checked={form.is_active} onChange={event => setField('is_active', event.target.checked)} />
              <span className="text-sm font-semibold text-neutral-950">Active</span>
            </label>
          </div>
  
          <footer className="mt-6 flex justify-end gap-3 border-t border-neutral-200 pt-5">
            <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={onClose}>
              <X size={15} />
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="rounded-none border border-neutral-200 px-4" disabled={submitting}>
              <CheckCircle2 size={15} />
              {submitting ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
            </Button>
          </footer>
        </form>
      </div>
    </SellerModalBackdrop>;
};
export default CategoryDrawer;
