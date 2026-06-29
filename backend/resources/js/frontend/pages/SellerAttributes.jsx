import React, { useEffect, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Boxes, Check, CheckCircle2, Columns3, Edit2, ListFilter, Plus, Search, Tag, Trash2, Wrench, X } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { AttributeDrawer } from '../components/AttributeDrawer';
import { SellerMobileDetailSheet } from '../components/SellerMobileDetailSheet';
import { SellerAvatar, SellerCheckboxOption, SellerEmptyState, SellerFloatingPanel, SellerGridBody, SellerGridCell, SellerGridHead, SellerGridRow, SellerModalBackdrop, SellerModalCard, SellerPageShell, SellerPaginationCard, SellerPill, SellerSearchField, SellerSelect, SellerSortHeader, SellerTablePaginationBar, SellerTableSurface, SellerTableWrap, SellerToolbar, SellerToolbarActions } from '../components/seller-workspace';
import { getNextSort, sortRows } from '../utils/tableSorting';
const initialsFor = value => {
  const parts = String(value || 'A').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
};
const appliesToFor = attribute => attribute.applies_to ? String(attribute.applies_to).replace(/\b\w/g, letter => letter.toUpperCase()) : /service|setup|installation|support|package|level/i.test(attribute.name || '') ? 'Service' : 'Product';
const typeFor = attribute => {
  if (attribute.input_type) {
    return String(attribute.input_type).replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  }
  const options = attribute.options || [];
  if (options.length === 0) return 'Free Text';
  return options.every(option => /\d/.test(String(option))) ? 'Number' : 'Select';
};
const buildPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({
    length: total
  }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
};
export const SellerAttributes = ({
  initialOpen = false
}) => {
  const {
    props
  } = usePage();
  const attributes = props.attributes || [];
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(initialOpen);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [attributeFilter, setAttributeFilter] = useState({
    appliesTo: 'all',
    type: 'all'
  });
  const [showColumns, setShowColumns] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [attributesPerPage, setAttributesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState({
    key: 'name',
    direction: 'asc'
  });
  const [selectedAttributeDetail, setSelectedAttributeDetail] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    appliesTo: true,
    type: true,
    values: true,
    required: true,
    status: true
  });
  const enrichedAttributes = useMemo(() => attributes.map(attribute => ({
    ...attribute,
    appliesTo: appliesToFor(attribute),
    displayType: typeFor(attribute)
  })), [attributes]);
  const filteredAttributes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return enrichedAttributes.filter(attribute => {
      const matchesSearch = !query || [attribute.name, attribute.appliesTo, attribute.displayType, ...(attribute.options || [])].join(' ').toLowerCase().includes(query);
      const matchesAppliesTo = attributeFilter.appliesTo === 'all' || attribute.appliesTo.toLowerCase() === attributeFilter.appliesTo || attributeFilter.appliesTo === 'product' && attribute.appliesTo.toLowerCase() === 'both' || attributeFilter.appliesTo === 'service' && attribute.appliesTo.toLowerCase() === 'both' || attributeFilter.appliesTo === 'both' && attribute.appliesTo.toLowerCase() === 'both';
      const matchesType = attributeFilter.type === 'all' || attribute.displayType.toLowerCase().replace(/\s+/g, '_') === attributeFilter.type;
      return matchesSearch && matchesAppliesTo && matchesType;
    });
  }, [attributeFilter.appliesTo, attributeFilter.type, enrichedAttributes, search]);
  useEffect(() => {
    const totalPagesCount = Math.max(1, Math.ceil(filteredAttributes.length / attributesPerPage));
    setCurrentPage(current => Math.min(current, totalPagesCount));
  }, [attributesPerPage, filteredAttributes.length]);
  const sortedAttributes = useMemo(() => sortRows(filteredAttributes, sort, {
    name: attribute => attribute.name,
    appliesTo: attribute => attribute.appliesTo,
    type: attribute => attribute.displayType,
    values: attribute => (attribute.options || []).join(', '),
    required: attribute => attribute.is_required ? 1 : 0,
    status: attribute => attribute.is_active === false ? 'inactive' : 'active'
  }), [filteredAttributes, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedAttributes.length / attributesPerPage));
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const paginatedAttributes = useMemo(() => {
    const start = (currentPage - 1) * attributesPerPage;
    return sortedAttributes.slice(start, start + attributesPerPage);
  }, [attributesPerPage, currentPage, sortedAttributes]);
  const optionCount = attributes.reduce((total, attribute) => total + (attribute.options?.length || 0), 0);
  const productAttributeCount = enrichedAttributes.filter(attribute => ['Product', 'Both'].includes(attribute.appliesTo)).length;
  const serviceAttributeCount = enrichedAttributes.filter(attribute => ['Service', 'Both'].includes(attribute.appliesTo)).length;
  const activeCount = enrichedAttributes.filter(attribute => attribute.is_active !== false).length;
  const activeFilterCount = Object.values(attributeFilter).filter(value => value !== 'all').length;
  const columnTemplate = ['42px', 'minmax(300px, 1.55fr)', visibleColumns.appliesTo ? '140px' : null, visibleColumns.type ? '140px' : null, visibleColumns.values ? 'minmax(260px, 1.4fr)' : null, visibleColumns.required ? '110px' : null, visibleColumns.status ? '118px' : null, '118px'].filter(Boolean).join(' ');
  const renderAttributeSortHeader = (key, label, className) => <SellerSortHeader active={sort.key === key} direction={sort.direction} className={`gap-1 ${className || ''}`} onClick={() => updateSort(key)}>
      {label}
    </SellerSortHeader>;
  const openCreate = () => {
    setEditingAttribute(null);
    setDrawerOpen(true);
  };
  const openEdit = attribute => {
    setEditingAttribute(attribute);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingAttribute(null);
  };
  const deleteAttribute = attribute => {
    if (!window.confirm(`Delete ${attribute.name}?`)) return;
    router.delete(`/seller/attributes/${attribute.id}`, {
      preserveScroll: true,
      preserveState: true,
      only: ['attributes', 'flash']
    });
  };
  const clearFilters = () => {
    setAttributeFilter({
      appliesTo: 'all',
      type: 'all'
    });
  };
  const updateSort = key => setSort(current => getNextSort(current, key));
  return <div>
      <Sidebar />

      <SellerPageShell>
        <div className="border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">Variants / Attributes</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">Model item options such as size, color, material, service level, and custom attributes.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={openCreate}>
                <Plus size={15} />
                Add Attribute
              </Button>
            </div>
          </div>

          <div aria-label="Attribute summary" className="mt-6 grid gap-4 xl:grid-cols-5">
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Total Attributes</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{attributes.length}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Tag size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Active</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{activeCount}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><CheckCircle2 size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Product Attributes</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{productAttributeCount}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Boxes size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Service Attributes</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{serviceAttributeCount}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Wrench size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Option Values</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{optionCount}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Boxes size={14} /></div>
              </div>
            </div>
          </div>
        </div>

        <SellerTableSurface>
          <SellerToolbar search={<SellerSearchField className="xl:max-w-[560px]" icon={Search} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search attributes..." />} actions={<SellerToolbarActions>
                <div className="flex w-full flex-wrap items-center gap-3 xl:w-auto xl:justify-end">
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
                appliesTo: 'Applies To',
                type: 'Type',
                values: 'Values',
                required: 'Required',
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

                {activeFilterCount > 0 && <button className="inline-flex min-h-10 items-center justify-center border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={clearFilters}>
                    Clear
                  </button>}
              </SellerToolbarActions>} />

          <SellerTableWrap className="hidden xl:block">
            <SellerGridHead style={{
            gridTemplateColumns: columnTemplate
          }}>
              <SellerGridCell>#</SellerGridCell>
              {renderAttributeSortHeader('name', 'Attribute', 'justify-start')}
              {visibleColumns.appliesTo && renderAttributeSortHeader('appliesTo', 'Applies To', 'justify-center')}
              {visibleColumns.type && renderAttributeSortHeader('type', 'Type', 'justify-center')}
              {visibleColumns.values && renderAttributeSortHeader('values', 'Values', 'justify-start')}
              {visibleColumns.required && renderAttributeSortHeader('required', 'Required', 'justify-center')}
              {visibleColumns.status && renderAttributeSortHeader('status', 'Status', 'justify-center')}
              <SellerGridCell className="text-center">Actions</SellerGridCell>
            </SellerGridHead>

            <SellerGridBody>
              {paginatedAttributes.length === 0 ? <SellerEmptyState title="No attributes found" description="Create attributes to power variable product options." action={<Button variant="primary" onClick={openCreate}>
                      <Plus size={16} />
                      Add Attribute
                    </Button>} /> : paginatedAttributes.map((attribute, index) => <SellerGridRow key={attribute.id} style={{
                  gridTemplateColumns: columnTemplate
                }}>
                  <SellerGridCell className="text-sm font-medium text-neutral-500">
                    {(currentPage - 1) * attributesPerPage + index + 1}
                  </SellerGridCell>

                  <SellerGridCell className="flex items-center gap-3">
                    <SellerAvatar>{initialsFor(attribute.name)}</SellerAvatar>
                    <div className="min-w-0">
                      <strong className="block truncate text-sm font-semibold text-neutral-950">{attribute.name}</strong>
                      <small className="mt-1 block truncate text-xs text-neutral-500">
                        {String(attribute.name || '').toLowerCase().replace(/\s+/g, '_')}
                      </small>
                    </div>
                  </SellerGridCell>

                  {visibleColumns.appliesTo && <SellerGridCell className="flex justify-center">
                      <SellerPill tone={attribute.appliesTo === 'Service' ? 'info' : 'success'}>
                        {attribute.appliesTo}
                      </SellerPill>
                    </SellerGridCell>}

                  {visibleColumns.type && <SellerGridCell className="text-center text-sm text-neutral-700">{attribute.displayType}</SellerGridCell>}

                  {visibleColumns.values && <SellerGridCell className="flex flex-wrap gap-2">
                      {(attribute.options || []).length === 0 ? <span className="text-sm text-neutral-700">-</span> : attribute.options.map(option => <SellerPill key={option}>
                            {option}
                          </SellerPill>)}
                    </SellerGridCell>}

                  {visibleColumns.required && <SellerGridCell className="text-center text-sm text-neutral-700">{attribute.is_required ? 'Yes' : 'No'}</SellerGridCell>}

                  {visibleColumns.status && <SellerGridCell className="flex justify-center">
                      <SellerPill tone={attribute.is_active === false ? 'danger' : 'success'}>
                        {attribute.is_active === false ? 'Inactive' : 'Active'}
                      </SellerPill>
                    </SellerGridCell>}

                  <SellerGridCell>
                    <div className="flex justify-center">
                      <div className="flex w-full max-w-[7.75rem] items-center justify-center gap-2">
                        <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedAttributeDetail(attribute)} aria-label={`View ${attribute.name}`} title="View">
                          <Search size={14} />
                        </button>
                        <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => openEdit(attribute)} aria-label={`Edit ${attribute.name}`} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="inline-flex h-9 w-9 items-center justify-center border border-rose-500 bg-white text-rose-600 transition hover:bg-neutral-100" type="button" onClick={() => deleteAttribute(attribute)} aria-label={`Delete ${attribute.name}`} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </SellerGridCell>
                </SellerGridRow>)}
            </SellerGridBody>
          </SellerTableWrap>

          <div className="space-y-4 border-t border-neutral-200 p-4 xl:hidden">
            <div className="space-y-4">
              {paginatedAttributes.map(attribute => <article key={`mobile-${attribute.id}`} className="border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-base font-semibold text-neutral-950">{attribute.name}</strong>
                      <span className="mt-1 block truncate text-xs text-neutral-500">{String(attribute.name || '').toLowerCase().replace(/\s+/g, '_')}</span>
                    </div>
                    <SellerPill tone={attribute.is_active === false ? 'danger' : 'success'}>
                      {attribute.is_active === false ? 'Inactive' : 'Active'}
                    </SellerPill>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Applies To</span>
                      <strong className="mt-2 block text-sm font-semibold text-neutral-950">{attribute.appliesTo}</strong>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Type</span>
                      <strong className="mt-2 block text-sm font-semibold text-neutral-950">{attribute.displayType}</strong>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Required</span>
                      <strong className="mt-2 block text-sm font-semibold text-neutral-950">{attribute.is_required ? 'Yes' : 'No'}</strong>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Values</span>
                      <strong className="mt-2 block text-sm font-semibold text-neutral-950">{(attribute.options || []).length}</strong>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={() => setSelectedAttributeDetail(attribute)}>View</Button>
                    <Button type="button" variant="primary" onClick={() => openEdit(attribute)}>Edit</Button>
                  </div>
                </article>)}
            </div>
          </div>

        </SellerTableSurface>

        <SellerPaginationCard>
          <SellerTablePaginationBar showBorder={false} className="bg-transparent px-0 pb-0 pt-0" summary={`Showing ${filteredAttributes.length ? (currentPage - 1) * attributesPerPage + 1 : 0} to ${Math.min(currentPage * attributesPerPage, filteredAttributes.length)} of ${filteredAttributes.length} results`} currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} onPageChange={setCurrentPage} perPage={attributesPerPage} onPerPageChange={event => {
          setAttributesPerPage(Number(event.target.value));
          setCurrentPage(1);
        }} />
        </SellerPaginationCard>
      </SellerPageShell>

      {showFilters && <SellerModalBackdrop onClose={() => setShowFilters(false)}>
          <SellerModalCard className="max-w-xl bg-white" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Attribute Filters</span>
                  <div className="flex items-center gap-2">
                    <ListFilter size={18} className="text-neutral-950" />
                    <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Filter Attributes</h3>
                  </div>
                  <p className="text-sm leading-6 text-neutral-500">Refine the attribute list by scope and field type.</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setShowFilters(false)} aria-label="Close attribute filters">
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Applies To</span>
                  <SellerSelect value={attributeFilter.appliesTo} onChange={event => setAttributeFilter(current => ({
              ...current,
              appliesTo: event.target.value
            }))} className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950 shadow-none">
                    <option value="all">All Scope</option>
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                    <option value="both">Both</option>
                  </SellerSelect>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Type</span>
                  <SellerSelect value={attributeFilter.type} onChange={event => setAttributeFilter(current => ({
              ...current,
              type: event.target.value
            }))} className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950 shadow-none">
                    <option value="all">All Types</option>
                    <option value="select">Select</option>
                    <option value="number">Number</option>
                    <option value="free_text">Free Text</option>
                  </SellerSelect>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 pt-4">
                <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={clearFilters}>
                  Clear
                </Button>
                <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => setShowFilters(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}

      {selectedAttributeDetail && <SellerModalBackdrop onClose={() => setSelectedAttributeDetail(null)}>
          <SellerModalCard className="hidden max-w-2xl bg-white lg:block" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Attribute Preview</span>
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{selectedAttributeDetail.name || 'Untitled attribute'}</h3>
                  <p className="text-sm leading-6 text-neutral-500">{String(selectedAttributeDetail.name || '').toLowerCase().replace(/\s+/g, '_')}</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedAttributeDetail(null)} aria-label="Close attribute preview">
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4 border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <SellerAvatar className="h-14 w-14">{initialsFor(selectedAttributeDetail.name)}</SellerAvatar>
                  <div className="min-w-0">
                    <strong className="block text-base font-semibold text-neutral-950">{selectedAttributeDetail.appliesTo}</strong>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Applies to</span>
                  </div>
                </div>

                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{selectedAttributeDetail.displayType}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Type</span>
                </div>

                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{selectedAttributeDetail.is_required ? 'Yes' : 'No'}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Required</span>
                </div>

                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{selectedAttributeDetail.is_active === false ? 'Inactive' : 'Active'}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                </div>
              </div>

              <div className="border border-neutral-200 bg-white px-4 py-4">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Values</span>
                {(selectedAttributeDetail.options || []).length === 0 ? <p className="mt-2 text-sm leading-6 text-neutral-700">No preset values configured.</p> : <div className="mt-3 flex flex-wrap gap-2">
                    {(selectedAttributeDetail.options || []).map(option => <SellerPill key={option}>
                        {option}
                      </SellerPill>)}
                  </div>}
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
                <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              openEdit(selectedAttributeDetail);
              setSelectedAttributeDetail(null);
            }}>
                  Edit Attribute
                </Button>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}

      <div className="lg:hidden">
        <SellerMobileDetailSheet open={Boolean(selectedAttributeDetail)} title={selectedAttributeDetail?.name || ''} subtitle={selectedAttributeDetail ? String(selectedAttributeDetail.name || '').toLowerCase().replace(/\s+/g, '_') : ''} onClose={() => setSelectedAttributeDetail(null)} items={selectedAttributeDetail ? [{
      label: 'Applies To',
      value: selectedAttributeDetail.appliesTo
    }, {
      label: 'Type',
      value: selectedAttributeDetail.displayType
    }, {
      label: 'Required',
      value: selectedAttributeDetail.is_required ? 'Yes' : 'No'
    }, {
      label: 'Status',
      value: selectedAttributeDetail.is_active === false ? 'Inactive' : 'Active'
    }, {
      label: 'Values',
      value: (selectedAttributeDetail.options || []).length ? selectedAttributeDetail.options.join(', ') : '-'
    }] : []} actions={selectedAttributeDetail ? <Button type="button" variant="primary" onClick={() => {
      openEdit(selectedAttributeDetail);
      setSelectedAttributeDetail(null);
    }}>
            Edit Attribute
          </Button> : null} />
      </div>

      <AttributeDrawer isOpen={drawerOpen} onClose={closeDrawer} editingAttribute={editingAttribute} />
    </div>;
};
export default SellerAttributes;
