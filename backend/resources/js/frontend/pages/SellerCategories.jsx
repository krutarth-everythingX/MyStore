import React, { useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Check, CheckCircle2, Columns3, Edit, Folder, Image as ImageIcon, ListFilter, Plus, Search, Tag, Trash, Upload, X } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { DismissibleAlert } from '../components/DismissibleAlert';
import { SellerMobileDetailSheet } from '../components/SellerMobileDetailSheet';
import { SellerAvatar, SellerCard, SellerCheckboxOption, SellerEmptyState, SellerFloatingPanel, SellerGridBody, SellerGridCell, SellerGridHead, SellerGridRow, SellerModalBackdrop, SellerModalCard, SellerPageShell, SellerPaginationCard, SellerPill, SellerSearchField, SellerSelect, SellerSortHeader, SellerTablePaginationBar, SellerTableSurface, SellerTableWrap, SellerTextarea, SellerToolbar, SellerToolbarActions } from '../components/seller-workspace';
import { getNextSort, sortRows } from '../utils/tableSorting';
const buildCategoryTree = categories => {
  const map = new Map();
  const roots = [];
  categories.forEach(category => {
    map.set(category.id, {
      ...category,
      children: []
    });
  });
  categories.forEach(category => {
    const item = map.get(category.id);
    if (category.parent_id && map.has(category.parent_id)) {
      map.get(category.parent_id).children.push(item);
      return;
    }
    roots.push(item);
  });
  return roots;
};
const countChildren = category => (category.children || []).reduce((total, child) => total + 1 + countChildren(child), 0);
const initialsFor = name => {
  const parts = String(name || 'C').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
};
const slugify = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const buildPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({
    length: total
  }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
};
const categoryKind = category => category.type ? String(category.type).replace(/\b\w/g, letter => letter.toUpperCase()) : /service/i.test(`${category.name || ''} ${category.slug || ''}`) ? 'Service' : 'Product';
const defaultCategoryForm = {
  id: '',
  name: '',
  type: 'product',
  parent_id: '',
  description: '',
  image: '',
  is_active: true
};
const ChoiceCard = ({
  active,
  title,
  copy,
  onClick
}) => <button type="button" onClick={onClick} className={`flex w-full items-start gap-4 border p-4 text-left shadow-sm transition ${active ? 'border-neutral-950 bg-neutral-100' : 'border-neutral-950 bg-white hover:bg-neutral-50'}`}>
    <span className={`flex h-12 w-12 shrink-0 items-center justify-center border ${active ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-700'}`}>
      <Tag size={20} />
    </span>
    <span className="min-w-0">
      <strong className="block text-base font-semibold text-neutral-950">{title}</strong>
      <small className="mt-2 block text-sm leading-6 text-neutral-600">{copy}</small>
    </span>
  </button>;
export const SellerCategories = () => {
  const {
    props
  } = usePage();
  const imageInputRef = useRef(null);
  const toolbarRef = useRef(null);
  const [categories, setCategories] = useState(props.categories || []);
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [parentFilter, setParentFilter] = useState('all');
  const [sort, setSort] = useState({
    key: 'name',
    direction: 'asc'
  });
  const [formMode, setFormMode] = useState('create');
  const [form, setForm] = useState(defaultCategoryForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    subcategories: true,
    type: true,
    items: true,
    status: true
  });
  useEffect(() => {
    setCategories(props.categories || []);
    setSuccess(props.flash?.success || '');
    setError(props.flash?.error || '');
  }, [props.categories, props.flash]);
  useEffect(() => {
    if (!showColumns) return undefined;
    const handleClick = event => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        setShowColumns(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showColumns]);
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const categoryRows = useMemo(() => categories.map(category => ({
    ...category,
    child_count: (category.children || []).length,
    nested_count: countChildren(category),
    kind: categoryKind(category)
  })), [categories]);
  const rootCount = tree.length;
  const childCount = categories.length - rootCount;
  const filteredRows = categoryRows.filter(category => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [category.name, category.slug, category.parent?.name].join(' ').toLowerCase().includes(query);
    const matchesType = typeFilter === 'all' || category.kind.toLowerCase() === typeFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? category.is_active !== false : category.is_active === false);
    const matchesParent = parentFilter === 'all' || (parentFilter === 'root' ? !category.parent_id : String(category.parent_id) === parentFilter);
    return matchesSearch && matchesType && matchesStatus && matchesParent;
  });
  const sortedRows = useMemo(() => sortRows(filteredRows, sort, {
    name: category => category.name,
    subcategories: category => category.nested_count,
    type: category => category.kind,
    items: category => category.products_count || category.items_count || 0,
    status: category => category.is_active !== false
  }), [filteredRows, sort]);
  useEffect(() => {
    const totalPagesCount = Math.max(1, Math.ceil(sortedRows.length / productsPerPage));
    setCurrentPage(current => Math.min(current, totalPagesCount));
  }, [sortedRows.length, productsPerPage]);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / productsPerPage));
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return sortedRows.slice(start, start + productsPerPage);
  }, [currentPage, productsPerPage, sortedRows]);
  const paginatedIds = paginatedRows.map(category => category.id);
  const allVisibleSelected = paginatedIds.length > 0 && paginatedIds.every(id => selectedCategoryIds.includes(id));
  const someVisibleSelected = paginatedIds.some(id => selectedCategoryIds.includes(id));
  const activeFilterCount = [statusFilter, typeFilter, parentFilter].filter(value => value !== 'all').length;
  const selectedCount = selectedCategoryIds.length;
  const parentOptions = useMemo(() => categories.filter(category => !category.parent_id && String(category.id) !== String(form.id || '')).sort((first, second) => String(first.name || '').localeCompare(String(second.name || ''))), [categories, form.id]);
  const currentParent = categories.find(category => String(category.id) === String(form.parent_id || ''));
  const categoryLevelLabel = form.parent_id ? 'Subcategory' : 'Root category';
  const formHeading = formMode === 'edit' ? 'Edit Category' : formMode === 'child' ? 'Create Subcategory' : 'Create Category';
  const formSubmitLabel = submitting ? 'Saving...' : formMode === 'edit' ? 'Update Category' : 'Create Category';
  const slugPreview = slugify(form.name);
  const columnTemplate = ['34px', '42px', 'minmax(320px, 2fr)', visibleColumns.subcategories ? 'minmax(160px, 1fr)' : null, visibleColumns.type ? '128px' : null, visibleColumns.items ? '100px' : null, visibleColumns.status ? '118px' : null, '84px'].filter(Boolean).join(' ');
  const renderCategorySortHeader = (key, label, className) => <SellerSortHeader active={sort.key === key} direction={sort.direction} className={`gap-1 ${className || ''}`} onClick={() => updateSort(key)}>
      {label}
    </SellerSortHeader>;
  const openCreate = () => {
    setFormMode('create');
    setForm(defaultCategoryForm);
    setSubmitting(false);
    setError('');
    setView('form');
  };
  const openEdit = category => {
    setFormMode('edit');
    setForm({
      id: category.id,
      name: category.name || '',
      type: category.type || (/service/i.test(`${category.name || ''} ${category.slug || ''}`) ? 'service' : 'product'),
      parent_id: category.parent_id || '',
      description: category.description || '',
      image: category.image || '',
      is_active: category.is_active !== false
    });
    setSubmitting(false);
    setError('');
    setView('form');
  };
  const openChild = category => {
    setFormMode('child');
    setForm({
      ...defaultCategoryForm,
      parent_id: category.id,
      type: category.type || 'product'
    });
    setSubmitting(false);
    setError('');
    setView('form');
  };
  const closeForm = () => {
    setView('list');
    setForm(defaultCategoryForm);
    setSubmitting(false);
    setError('');
  };
  const setFormField = (field, value) => {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  };
  const handleDelete = category => {
    if (!window.confirm(`Delete "${category.name}"? Subcategories will move up one level.`)) return;
    router.delete(`/categories/${category.id}`, {
      preserveScroll: true,
      only: ['categories', 'flash']
    });
  };
  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setParentFilter('all');
  };
  const bulkDeleteSelectedCategories = async () => {
    if (!selectedCategoryIds.length) return;
    if (!window.confirm(`Delete ${selectedCategoryIds.length} selected categor${selectedCategoryIds.length === 1 ? 'y' : 'ies'}?`)) return;
    try {
      const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      await Promise.all(selectedCategoryIds.map(async categoryId => {
        const response = await fetch(`/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrf,
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'same-origin'
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.message || 'One or more categories could not be deleted.');
        }
      }));
      setSelectedCategoryIds([]);
      setSuccess('Selected categories deleted successfully.');
      router.reload({
        preserveScroll: true,
        only: ['categories', 'flash']
      });
    } catch (deleteError) {
      setError(deleteError.message || 'Selected categories could not be deleted.');
    }
  };
  const handleImageFile = file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormField('image', String(reader.result || ''));
    reader.readAsDataURL(file);
  };
  const submitCategory = event => {
    event?.preventDefault?.();
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
        setSuccess(formMode === 'edit' ? 'Category updated successfully.' : 'Category created successfully.');
        closeForm();
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
    if (formMode === 'edit' && form.id) {
      router.put(`/categories/${form.id}`, payload, options);
      return;
    }
    router.post('/categories', payload, options);
  };
  const updateSort = key => setSort(current => getNextSort(current, key));
  if (view === 'form') {
    return <div>
        <Sidebar />

        <SellerPageShell>
          <header className="border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">{formHeading}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600">Build a structured category with type, hierarchy, visibility, and imagery for your catalog.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={closeForm}>
                  <X size={15} />
                  Cancel
                </Button>
                <Button variant="primary" onClick={submitCategory} disabled={submitting}>
                  <Check size={15} />
                  {formSubmitLabel}
                </Button>
              </div>
            </div>
          </header>

          {(error || success) && <DismissibleAlert onClose={() => {
          setError('');
          setSuccess('');
        }} role={error ? 'alert' : 'status'}>
              {error || success}
            </DismissibleAlert>}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <form onSubmit={submitCategory} className="space-y-6">
              <SellerCard className="space-y-6">
                <div className="flex flex-col gap-5 border-b border-neutral-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-neutral-950">Category details</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-neutral-600">Set the category name, preview slug, and description shoppers and catalog managers will recognize.</p>
                  </div>

                  <label className="flex items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 py-3">
                    <span className="min-w-0">
                      <strong className="block text-sm font-semibold text-neutral-950">Active</strong>
                      <small className="mt-1 block text-xs leading-5 text-neutral-500">Control whether this category is available for product organization.</small>
                    </span>
                    <input className="h-4 w-4 shrink-0 accent-neutral-950" type="checkbox" checked={form.is_active} onChange={event => setFormField('is_active', event.target.checked)} />
                  </label>
                </div>

                <div className="grid gap-5">
                  <label className="space-y-2">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Name *</span>
                    <input className="min-h-12 w-full border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none" value={form.name} placeholder="Summer essentials" onChange={event => setFormField('name', event.target.value)} />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Slug preview</span>
                    <input className="min-h-12 w-full border border-neutral-200 bg-neutral-100 px-4 text-sm text-neutral-950 outline-none" value={slugPreview || 'category-slug'} readOnly />
                    <small className="block text-xs leading-5 text-neutral-500">Generated automatically from the category name.</small>
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Description</span>
                    <SellerTextarea value={form.description} placeholder="Start writing..." onChange={event => setFormField('description', event.target.value)} />
                  </label>
                </div>
              </SellerCard>

              <SellerCard className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-950">Category type</h2>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">Choose whether this category is used for physical products or service-based offerings.</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {[{
                  key: 'product',
                  title: 'Product',
                  copy: 'Use this for merchandise, physical goods, and stock-tracked catalog items.'
                }, {
                  key: 'service',
                  title: 'Service',
                  copy: 'Use this for appointments, memberships, consultations, and service listings.'
                }].map(option => <ChoiceCard key={option.key} active={form.type === option.key} title={option.title} copy={option.copy} onClick={() => setFormField('type', option.key)} />)}
                </div>
              </SellerCard>
            </form>

            <div className="space-y-6">
              <SellerCard className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-950">Organization</h2>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">Choose where this category sits inside your catalog structure.</p>
                </div>

                <div className="grid gap-5">
                  <label className="space-y-2">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Parent category</span>
                    <SellerSelect value={form.parent_id} onChange={event => setFormField('parent_id', event.target.value)}>
                      <option value="">No parent category</option>
                      {parentOptions.map(category => <option key={category.id} value={category.id}>
                          {category.name}
                        </option>)}
                    </SellerSelect>
                  </label>

                  <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                    <strong className="block text-sm font-semibold text-neutral-950">{categoryLevelLabel}</strong>
                    <span className="mt-2 block text-sm leading-6 text-neutral-600">{currentParent ? `This category will appear under ${currentParent.name}.` : 'This category will appear at the top level of your catalog.'}</span>
                  </div>
                </div>
              </SellerCard>

              <SellerCard className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-950">Category image</h2>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">Add a strong visual to represent this category on catalog pages and internal tools.</p>
                </div>

                <div className="grid gap-4">
                  <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center gap-4 border border-dashed border-neutral-950 bg-neutral-50 p-6 text-center" onDragOver={event => event.preventDefault()} onDrop={event => {
                  event.preventDefault();
                  handleImageFile(event.dataTransfer.files?.[0]);
                }}>
                    {form.image ? <img className="max-h-56 w-full border border-neutral-200 object-cover" src={form.image} alt="" /> : <>
                        <ImageIcon size={42} className="text-neutral-700" />
                        <div>
                          <strong className="block text-base font-semibold text-neutral-950">Drag and drop an image here</strong>
                          <span className="mt-2 block text-sm leading-6 text-neutral-600">Or click to browse and upload a category image.</span>
                        </div>
                      </>}
                    <input className="hidden" ref={imageInputRef} type="file" accept="image/*" onChange={event => handleImageFile(event.target.files?.[0])} />
                  </label>

                  <p className="text-sm leading-6 text-neutral-600">Click, drag and drop, or replace the image whenever the category artwork changes.</p>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" type="button" onClick={() => imageInputRef.current?.click()}>
                      <Upload size={14} />
                      {form.image ? 'Replace Image' : 'Upload Image'}
                    </Button>
                    {form.image && <Button variant="outline" type="button" onClick={() => setFormField('image', '')}>
                        <X size={14} />
                        Remove Image
                      </Button>}
                  </div>
                </div>
              </SellerCard>
            </div>
          </div>
        </SellerPageShell>
      </div>;
  }
  return <div>
      <Sidebar />

      <SellerPageShell>
        <div className="border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">Item Categories</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">Manage item categories and subcategories.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={openCreate}>
                <Plus size={15} />
                Add Category
              </Button>
            </div>
          </div>

          <div aria-label="Category summary" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Total Categories</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{categories.length}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Tag size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Active</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{categories.filter(category => category.is_active !== false).length}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><CheckCircle2 size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Root Categories</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{rootCount}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Folder size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Subcategories</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{childCount}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Folder size={14} /></div>
              </div>
            </div>
          </div>
        </div>

        {(error || success) && <DismissibleAlert onClose={() => {
        setError('');
        setSuccess('');
      }} role={error ? 'alert' : 'status'}>
            {error || success}
          </DismissibleAlert>}

        <SellerTableSurface>
          <SellerToolbar search={<SellerSearchField className="xl:max-w-[560px]" icon={Search} value={search} placeholder="Search by category name..." onChange={event => setSearch(event.target.value)} />} actions={<SellerToolbarActions>
                <div ref={toolbarRef} className="flex w-full flex-wrap items-center gap-3 xl:w-auto xl:justify-end">
                  <div className="relative">
                    <Button type="button" variant="outline" onClick={() => {
                setShowColumns(current => !current);
                setShowFilters(false);
              }}>
                      <Columns3 size={14} />
                      Manage Columns
                    </Button>
                    {showColumns && <SellerFloatingPanel className="absolute left-0 top-[calc(100%+0.75rem)] z-20 w-64">
                        {Object.entries({
                  subcategories: 'Subcategories',
                  type: 'Type',
                  items: 'Items',
                  status: 'Status'
                }).map(([key, label]) => <SellerCheckboxOption key={key} checked={visibleColumns[key]} onChange={event => setVisibleColumns(current => ({
                  ...current,
                  [key]: event.target.checked
                }))} label={label} />)}
                      </SellerFloatingPanel>}
                  </div>
                  <div className="relative">
                    <Button type="button" variant={activeFilterCount > 0 ? 'primary' : 'outline'} onClick={() => {
                setShowFilters(current => !current);
                setShowColumns(false);
              }}>
                      <ListFilter size={14} />
                      Filters
                      {activeFilterCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center border border-neutral-950 bg-neutral-950 px-1 text-[10px] font-semibold text-white">
                          {activeFilterCount}
                        </span>}
                    </Button>
                  </div>
                </div>

                {activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="inline-flex min-h-10 items-center justify-center border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100">
                    Clear
                  </button>}
              </SellerToolbarActions>} />

          <SellerTableWrap className="hidden xl:block">
              <SellerGridHead style={{
            gridTemplateColumns: columnTemplate
          }}>
              <SellerGridCell>
                <input className="h-4 w-4 accent-neutral-950" type="checkbox" checked={allVisibleSelected} ref={input => {
                if (input) input.indeterminate = !allVisibleSelected && someVisibleSelected;
              }} onChange={event => {
                setSelectedCategoryIds(current => event.target.checked ? Array.from(new Set([...current, ...paginatedIds])) : current.filter(id => !paginatedIds.includes(id)));
              }} />
              </SellerGridCell>
              <SellerGridCell>#</SellerGridCell>
              {renderCategorySortHeader('name', 'Name', 'justify-start')}
              {visibleColumns.subcategories && renderCategorySortHeader('subcategories', 'Subcategories', 'justify-center')}
              {visibleColumns.type && renderCategorySortHeader('type', 'Type', 'justify-center')}
              {visibleColumns.items && renderCategorySortHeader('items', 'Items', 'justify-center')}
              {visibleColumns.status && renderCategorySortHeader('status', 'Status', 'justify-center')}
              <SellerGridCell className="text-center">Actions</SellerGridCell>
            </SellerGridHead>

            <SellerGridBody>
              {paginatedRows.length === 0 ? <SellerEmptyState className="m-4" title="No categories found" description="Create a category or adjust the current filters." /> : paginatedRows.map((category, index) => <SellerGridRow key={category.id} style={{
              gridTemplateColumns: columnTemplate
            }}>
                  <SellerGridCell>
                    <input className="h-4 w-4 accent-neutral-950" type="checkbox" checked={selectedCategoryIds.includes(category.id)} onChange={() => setSelectedCategoryIds(current => current.includes(category.id) ? current.filter(id => id !== category.id) : [...current, category.id])} />
                  </SellerGridCell>
                  <SellerGridCell className="text-sm font-medium text-neutral-500">{(currentPage - 1) * productsPerPage + index + 1}</SellerGridCell>
                  <SellerGridCell className="flex items-center gap-3">
                    {category.image ? <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-100">
                        <img className="h-full w-full object-cover" src={category.image} alt="" />
                      </span> : <SellerAvatar>{initialsFor(category.name)}</SellerAvatar>}
                    <div className="min-w-0">
                      <strong className="block truncate text-sm font-semibold text-neutral-950">{category.name}</strong>
                      <span className="mt-1 block truncate text-xs text-neutral-500">{category.parent?.name ? `Parent: ${category.parent.name}` : 'Root category'}</span>
                    </div>
                  </SellerGridCell>
                  {visibleColumns.subcategories && <SellerGridCell className="text-center text-sm text-neutral-700">{category.child_count > 0 ? category.child_count : '-'}</SellerGridCell>}
                  {visibleColumns.type && <SellerGridCell className="flex justify-center">
                      <SellerPill tone="neutral">{category.kind}</SellerPill>
                    </SellerGridCell>}
                  {visibleColumns.items && <SellerGridCell className="text-center text-sm text-neutral-700">{category.products_count || 0}</SellerGridCell>}
                  {visibleColumns.status && <SellerGridCell className="flex justify-center">
                      <SellerPill tone={category.is_active === false ? 'danger' : 'success'}>
                        {category.is_active === false ? 'Inactive' : 'Active'}
                      </SellerPill>
                    </SellerGridCell>}
                  <SellerGridCell>
                    <div className="flex justify-center">
                      <div className="grid w-full max-w-[5.5rem] grid-cols-2 gap-2">
                        <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400" type="button" onClick={() => setSelectedCategoryDetail(category)} aria-label={`View ${category.name}`} title="View">
                          <Search size={14} />
                        </button>
                        <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400" type="button" onClick={() => openEdit(category)} aria-label={`Edit ${category.name}`} title="Edit">
                          <Edit size={14} />
                        </button>
                        <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400" type="button" onClick={() => openChild(category)} aria-label={`Add subcategory to ${category.name}`} title="Add Subcategory">
                          <Plus size={14} />
                        </button>
                        <button className="inline-flex h-9 w-9 items-center justify-center border border-rose-500 bg-white text-rose-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-white disabled:text-rose-300" type="button" onClick={() => handleDelete(category)} aria-label={`Delete ${category.name}`} title="Delete">
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  </SellerGridCell>
                </SellerGridRow>)}
            </SellerGridBody>
          </SellerTableWrap>

          <div className="space-y-4 border-t border-neutral-200 p-4 xl:hidden">
            <div className="space-y-4">
              {paginatedRows.length === 0 ? <SellerEmptyState title="No categories found" description="Create a category or adjust the current filters." /> : paginatedRows.map(category => <article key={`mobile-${category.id}`} className="border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-base font-semibold text-neutral-950">{category.name}</strong>
                      <span className="mt-1 block truncate text-xs text-neutral-500">{category.parent?.name ? `Parent: ${category.parent.name}` : 'Root category'}</span>
                    </div>
                    <SellerPill tone={category.is_active === false ? 'danger' : 'success'}>
                      {category.is_active === false ? 'Inactive' : 'Active'}
                    </SellerPill>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <strong className="block text-sm font-semibold text-neutral-950">{category.kind}</strong>
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Type</span>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <strong className="block text-sm font-semibold text-neutral-950">{category.child_count || 0}</strong>
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Subcategories</span>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <strong className="block text-sm font-semibold text-neutral-950">{category.products_count || 0}</strong>
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Items</span>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <strong className="block truncate text-sm font-semibold text-neutral-950">{category.slug || '-'}</strong>
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Slug</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={() => setSelectedCategoryDetail(category)}>View</Button>
                    <Button type="button" variant="outline" onClick={() => openEdit(category)}>Edit</Button>
                    <Button type="button" variant="primary" onClick={() => openChild(category)}>Add Subcategory</Button>
                  </div>
                </article>)}
            </div>
          </div>

        </SellerTableSurface>

        <SellerPaginationCard>
          <SellerTablePaginationBar showBorder={false} className="bg-transparent px-0 pb-0 pt-0" summary={`Showing ${filteredRows.length > 0 ? (currentPage - 1) * productsPerPage + 1 : 0} to ${Math.min(currentPage * productsPerPage, filteredRows.length)} of ${filteredRows.length} results`} currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} onPageChange={setCurrentPage} perPage={productsPerPage} onPerPageChange={event => {
          setProductsPerPage(Number(event.target.value));
          setCurrentPage(1);
        }} />
        </SellerPaginationCard>

        {selectedCount > 0 && <div className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold text-neutral-950">{selectedCount} {selectedCount === 1 ? 'Item' : 'Items'} selected</span>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => setSelectedCategoryIds([])}>Clear</Button>
              <Button type="button" variant="primary" onClick={bulkDeleteSelectedCategories}>Delete Selected</Button>
            </div>
          </div>}
      </SellerPageShell>

      {showFilters && <SellerModalBackdrop onClose={() => setShowFilters(false)}>
          <SellerModalCard onMouseDown={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
              <div>
                <h3 className="text-xl font-semibold text-neutral-950">Filters</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">Refine the category list by type, parent category, or status.</p>
              </div>
              <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950" type="button" onClick={() => setShowFilters(false)} aria-label="Close filters">
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Type</span>
                <SellerSelect value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
                  <option value="all">All types</option>
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                </SellerSelect>
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Parent Category</span>
                <SellerSelect value={parentFilter} onChange={event => setParentFilter(event.target.value)}>
                  <option value="all">All parent categories</option>
                  <option value="root">No parent category</option>
                  {categories.filter(category => !category.parent_id).map(category => <option key={category.id} value={String(category.id)}>{category.name}</option>)}
                </SellerSelect>
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                <SellerSelect value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </SellerSelect>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" onClick={clearFilters}>Clear</Button>
              <Button variant="primary" onClick={() => setShowFilters(false)}>Apply Filters</Button>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}

      {selectedCategoryDetail && <SellerModalBackdrop onClose={() => setSelectedCategoryDetail(null)}>
          <SellerModalCard className="hidden max-w-2xl bg-white lg:block" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Category Preview</span>
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{selectedCategoryDetail.name || 'Untitled category'}</h3>
                  <p className="text-sm leading-6 text-neutral-500">{selectedCategoryDetail.parent?.name ? `Parent: ${selectedCategoryDetail.parent.name}` : 'Root category'}</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedCategoryDetail(null)} aria-label="Close category preview">
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4 border border-neutral-200 bg-neutral-50 px-4 py-4">
                  {selectedCategoryDetail.image ? <span className="inline-flex h-14 w-14 items-center justify-center overflow-hidden border border-neutral-200 bg-white">
                      <img src={selectedCategoryDetail.image} alt="" className="h-full w-full object-cover" />
                    </span> : <SellerAvatar className="h-14 w-14">{initialsFor(selectedCategoryDetail.name)}</SellerAvatar>}
                  <div className="min-w-0">
                    <strong className="block truncate text-base font-semibold text-neutral-950">{selectedCategoryDetail.kind}</strong>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Category type</span>
                  </div>
                </div>

                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{selectedCategoryDetail.is_active === false ? 'Inactive' : 'Active'}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                </div>

                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{selectedCategoryDetail.child_count || 0}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Subcategories</span>
                </div>

                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{selectedCategoryDetail.products_count || 0}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Items</span>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Slug</span>
                  <strong className="mt-2 block break-all text-sm font-semibold text-neutral-950">{selectedCategoryDetail.slug || '-'}</strong>
                </div>

                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Description</span>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{selectedCategoryDetail.description || 'No description added yet.'}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
                <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              openEdit(selectedCategoryDetail);
              setSelectedCategoryDetail(null);
            }}>
                  Edit
                </Button>
                <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              openChild(selectedCategoryDetail);
              setSelectedCategoryDetail(null);
            }}>
                  Add Subcategory
                </Button>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}

      <div className="lg:hidden">
        <SellerMobileDetailSheet open={Boolean(selectedCategoryDetail)} title={selectedCategoryDetail?.name || ''} subtitle={selectedCategoryDetail?.parent?.name ? `Parent: ${selectedCategoryDetail.parent.name}` : 'Root category'} onClose={() => setSelectedCategoryDetail(null)} items={selectedCategoryDetail ? [{
      label: 'Type',
      value: selectedCategoryDetail.kind
    }, {
      label: 'Status',
      value: selectedCategoryDetail.is_active === false ? 'Inactive' : 'Active'
    }, {
      label: 'Subcategories',
      value: String(selectedCategoryDetail.child_count || 0)
    }, {
      label: 'Items',
      value: String(selectedCategoryDetail.products_count || 0)
    }, {
      label: 'Slug',
      value: selectedCategoryDetail.slug || '-'
    }, {
      label: 'Description',
      value: selectedCategoryDetail.description || '-'
    }] : []} actions={selectedCategoryDetail ? <>
            <Button type="button" variant="outline" onClick={() => {
        openEdit(selectedCategoryDetail);
        setSelectedCategoryDetail(null);
      }}>
              Edit
            </Button>
            <Button type="button" variant="primary" onClick={() => {
        openChild(selectedCategoryDetail);
        setSelectedCategoryDetail(null);
      }}>
            Add Subcategory
          </Button>
          </> : null} />
      </div>
    </div>;
};
export default SellerCategories;
