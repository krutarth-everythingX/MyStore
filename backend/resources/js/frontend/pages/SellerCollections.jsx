import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Check, Columns3, Edit3, Folder, Image as ImageIcon, ListFilter, Plus, Search, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { DismissibleAlert } from '../components/DismissibleAlert';
import { Input } from '../components/Input';
import { SellerMobileDetailSheet } from '../components/SellerMobileDetailSheet';
import { SellerAvatar, SellerCard, SellerCheckboxOption, SellerEmptyState, SellerFloatingPanel, SellerGridBody, SellerGridCell, SellerGridHead, SellerGridRow, SellerIconButton, SellerModalBackdrop, SellerModalCard, SellerPageHeader, SellerPageShell, SellerPaginationCard, SellerPill, SellerSearchField, SellerSelect, SellerSortHeader, SellerTablePaginationBar, SellerTableSurface, SellerTableWrap, SellerTextarea, SellerToolbar, SellerToolbarActions } from '../components/seller-workspace';
import { getNextSort, sortRows } from '../utils/tableSorting';
const slugify = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const defaultCondition = () => ({
  id: Date.now() + Math.random(),
  field: 'Product title',
  operator: 'contains',
  value: ''
});
const emptyCollectionForm = () => ({
  id: null,
  title: '',
  handle: '',
  description: '',
  active: true,
  type: 'manual',
  channels: ['EverythingX'],
  template: 'Product grid',
  image: '',
  conditionMode: 'any',
  seoTitle: '',
  seoDescription: ''
});
const normalizeCollection = collection => ({
  ...collection,
  channels: Array.isArray(collection.channels) ? collection.channels : ['EverythingX'],
  conditions: Array.isArray(collection.conditions) ? collection.conditions : [],
  product_ids: Array.isArray(collection.product_ids) ? collection.product_ids : []
});
const buildPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({
    length: total
  }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
};
const conditionFieldOptions = ['Product title', 'Product type', 'Vendor', 'Price', 'Tag'];
const conditionOperatorOptions = [{
  value: 'contains',
  label: 'contains'
}, {
  value: 'equals',
  label: 'equals'
}, {
  value: 'starts_with',
  label: 'starts with'
}, {
  value: 'ends_with',
  label: 'ends with'
}, {
  value: 'greater_than',
  label: 'greater than'
}, {
  value: 'less_than',
  label: 'less than'
}];
const collectionInitial = title => {
  const firstLetter = String(title || 'C').trim().charAt(0).toUpperCase();
  return firstLetter || 'C';
};
const ProductOptionRow = ({
  product,
  checked,
  onChange
}) => <label className="flex cursor-pointer items-center gap-3 border border-neutral-200 bg-white px-4 py-3 transition hover:bg-neutral-50">
    <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-neutral-950" />
    <SellerAvatar>{String(product.name || 'P').slice(0, 2).toUpperCase()}</SellerAvatar>
    <span className="min-w-0 flex-1">
      <strong className="block truncate text-sm font-semibold text-neutral-950">{product.name || 'Untitled product'}</strong>
      <small className="mt-1 block truncate text-xs text-neutral-500">{product.sku || product.mystore_product_id || `#${product.id}`}</small>
    </span>
  </label>;
const CollectionTypeCard = ({
  active,
  icon: Icon,
  title,
  description,
  onClick
}) => <button type="button" onClick={onClick} className={`flex min-h-[118px] items-start gap-4 border px-4 py-4 text-left transition ${active ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100'}`}>
    <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center border ${active ? 'border-white bg-white/10 text-white' : 'border-neutral-950 bg-white text-neutral-950'}`}>
      <Icon size={20} />
    </span>
    <span className="min-w-0">
      <strong className="block text-base font-semibold">{title}</strong>
      <small className={`mt-2 block text-sm leading-6 ${active ? 'text-white/80' : 'text-neutral-500'}`}>{description}</small>
    </span>
  </button>;
const collectionInputClassName = 'h-12 rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none focus:border-neutral-950 focus:ring-0';
const collectionTextareaInputClassName = 'min-h-32 rounded-none border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 shadow-none focus:border-neutral-950 focus:ring-0';
const collectionLabelClassName = 'text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500';
export const SellerCollections = () => {
  const {
    props
  } = usePage();
  const imageInputRef = useRef(null);
  const products = props.sellerProducts || [];
  const [collections, setCollections] = useState((props.sellerCollections || []).map(normalizeCollection));
  const [view, setView] = useState('list');
  const [form, setForm] = useState(emptyCollectionForm);
  const [handleEdited, setHandleEdited] = useState(false);
  const [search, setSearch] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState([]);
  const [collectionsPerPage, setCollectionsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [collectionFilters, setCollectionFilters] = useState({
    status: 'all',
    type: 'all'
  });
  const [sort, setSort] = useState({
    key: 'title',
    direction: 'asc'
  });
  const [visibleColumns, setVisibleColumns] = useState({
    type: true,
    products: true,
    preview: true,
    status: true
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [conditions, setConditions] = useState([defaultCondition()]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedCollectionDetail, setSelectedCollectionDetail] = useState(null);
  const selectedCollectionCount = selectedCollectionIds.length;
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products.slice(0, 6);
    return products.filter(product => `${product.name || ''} ${product.sku || ''} ${product.mystore_product_id || ''}`.toLowerCase().includes(query)).slice(0, 8);
  }, [products, search]);
  const selectedProducts = useMemo(() => selectedProductIds.map(id => products.find(product => product.id === id)).filter(Boolean), [products, selectedProductIds]);
  const visibleCollections = useMemo(() => {
    const query = listSearch.trim().toLowerCase();
    return collections.filter(collection => {
      const matchesSearch = !query || `${collection.title || ''} ${collection.handle || ''} ${collection.type || ''}`.toLowerCase().includes(query);
      const matchesStatus = collectionFilters.status === 'all' || (collectionFilters.status === 'active' ? collection.active : !collection.active);
      const matchesType = collectionFilters.type === 'all' || collection.type === collectionFilters.type;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [collectionFilters.status, collectionFilters.type, collections, listSearch]);
  const sortedCollections = useMemo(() => sortRows(visibleCollections, sort, {
    title: collection => collection.title,
    type: collection => collection.type,
    products: collection => Array.isArray(collection.product_ids) ? collection.product_ids.length : 0,
    status: collection => collection.active
  }), [sort, visibleCollections]);
  const collectionStats = useMemo(() => {
    const linkedProducts = collections.reduce((total, collection) => total + (Array.isArray(collection.product_ids) ? collection.product_ids.length : 0), 0);
    return {
      total: collections.length,
      active: collections.filter(collection => collection.active).length,
      inactive: collections.filter(collection => !collection.active).length,
      linkedProducts
    };
  }, [collections]);
  useEffect(() => {
    const totalPagesCount = Math.max(1, Math.ceil(sortedCollections.length / collectionsPerPage));
    setCurrentPage(current => Math.min(current, totalPagesCount));
  }, [collectionsPerPage, sortedCollections.length]);
  const totalPages = Math.max(1, Math.ceil(sortedCollections.length / collectionsPerPage));
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const paginatedCollections = useMemo(() => {
    const start = (currentPage - 1) * collectionsPerPage;
    return sortedCollections.slice(start, start + collectionsPerPage);
  }, [collectionsPerPage, currentPage, sortedCollections]);
  const paginatedCollectionIds = paginatedCollections.map(collection => collection.id);
  const allVisibleCollectionsSelected = paginatedCollectionIds.length > 0 && paginatedCollectionIds.every(id => selectedCollectionIds.includes(id));
  const someVisibleCollectionsSelected = paginatedCollectionIds.some(id => selectedCollectionIds.includes(id));
  const activeCollectionFilterCount = Object.values(collectionFilters).filter(value => value !== 'all').length;
  const collectionColumnTemplate = ['34px', '42px', 'minmax(280px, 1.8fr)', visibleColumns.type ? '120px' : null, visibleColumns.products ? '100px' : null, visibleColumns.preview ? 'minmax(220px, 1.1fr)' : null, visibleColumns.status ? '118px' : null, '118px'].filter(Boolean).join(' ');
  const renderCollectionSortHeader = (key, label, className) => <SellerSortHeader active={sort.key === key} direction={sort.direction} className={`gap-1 ${className || ''}`} onClick={() => updateSort(key)}>
      {label}
    </SellerSortHeader>;
  const formHeading = form.id ? 'Edit Collection' : 'Add Collection';
  const formDescription = form.id ? 'Update collection rules, merchandising, and publishing settings.' : 'Create a manual or smart collection for your catalog.';
  const toggleCollectionSelection = id => {
    setSelectedCollectionIds(current => current.includes(id) ? current.filter(collectionId => collectionId !== id) : [...current, id]);
  };
  const setField = (field, value) => {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  };
  const updateTitle = value => {
    setForm(current => ({
      ...current,
      title: value,
      handle: handleEdited ? current.handle : slugify(value)
    }));
  };
  const openCreateCollection = () => {
    setForm(emptyCollectionForm());
    setSelectedProductIds([]);
    setConditions([defaultCondition()]);
    setSearch('');
    setHandleEdited(false);
    setMessage('');
    setView('form');
  };
  const openEditCollection = collection => {
    const normalized = normalizeCollection(collection);
    setForm({
      id: normalized.id,
      title: normalized.title || '',
      handle: normalized.handle || '',
      description: normalized.description || '',
      active: normalized.active ?? true,
      type: normalized.type || 'manual',
      channels: normalized.channels?.length ? normalized.channels : ['EverythingX'],
      template: normalized.template || 'Product grid',
      image: normalized.image || '',
      conditionMode: normalized.condition_mode || 'any',
      seoTitle: normalized.seo_title || '',
      seoDescription: normalized.seo_description || ''
    });
    setSelectedProductIds(normalized.product_ids || []);
    setConditions(normalized.conditions?.length ? normalized.conditions : [defaultCondition()]);
    setSearch('');
    setHandleEdited(true);
    setMessage('');
    setView('form');
  };
  const closeForm = () => {
    setMessage('');
    setView('list');
  };
  const uploadImage = async file => {
    if (!file) return;
    setImageUploading(true);
    setMessage('');
    try {
      const payload = new FormData();
      payload.append('image', file);
      const response = await fetch('/media/upload', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: payload
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Image upload failed.');
      setField('image', data?.url || '');
    } catch (error) {
      setMessage(error.message || 'Image upload failed.');
    } finally {
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      setImageUploading(false);
    }
  };
  const clearCollectionImage = () => {
    setField('image', '');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };
  const toggleProduct = productId => {
    setSelectedProductIds(current => {
      const isSelected = current.includes(productId);
      if (!isSelected) {
        setSearch('');
      }
      return isSelected ? current.filter(id => id !== productId) : [...current, productId];
    });
  };
  const updateCondition = (id, field, value) => {
    setConditions(current => current.map(condition => condition.id === id ? {
      ...condition,
      [field]: value
    } : condition));
  };
  const addCondition = () => {
    setConditions(current => [...current, defaultCondition()]);
  };
  const removeCondition = id => {
    setConditions(current => current.length === 1 ? current : current.filter(condition => condition.id !== id));
  };
  const saveCollection = async () => {
    setMessage('');
    if (!form.title.trim()) {
      setMessage('Collection title is required.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/seller/collections', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          id: form.id,
          title: form.title.trim(),
          handle: form.handle.trim() || slugify(form.title),
          description: form.description,
          active: form.active,
          type: form.type,
          channels: form.channels,
          template: form.template,
          image: form.image || null,
          condition_mode: form.conditionMode,
          conditions: form.type === 'smart' ? conditions : [],
          product_ids: form.type === 'manual' ? selectedProductIds : [],
          seo_title: form.seoTitle,
          seo_description: form.seoDescription
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage = data?.errors ? Object.values(data.errors).flat()[0] : data?.message;
        throw new Error(errorMessage || 'Collection could not be saved.');
      }
      const savedCollection = normalizeCollection(data);
      setCollections(current => {
        const exists = current.some(collection => collection.id === savedCollection.id);
        if (exists) {
          return current.map(collection => collection.id === savedCollection.id ? savedCollection : collection);
        }
        return [savedCollection, ...current];
      });
      setMessage('Collection saved successfully.');
      setView('list');
    } catch (error) {
      setMessage(error.message || 'Collection could not be saved.');
    } finally {
      setSaving(false);
    }
  };
  const deleteCollection = async collectionId => {
    setDeletingId(collectionId);
    setMessage('');
    try {
      const response = await fetch(`/seller/collections/${collectionId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Collection could not be deleted.');
      setCollections(current => current.filter(collection => collection.id !== collectionId));
      setMessage('Collection deleted successfully.');
    } catch (error) {
      setMessage(error.message || 'Collection could not be deleted.');
    } finally {
      setDeletingId(null);
    }
  };
  const clearCollectionFilters = () => {
    setCollectionFilters({
      status: 'all',
      type: 'all'
    });
  };
  const persistCollectionUpdate = async (collection, overrides = {}) => {
    const response = await fetch('/seller/collections', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        id: collection.id,
        title: collection.title || '',
        handle: collection.handle || slugify(collection.title),
        description: collection.description || '',
        active: overrides.active ?? collection.active ?? true,
        type: collection.type || 'manual',
        channels: Array.isArray(collection.channels) && collection.channels.length ? collection.channels : ['EverythingX'],
        template: collection.template || 'Product grid',
        image: collection.image || null,
        condition_mode: collection.condition_mode || collection.conditionMode || 'any',
        conditions: Array.isArray(collection.conditions) ? collection.conditions : [],
        product_ids: Array.isArray(collection.product_ids) ? collection.product_ids : [],
        seo_title: collection.seo_title || '',
        seo_description: collection.seo_description || ''
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = data?.errors ? Object.values(data.errors).flat()[0] : data?.message;
      throw new Error(errorMessage || 'Collection could not be updated.');
    }
    return normalizeCollection(data);
  };
  const bulkDeleteCollections = async () => {
    if (!selectedCollectionIds.length) return;
    if (!window.confirm(`Delete ${selectedCollectionIds.length} selected collection${selectedCollectionIds.length === 1 ? '' : 's'}?`)) return;
    setMessage('');
    try {
      await Promise.all(selectedCollectionIds.map(async collectionId => {
        const response = await fetch(`/seller/collections/${collectionId}`, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'same-origin'
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || 'Collection could not be deleted.');
      }));
      setCollections(current => current.filter(collection => !selectedCollectionIds.includes(collection.id)));
      setSelectedCollectionIds([]);
      setMessage('Collections deleted successfully.');
    } catch (error) {
      setMessage(error.message || 'Collections could not be deleted.');
    }
  };
  const bulkSetCollectionStatus = async active => {
    if (!selectedCollectionIds.length) return;
    setMessage('');
    try {
      const selectedSet = new Set(selectedCollectionIds);
      const targets = collections.filter(collection => selectedSet.has(collection.id));
      const updatedCollections = await Promise.all(targets.map(collection => persistCollectionUpdate(collection, {
        active
      })));
      const updatedMap = new Map(updatedCollections.map(collection => [collection.id, collection]));
      setCollections(current => current.map(collection => updatedMap.get(collection.id) || collection));
      setMessage(`Collections ${active ? 'activated' : 'deactivated'} successfully.`);
    } catch (error) {
      setMessage(error.message || 'Collection status could not be updated.');
    }
  };
  const updateSort = key => setSort(current => getNextSort(current, key));
  if (view === 'list') {
    return <div>
        <Sidebar />

        <SellerPageShell>
          <div className="border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">Collections</h2>
                <p className="mt-3 text-sm leading-7 text-neutral-600">Create curated product groups with ordered items.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={openCreateCollection}>
                  <Plus size={15} />
                  Add Collection
                </Button>
              </div>
            </div>

            <div aria-label="Collection summary" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Total Collections</span>
                    <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{collectionStats.total}</strong>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Folder size={14} /></div>
                </div>
              </div>
              <div className="border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Active</span>
                    <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{collectionStats.active}</strong>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Check size={14} /></div>
                </div>
              </div>
              <div className="border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Inactive</span>
                    <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{collectionStats.inactive}</strong>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><X size={14} /></div>
                </div>
              </div>
              <div className="border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Linked Products</span>
                    <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{collectionStats.linkedProducts}</strong>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Sparkles size={14} /></div>
                </div>
              </div>
            </div>
          </div>

          <SellerTableSurface>
            {message && <DismissibleAlert onClose={() => setMessage('')}>
                {message}
              </DismissibleAlert>}

            <SellerToolbar search={<SellerSearchField className="xl:max-w-[560px]" icon={Search} value={listSearch} onChange={event => setListSearch(event.target.value)} placeholder="Search collections..." />} actions={<SellerToolbarActions>
                  <div className="flex w-full flex-wrap items-center gap-3 xl:w-auto xl:justify-end">
                    <div className="relative">
                      <Button variant="outline" type="button" onClick={() => {
                setShowColumnMenu(current => !current);
                setShowFilters(false);
              }}>
                      <Columns3 size={15} />
                      Manage Columns
                    </Button>

                    {showColumnMenu && <SellerFloatingPanel className="absolute left-0 top-[calc(100%+0.75rem)] z-20 w-64">
                        {Object.entries({
                  type: 'Type',
                  products: 'Products',
                  preview: 'Preview',
                  status: 'Status'
                }).map(([key, label]) => <SellerCheckboxOption key={key} checked={visibleColumns[key]} onChange={event => setVisibleColumns(current => ({
                  ...current,
                  [key]: event.target.checked
                }))} label={label} />)}
                      </SellerFloatingPanel>}
                    </div>

                    <div className="relative">
                      <Button variant={activeCollectionFilterCount > 0 ? 'primary' : 'outline'} type="button" onClick={() => {
                setShowFilters(current => !current);
                setShowColumnMenu(false);
              }}>
                      <ListFilter size={15} />
                      Filters
                      {activeCollectionFilterCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center border border-neutral-950 bg-neutral-950 px-1 text-[10px] font-semibold text-white">
                          {activeCollectionFilterCount}
                        </span>}
                    </Button>
                    </div>
                  </div>

                  {activeCollectionFilterCount > 0 && <Button variant="outline" type="button" onClick={clearCollectionFilters}>
                      Clear
                    </Button>}
                </SellerToolbarActions>} />

            <SellerTableWrap className="hidden xl:block">
              <SellerGridHead style={{
              gridTemplateColumns: collectionColumnTemplate
            }}>
                <SellerGridCell>
                  <input type="checkbox" checked={allVisibleCollectionsSelected} ref={input => {
                  if (input) input.indeterminate = !allVisibleCollectionsSelected && someVisibleCollectionsSelected;
                }} onChange={event => {
                  setSelectedCollectionIds(current => event.target.checked ? Array.from(new Set([...current, ...paginatedCollectionIds])) : current.filter(id => !paginatedCollectionIds.includes(id)));
                }} aria-label="Select all collections" className="h-4 w-4 accent-neutral-950" />
                </SellerGridCell>
                <SellerGridCell>#</SellerGridCell>
                {renderCollectionSortHeader('title', 'Collection', 'justify-start')}
                {visibleColumns.type && renderCollectionSortHeader('type', 'Type', 'justify-center')}
                {visibleColumns.products && renderCollectionSortHeader('products', 'Products', 'justify-center')}
                {visibleColumns.preview && <SellerGridCell className="text-center">Preview</SellerGridCell>}
                {visibleColumns.status && renderCollectionSortHeader('status', 'Status', 'justify-center')}
                <SellerGridCell className="text-center">Actions</SellerGridCell>
              </SellerGridHead>

              <SellerGridBody>
                {paginatedCollections.length ? paginatedCollections.map((collection, index) => {
                const productCount = Array.isArray(collection.product_ids) ? collection.product_ids.length : 0;
                return <SellerGridRow key={collection.id} style={{
                  gridTemplateColumns: collectionColumnTemplate
                }}>
                      <SellerGridCell>
                        <input type="checkbox" checked={selectedCollectionIds.includes(collection.id)} onChange={() => toggleCollectionSelection(collection.id)} aria-label={`Select ${collection.title}`} className="h-4 w-4 accent-neutral-950" />
                      </SellerGridCell>
                      <SellerGridCell className="text-sm font-medium text-neutral-500">{(currentPage - 1) * collectionsPerPage + index + 1}</SellerGridCell>
                      <SellerGridCell className="flex items-center gap-3">
                        {collection.image ? <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-100">
                            <img className="h-full w-full object-cover" src={collection.image} alt="" />
                          </span> : <SellerAvatar>{collectionInitial(collection.title)}</SellerAvatar>}
                        <div className="min-w-0">
                          <strong className="block truncate text-sm font-semibold text-neutral-950">{collection.title || 'Untitled collection'}</strong>
                          <span className="mt-1 block truncate text-xs text-neutral-500">/{collection.handle || slugify(collection.title)}</span>
                        </div>
                      </SellerGridCell>
                      {visibleColumns.type && <SellerGridCell className="flex justify-center">
                          <SellerPill tone="neutral">{collection.type || 'manual'}</SellerPill>
                        </SellerGridCell>}
                      {visibleColumns.products && <SellerGridCell className="text-center text-sm text-neutral-700">{productCount}</SellerGridCell>}
                      {visibleColumns.preview && <SellerGridCell className="text-center text-sm text-neutral-700">
                          <span>
                            {productCount ? `${productCount} products assigned` : 'No products assigned'}
                          </span>
                        </SellerGridCell>}
                      {visibleColumns.status && <SellerGridCell className="flex justify-center">
                          <SellerPill tone={collection.active ? 'success' : 'danger'}>
                            {collection.active ? 'Active' : 'Inactive'}
                          </SellerPill>
                        </SellerGridCell>}
                      <SellerGridCell>
                        <div className="flex justify-center">
                          <div className="flex w-full max-w-[7.75rem] items-center justify-center gap-2">
                            <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedCollectionDetail(collection)} aria-label={`View ${collection.title}`} title="View">
                              <Search size={14} />
                            </button>
                            <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => openEditCollection(collection)} aria-label={`Edit ${collection.title}`} title="Edit">
                              <Edit3 size={14} />
                            </button>
                            <button className="inline-flex h-9 w-9 items-center justify-center border border-rose-500 bg-white text-rose-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-white disabled:text-rose-300" type="button" onClick={() => deleteCollection(collection.id)} disabled={deletingId === collection.id} aria-label={`Delete ${collection.title}`} title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </SellerGridCell>
                    </SellerGridRow>;
              }) : <SellerEmptyState title="No collections found" description="Create a manual or smart collection to start grouping products." action={<Button variant="primary" onClick={openCreateCollection}>
                        <Plus size={15} />
                        Add Collection
                      </Button>} />}
              </SellerGridBody>
            </SellerTableWrap>

            <div className="space-y-4 border-t border-neutral-200 p-4 xl:hidden">
              {paginatedCollections.map(collection => {
              const productCount = Array.isArray(collection.product_ids) ? collection.product_ids.length : 0;
              return <article key={`mobile-${collection.id}`} className="border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <strong className="block truncate text-base font-semibold text-neutral-950">{collection.title || 'Untitled collection'}</strong>
                        <span className="mt-1 block truncate text-xs text-neutral-500">/{collection.handle || slugify(collection.title)}</span>
                      </div>
                      <SellerPill tone={collection.active ? 'success' : 'danger'}>
                        {collection.active ? 'Active' : 'Inactive'}
                      </SellerPill>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Type</span>
                        <strong className="mt-2 block text-sm font-semibold text-neutral-950">{collection.type || 'manual'}</strong>
                      </div>
                      <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Products</span>
                        <strong className="mt-2 block text-sm font-semibold text-neutral-950">{productCount}</strong>
                      </div>
                      <div className="border border-neutral-200 bg-neutral-50 px-3 py-3 sm:col-span-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Preview</span>
                        <strong className="mt-2 block text-sm font-semibold text-neutral-950">{productCount ? `${productCount} products assigned` : 'No products assigned'}</strong>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button type="button" variant="outline" onClick={() => setSelectedCollectionDetail(collection)}>
                        View
                      </Button>
                      <Button type="button" variant="primary" onClick={() => openEditCollection(collection)}>
                        Edit
                      </Button>
                    </div>
                  </article>;
            })}
            </div>

          </SellerTableSurface>

          <SellerPaginationCard>
            <SellerTablePaginationBar showBorder={false} className="bg-transparent px-0 pb-0 pt-0" summary={`Showing ${visibleCollections.length ? (currentPage - 1) * collectionsPerPage + 1 : 0} to ${Math.min(currentPage * collectionsPerPage, visibleCollections.length)} of ${visibleCollections.length} results`} currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} onPageChange={setCurrentPage} perPage={collectionsPerPage} perPageOptions={[10, 50, 100, 1000]} onPerPageChange={event => {
            setCollectionsPerPage(Number(event.target.value));
            setCurrentPage(1);
          }} />
          </SellerPaginationCard>

          {selectedCollectionCount > 0 && <div className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-semibold text-neutral-950">{selectedCollectionCount} item{selectedCollectionCount === 1 ? '' : 's'} selected</span>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => bulkSetCollectionStatus(true)}>Activate</Button>
                <Button type="button" variant="outline" onClick={() => bulkSetCollectionStatus(false)}>Deactivate</Button>
                <Button type="button" variant="outline" onClick={bulkDeleteCollections}>Delete</Button>
                <Button type="button" variant="outline" onClick={() => setSelectedCollectionIds([])}>Clear</Button>
              </div>
            </div>}
        </SellerPageShell>

        {showFilters && <SellerModalBackdrop onClose={() => setShowFilters(false)}>
            <SellerModalCard className="max-w-xl bg-white" onMouseDown={event => event.stopPropagation()}>
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                  <div className="space-y-2">
                    <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Collection Filters</span>
                    <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Filter Collections</h3>
                    <p className="text-sm leading-6 text-neutral-500">Filter collections by publishing status and collection type.</p>
                  </div>
                  <SellerIconButton onClick={() => setShowFilters(false)} aria-label="Close filters">
                    <X size={16} />
                  </SellerIconButton>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</label>
                    <SellerSelect value={collectionFilters.status} onChange={event => setCollectionFilters(current => ({
                ...current,
                status: event.target.value
              }))} className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950 shadow-none">
                      <option value="all">All statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </SellerSelect>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Type</label>
                    <SellerSelect value={collectionFilters.type} onChange={event => setCollectionFilters(current => ({
                ...current,
                type: event.target.value
              }))} className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950 shadow-none">
                      <option value="all">All types</option>
                      <option value="manual">Manual</option>
                      <option value="smart">Smart</option>
                    </SellerSelect>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 pt-4">
                  <Button variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={clearCollectionFilters}>Clear</Button>
                  <Button variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => setShowFilters(false)}>Apply Filters</Button>
                </div>
              </div>
            </SellerModalCard>
          </SellerModalBackdrop>}

        {selectedCollectionDetail && <SellerModalBackdrop onClose={() => setSelectedCollectionDetail(null)}>
            <SellerModalCard className="hidden max-w-2xl bg-white lg:block" onMouseDown={event => event.stopPropagation()}>
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                  <div className="space-y-2">
                    <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Collection Preview</span>
                    <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{selectedCollectionDetail.title || 'Untitled collection'}</h3>
                    <p className="text-sm leading-6 text-neutral-500">/{selectedCollectionDetail.handle || slugify(selectedCollectionDetail.title)}</p>
                  </div>
                  <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedCollectionDetail(null)} aria-label="Close collection preview">
                    <X size={16} />
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-4 border border-neutral-200 bg-neutral-50 px-4 py-4">
                    {selectedCollectionDetail.image ? <span className="inline-flex h-14 w-14 items-center justify-center overflow-hidden border border-neutral-200 bg-white">
                        <img src={selectedCollectionDetail.image} alt="" className="h-full w-full object-cover" />
                      </span> : <SellerAvatar className="h-14 w-14">{collectionInitial(selectedCollectionDetail.title)}</SellerAvatar>}
                    <div className="min-w-0">
                      <strong className="block truncate text-base font-semibold text-neutral-950">{selectedCollectionDetail.type || 'manual'}</strong>
                      <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Collection type</span>
                    </div>
                  </div>

                  <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                    <strong className="block text-base font-semibold text-neutral-950">{selectedCollectionDetail.active ? 'Active' : 'Inactive'}</strong>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                  </div>

                  <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                    <strong className="block text-base font-semibold text-neutral-950">{Array.isArray(selectedCollectionDetail.product_ids) ? selectedCollectionDetail.product_ids.length : 0}</strong>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Products</span>
                  </div>

                  <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                    <strong className="block truncate text-base font-semibold text-neutral-950">{Array.isArray(selectedCollectionDetail.channels) && selectedCollectionDetail.channels.length ? selectedCollectionDetail.channels.join(', ') : '-'}</strong>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Channels</span>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="border border-neutral-200 bg-white px-4 py-4">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Description</span>
                    <p className="mt-2 text-sm leading-6 text-neutral-700">{selectedCollectionDetail.description || 'No description added yet.'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
                  <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => {
                openEditCollection(selectedCollectionDetail);
                setSelectedCollectionDetail(null);
              }}>
                    Edit Collection
                  </Button>
                </div>
              </div>
            </SellerModalCard>
          </SellerModalBackdrop>}

        <div className="lg:hidden">
          <SellerMobileDetailSheet open={Boolean(selectedCollectionDetail)} title={selectedCollectionDetail?.title || ''} subtitle={selectedCollectionDetail ? `/${selectedCollectionDetail.handle || slugify(selectedCollectionDetail.title)}` : ''} onClose={() => setSelectedCollectionDetail(null)} items={selectedCollectionDetail ? [{
        label: 'Type',
        value: selectedCollectionDetail.type || 'manual'
      }, {
        label: 'Status',
        value: selectedCollectionDetail.active ? 'Active' : 'Inactive'
      }, {
        label: 'Products',
        value: String(Array.isArray(selectedCollectionDetail.product_ids) ? selectedCollectionDetail.product_ids.length : 0)
      }, {
        label: 'Channels',
        value: Array.isArray(selectedCollectionDetail.channels) ? selectedCollectionDetail.channels.join(', ') : '-'
      }, {
        label: 'Description',
        value: selectedCollectionDetail.description || '-'
      }] : []} actions={selectedCollectionDetail ? <Button type="button" variant="primary" onClick={() => {
        openEditCollection(selectedCollectionDetail);
        setSelectedCollectionDetail(null);
      }}>
              Edit Collection
            </Button> : null} />
        </div>
      </div>;
  }
  return <div>
      <Sidebar />

      <SellerPageShell>
        <SellerPageHeader title={formHeading} description={formDescription} action={<div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={closeForm}>
                <X size={15} />
                Cancel
              </Button>
              <Button variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={saveCollection} disabled={saving}>
                <Check size={15} />
                {saving ? 'Saving...' : 'Save Collection'}
              </Button>
            </div>} />

        {message && <DismissibleAlert onClose={() => setMessage('')}>
            {message}
          </DismissibleAlert>}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_340px]">
          <div className="space-y-5">
            <SellerCard>
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                  <div className="space-y-2">
                    <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Basics</span>
                    <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Collection details</h2>
                    <p className="text-sm leading-6 text-neutral-500">Set the collection name, handle, and a rich description for the storefront and merchandising team.</p>
                  </div>

                  <label className="flex min-w-[180px] items-center justify-between gap-4 border border-neutral-200 bg-neutral-50 px-4 py-3">
                    <span className="space-y-1">
                      <strong className="block text-sm font-semibold text-neutral-950">Active</strong>
                      <small className="block text-xs leading-5 text-neutral-500">Control whether this collection is visible to connected surfaces.</small>
                    </span>
                    <input type="checkbox" checked={form.active} onChange={event => setField('active', event.target.checked)} className="h-4 w-4 accent-neutral-950" />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Title *" labelClassName={collectionLabelClassName} inputClassName={collectionInputClassName} value={form.title} onChange={event => updateTitle(event.target.value)} />
                  <Input label="Handle" value={form.handle} onChange={event => {
                setHandleEdited(true);
                setField('handle', slugify(event.target.value));
              }} labelClassName={collectionLabelClassName} inputClassName={collectionInputClassName} />
                </div>

                <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">Generated automatically from the collection title until you edit it.</p>
                <SellerTextarea className="min-h-[140px] rounded-none border border-neutral-200 px-4 py-3 text-sm text-neutral-950" value={form.description} onChange={event => setField('description', event.target.value)} placeholder="Write a customer-friendly description for this collection." />
              </div>
            </SellerCard>

            <SellerCard>
              <div className="space-y-5">
                <div className="space-y-2 border-b border-neutral-200 pb-4">
                  <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Collection type</h2>
                  <p className="text-sm leading-6 text-neutral-500">Choose whether merchandisers manually pick products or rules decide automatically like a smart collection.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <CollectionTypeCard active={form.type === 'manual'} icon={Folder} title="Manual" description="Hand-pick products and control their order yourself." onClick={() => setField('type', 'manual')} />
                  <CollectionTypeCard active={form.type === 'smart'} icon={Sparkles} title="Smart" description="Build automated rules so matching products flow in dynamically." onClick={() => setField('type', 'smart')} />
                </div>
              </div>
            </SellerCard>

            {form.type === 'smart' ? <SellerCard>
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Conditions</h2>
                      <p className="text-sm leading-6 text-neutral-500">Set the rules products must match. This behaves like Shopify smart collection logic.</p>
                    </div>
                    <Button variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={addCondition}>
                      <Plus size={15} />
                      Add condition
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" className={`min-h-11 border px-4 text-sm font-medium transition ${form.conditionMode === 'all' ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100'}`} onClick={() => setField('conditionMode', 'all')}>
                    All conditions
                  </button>
                    <button type="button" className={`min-h-11 border px-4 text-sm font-medium transition ${form.conditionMode === 'any' ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100'}`} onClick={() => setField('conditionMode', 'any')}>
                    Any condition
                  </button>
                  </div>

                  <div className="space-y-3">
                    <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_64px] gap-3 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 md:grid">
                      <span>Product field</span>
                      <span>Operator</span>
                      <span>Value</span>
                      <span>Actions</span>
                    </div>

                    {conditions.map(condition => <div key={condition.id} className="grid gap-3 border border-neutral-200 bg-white p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_64px] md:items-end">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 md:hidden">Product field</label>
                          <SellerSelect value={condition.field} onChange={event => updateCondition(condition.id, 'field', event.target.value)} className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950">
                          {conditionFieldOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </SellerSelect>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 md:hidden">Operator</label>
                          <SellerSelect value={condition.operator} onChange={event => updateCondition(condition.id, 'operator', event.target.value)} className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950">
                          {conditionOperatorOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </SellerSelect>
                        </div>
                        <Input label="Value" labelClassName={collectionLabelClassName} inputClassName={collectionInputClassName} value={condition.value} onChange={event => updateCondition(condition.id, 'value', event.target.value)} placeholder="e.g. summer" />
                        <SellerIconButton danger onClick={() => removeCondition(condition.id)} aria-label="Remove condition" className="h-11 w-11 rounded-none border border-rose-500 bg-white text-rose-600">
                          <Trash2 size={15} />
                        </SellerIconButton>
                      </div>)}
                  </div>
                </div>
              </SellerCard> : <>
                <SellerCard>
                  <div className="space-y-5">
                    <div className="space-y-2 border-b border-neutral-200 pb-4">
                      <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Products</h2>
                      <p className="text-sm leading-6 text-neutral-500">Search catalog items, add them to the collection, and control the exact order shoppers will see.</p>
                    </div>

                    <SellerSearchField icon={Search} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search products by name, code, or SKU" className="w-full" />

                    <div className="grid gap-3">
                      {selectedProductIds.length === 0 && !search.trim() ? <div className="border border-dashed border-neutral-950 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">No products added yet.</div> : search.trim() && filteredProducts.length === 0 ? <div className="border border-dashed border-neutral-950 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">No matching products.</div> : search.trim() ? filteredProducts.map(product => <ProductOptionRow key={product.id} product={product} checked={selectedProductIds.includes(product.id)} onChange={() => toggleProduct(product.id)} />) : selectedProducts.map(product => <ProductOptionRow key={product.id} product={product} checked={selectedProductIds.includes(product.id)} onChange={() => toggleProduct(product.id)} />)}
                    </div>
                  </div>
                </SellerCard>

                <SellerCard>
                  <div className="space-y-5">
                    <div className="space-y-2 border-b border-neutral-200 pb-4">
                      <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Selected products</h2>
                      <p className="text-sm leading-6 text-neutral-500">Review the products already linked to this collection.</p>
                    </div>

                    <div className="grid gap-3">
                      {selectedProducts.length === 0 ? <div className="border border-dashed border-neutral-950 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">Products you add will appear here.</div> : selectedProducts.map((product, index) => <div key={product.id} className="flex flex-wrap items-center gap-3 border border-neutral-200 bg-white px-4 py-3">
                            <span className="inline-flex h-8 w-8 items-center justify-center border border-neutral-200 bg-neutral-950 text-xs font-semibold text-white">{index + 1}</span>
                            <div className="min-w-0 flex-1">
                              <strong className="block truncate text-sm font-semibold text-neutral-950">
                              {product.name || 'Untitled product'}{product.mystore_product_id ? ` (${product.mystore_product_id})` : ''}
                              </strong>
                              <small className="mt-1 block truncate text-xs text-neutral-500">{product.sku || product.mystore_product_id || `#${product.id}`}</small>
                            </div>
                            <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-3" onClick={() => toggleProduct(product.id)}>
                            <Trash2 size={15} />
                            Remove
                          </Button>
                        </div>)}
                    </div>
                  </div>
                </SellerCard>

                <SellerCard>
                  <div className="space-y-5">
                    <div className="space-y-2 border-b border-neutral-200 pb-4">
                      <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Search engine listing</h2>
                      <p className="text-sm leading-6 text-neutral-500">Control the SEO title and meta description shared with connected storefronts and search results.</p>
                    </div>

                    <div className="grid gap-4">
                      <Input label="SEO meta title" labelClassName={collectionLabelClassName} inputClassName={collectionInputClassName} value={form.seoTitle} onChange={event => setField('seoTitle', event.target.value)} placeholder="Shop the latest summer essentials" />
                      <Input label="SEO description" as="textarea" rows={5} labelClassName={collectionLabelClassName} inputClassName={collectionTextareaInputClassName} value={form.seoDescription} onChange={event => setField('seoDescription', event.target.value)} placeholder="Describe what makes this collection valuable for customers and search engines." />
                    </div>
                  </div>
                </SellerCard>
              </>}
          </div>

          <aside className="space-y-5">
            <SellerCard>
              <div className="space-y-5">
                <div className="space-y-2 border-b border-neutral-200 pb-4">
                  <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Collection image</h2>
                  <p className="text-sm leading-6 text-neutral-500">Add a strong visual to represent this collection on catalog pages and channels.</p>
                </div>

                <button type="button" className="flex min-h-[260px] w-full items-center justify-center overflow-hidden border border-dashed border-neutral-950 bg-neutral-50 transition hover:bg-neutral-100" onClick={() => imageInputRef.current?.click()}>
                  {form.image ? <img src={form.image} alt="" className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-4 px-6 text-center">
                      <span className="inline-flex h-14 w-14 items-center justify-center border border-neutral-200 bg-white">
                      <ImageIcon size={30} />
                    </span>
                      <span className="text-sm font-medium text-neutral-700">Click to upload a collection image</span>
                  </span>}
                </button>

                <input ref={imageInputRef} type="file" accept="image/*" onChange={event => uploadImage(event.target.files?.[0])} className="hidden" />

                <p className="text-sm leading-6 text-neutral-500">{imageUploading ? 'Uploading image...' : 'Click, drag and drop, or paste to add a collection image.'}</p>

                <div className={`flex gap-3 ${form.image ? 'flex-nowrap' : 'flex-wrap'}`}>
                  <Button variant="outline" className="rounded-none border border-neutral-200 px-4 whitespace-nowrap" onClick={() => imageInputRef.current?.click()}>
                    <Upload size={14} />
                    {form.image ? 'Replace Image' : 'Add Image'}
                  </Button>
                  {form.image && <Button variant="outline" className="rounded-none border border-neutral-200 px-4 whitespace-nowrap" onClick={clearCollectionImage}>
                      <X size={14} />
                      Remove Image
                    </Button>}
                </div>
              </div>
            </SellerCard>
          </aside>
        </div>
      </SellerPageShell>
    </div>;
};
export default SellerCollections;
