import React, { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Check, Columns3, Edit2, ListFilter, Plus, Search, Trash2, X } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { BrandDrawer } from '../components/BrandDrawer';
import { SellerMobileDetailSheet } from '../components/SellerMobileDetailSheet';
import { SellerCheckboxOption, SellerEmptyState, SellerFloatingPanel, SellerGridBody, SellerGridCell, SellerGridHead, SellerGridRow, SellerModalBackdrop, SellerModalCard, SellerPageShell, SellerPaginationCard, SellerPill, SellerSearchField, SellerSelect, SellerSortHeader, SellerTablePaginationBar, SellerTableSurface, SellerTableWrap, SellerToolbar, SellerToolbarActions } from '../components/seller-workspace';
import { getNextSort, sortRows } from '../utils/tableSorting';
const brandInitial = brand => String(brand?.name || 'B').trim().charAt(0).toUpperCase() || 'B';
const buildPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({
    length: total
  }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
};
export const SellerBrands = ({
  initialOpen = false
}) => {
  const {
    props
  } = usePage();
  const pageBrands = props.brands;
  const [brands, setBrands] = useState(Array.isArray(pageBrands) ? pageBrands : []);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(initialOpen);
  const [editingBrand, setEditingBrand] = useState(null);
  const [actionError, setActionError] = useState('');
  const [selectedBrandIds, setSelectedBrandIds] = useState([]);
  const [brandsPerPage, setBrandsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState({
    key: 'name',
    direction: 'asc'
  });
  const [showColumns, setShowColumns] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBrandDetail, setSelectedBrandDetail] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    description: true,
    products: true,
    status: true
  });
  useEffect(() => {
    setBrands(Array.isArray(pageBrands) ? pageBrands : []);
  }, [pageBrands]);
  const filteredBrands = useMemo(() => {
    const query = search.trim().toLowerCase();
    return brands.filter(brand => {
      const matchesSearch = !query || [brand.name, brand.website_url, brand.slug].join(' ').toLowerCase().includes(query);
      const isActive = brand.is_active !== false;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive);
      return matchesSearch && matchesStatus;
    });
  }, [brands, search, statusFilter]);
  useEffect(() => {
    const totalPagesCount = Math.max(1, Math.ceil(filteredBrands.length / brandsPerPage));
    setCurrentPage(current => Math.min(current, totalPagesCount));
  }, [brandsPerPage, filteredBrands.length]);
  const sortedBrands = useMemo(() => sortRows(filteredBrands, sort, {
    name: brand => brand.name,
    description: brand => brand.description || '',
    products: brand => Number(brand.products_count || 0),
    status: brand => brand.is_active === false ? 'inactive' : 'active'
  }), [filteredBrands, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedBrands.length / brandsPerPage));
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * brandsPerPage;
    return sortedBrands.slice(start, start + brandsPerPage);
  }, [brandsPerPage, currentPage, sortedBrands]);
  const paginatedBrandIds = paginatedBrands.map(brand => brand.id);
  const allVisibleBrandsSelected = paginatedBrandIds.length > 0 && paginatedBrandIds.every(id => selectedBrandIds.includes(id));
  const someVisibleBrandsSelected = paginatedBrandIds.some(id => selectedBrandIds.includes(id));
  const activeFilterCount = statusFilter === 'all' ? 0 : 1;
  const brandColumnTemplate = ['34px', '42px', 'minmax(320px, 1.5fr)', visibleColumns.description ? 'minmax(260px, 1.1fr)' : null, visibleColumns.products ? '120px' : null, visibleColumns.status ? '118px' : null, '118px'].filter(Boolean).join(' ');
  const brandStats = useMemo(() => ({
    total: brands.length,
    active: brands.filter(brand => brand.is_active !== false).length,
    inactive: brands.filter(brand => brand.is_active === false).length,
    linkedProducts: brands.reduce((total, brand) => total + Number(brand.products_count || 0), 0)
  }), [brands]);
  const renderBrandSortHeader = (key, label, className) => <SellerSortHeader active={sort.key === key} direction={sort.direction} className={`gap-1 ${className || ''}`} onClick={() => updateSort(key)}>
      {label}
    </SellerSortHeader>;
  const addBrand = brand => {
    setBrands(current => current.some(item => String(item.id) === String(brand.id)) ? current.map(item => String(item.id) === String(brand.id) ? {
      ...item,
      ...brand
    } : item) : [...current, brand].sort((a, b) => String(a.name).localeCompare(String(b.name))));
  };
  const openCreate = () => {
    setEditingBrand(null);
    setDrawerOpen(true);
  };
  const openEdit = brand => {
    setEditingBrand(brand);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingBrand(null);
  };
  const clearFilters = () => {
    setStatusFilter('all');
  };
  const deleteBrand = async brand => {
    if (!window.confirm(`Delete ${brand.name}?`)) return;
    setActionError('');
    try {
      const response = await fetch(`/brands/${brand.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Brand could not be deleted.');
      setBrands(current => current.filter(item => String(item.id) !== String(brand.id)));
    } catch (error) {
      setActionError(error.message || 'Brand could not be deleted.');
    }
  };
  const toggleBrandSelection = id => {
    setSelectedBrandIds(current => current.includes(id) ? current.filter(brandId => brandId !== id) : [...current, id]);
  };
  const updateSort = key => setSort(current => getNextSort(current, key));
  return <div>
      <Sidebar />

      <SellerPageShell>
        <div className="border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">Brands</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">Manage product brands.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={openCreate}>
                <Plus size={15} />
                Add Brand
              </Button>
            </div>
          </div>

          <div aria-label="Brand summary" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Total Brands</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{brandStats.total}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Plus size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Active</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{brandStats.active}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Check size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Inactive</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{brandStats.inactive}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><X size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Linked Products</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{brandStats.linkedProducts}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Search size={14} /></div>
              </div>
            </div>
          </div>
        </div>

        <SellerTableSurface>
          {actionError && <div className="border-b border-neutral-200 bg-white px-4 py-3 text-sm text-rose-700">{actionError}</div>}

          <SellerToolbar search={<SellerSearchField className="xl:max-w-[560px]" icon={Search} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search brands..." />} actions={<SellerToolbarActions>
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
                description: 'Description',
                products: 'Products',
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
            gridTemplateColumns: brandColumnTemplate
          }}>
              <SellerGridCell>
                <input type="checkbox" checked={allVisibleBrandsSelected} ref={input => {
                if (input) input.indeterminate = !allVisibleBrandsSelected && someVisibleBrandsSelected;
              }} onChange={event => {
                setSelectedBrandIds(current => event.target.checked ? Array.from(new Set([...current, ...paginatedBrandIds])) : current.filter(id => !paginatedBrandIds.includes(id)));
              }} aria-label="Select all brands" className="h-4 w-4 accent-neutral-950" />
              </SellerGridCell>
              <SellerGridCell>#</SellerGridCell>
              {renderBrandSortHeader('name', 'Brand', 'justify-start')}
              {visibleColumns.description && renderBrandSortHeader('description', 'Description', 'justify-start')}
              {visibleColumns.products && renderBrandSortHeader('products', 'Products', 'justify-center')}
              {visibleColumns.status && renderBrandSortHeader('status', 'Status', 'justify-center')}
              <SellerGridCell className="text-center">Actions</SellerGridCell>
            </SellerGridHead>

            <SellerGridBody>
              {filteredBrands.length === 0 ? <SellerEmptyState title="No brands found" description="Create your first brand or adjust the search." action={<Button variant="primary" onClick={openCreate}>
                      <Plus size={16} />
                      Add Brand
                    </Button>} /> : paginatedBrands.map((brand, index) => <SellerGridRow key={brand.id} style={{
                  gridTemplateColumns: brandColumnTemplate
                }}>
                    <SellerGridCell>
                      <input type="checkbox" checked={selectedBrandIds.includes(brand.id)} onChange={() => toggleBrandSelection(brand.id)} aria-label={`Select ${brand.name}`} className="h-4 w-4 accent-neutral-950" />
                    </SellerGridCell>

                    <SellerGridCell className="text-sm font-medium text-neutral-500">
                      {(currentPage - 1) * brandsPerPage + index + 1}
                    </SellerGridCell>

                    <SellerGridCell className="flex items-center gap-3">
                      {brand.logo ? <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-100">
                          <img className="h-full w-full object-cover" src={brand.logo} alt="" />
                        </span> : <span className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-950 text-sm font-semibold uppercase text-white">{brandInitial(brand)}</span>}
                      <div className="min-w-0">
                        <strong className="block truncate text-sm font-semibold text-neutral-950">{brand.name}</strong>
                        <span className="mt-1 block truncate text-xs text-neutral-500">{brand.website_url || (brand.slug ? `/${brand.slug}` : '-')}</span>
                      </div>
                    </SellerGridCell>

                    {visibleColumns.description && <SellerGridCell className="text-sm text-neutral-700">{brand.description || '-'}</SellerGridCell>}
                    {visibleColumns.products && <SellerGridCell className="text-center text-sm text-neutral-700">{brand.products_count || 0}</SellerGridCell>}
                    {visibleColumns.status && <SellerGridCell className="flex justify-center">
                        <SellerPill tone={brand.is_active === false ? 'danger' : 'success'}>
                          {brand.is_active === false ? 'Inactive' : 'Active'}
                        </SellerPill>
                      </SellerGridCell>}

                    <SellerGridCell>
                      <div className="flex justify-center">
                        <div className="flex w-full max-w-[7.75rem] items-center justify-center gap-2">
                          <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedBrandDetail(brand)} aria-label={`View ${brand.name}`} title="View">
                            <Search size={14} />
                          </button>
                          <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => openEdit(brand)} aria-label={`Edit ${brand.name}`} title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button className="inline-flex h-9 w-9 items-center justify-center border border-rose-500 bg-white text-rose-600 transition hover:bg-neutral-100" type="button" onClick={() => deleteBrand(brand)} aria-label={`Delete ${brand.name}`} title="Delete">
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
              {paginatedBrands.map(brand => <article key={`mobile-${brand.id}`} className="border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-base font-semibold text-neutral-950">{brand.name}</strong>
                      <span className="mt-1 block truncate text-xs text-neutral-500">{brand.website_url || (brand.slug ? `/${brand.slug}` : '-')}</span>
                    </div>
                    <SellerPill tone={brand.is_active === false ? 'danger' : 'success'}>
                      {brand.is_active === false ? 'Inactive' : 'Active'}
                    </SellerPill>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Products</span>
                      <strong className="mt-2 block text-sm font-semibold text-neutral-950">{brand.products_count || 0}</strong>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Slug</span>
                      <strong className="mt-2 block truncate text-sm font-semibold text-neutral-950">{brand.slug || '-'}</strong>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={() => setSelectedBrandDetail(brand)}>View</Button>
                    <Button type="button" variant="primary" onClick={() => openEdit(brand)}>Edit</Button>
                  </div>
                </article>)}
            </div>
          </div>

        </SellerTableSurface>

        <SellerPaginationCard>
          <SellerTablePaginationBar showBorder={false} className="bg-transparent px-0 pb-0 pt-0" summary={`Showing ${filteredBrands.length ? (currentPage - 1) * brandsPerPage + 1 : 0} to ${Math.min(currentPage * brandsPerPage, filteredBrands.length)} of ${filteredBrands.length} results`} currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} onPageChange={setCurrentPage} perPage={brandsPerPage} onPerPageChange={event => {
          setBrandsPerPage(Number(event.target.value));
          setCurrentPage(1);
        }} />
        </SellerPaginationCard>
      </SellerPageShell>

      {showFilters && <SellerModalBackdrop onClose={() => setShowFilters(false)}>
          <SellerModalCard className="max-w-xl bg-white" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Brand Filters</span>
                  <div className="flex items-center gap-2">
                    <ListFilter size={18} className="text-neutral-950" />
                    <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Filter Brands</h3>
                  </div>
                  <p className="text-sm leading-6 text-neutral-500">Refine the brand list by current publishing status.</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setShowFilters(false)} aria-label="Close brand filters">
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                  <SellerSelect value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950 shadow-none">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
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

      {selectedBrandDetail && <SellerModalBackdrop onClose={() => setSelectedBrandDetail(null)}>
          <SellerModalCard className="hidden max-w-2xl bg-white lg:block" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Brand Preview</span>
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{selectedBrandDetail.name || 'Untitled brand'}</h3>
                  <p className="text-sm leading-6 text-neutral-500">{selectedBrandDetail.website_url || (selectedBrandDetail.slug ? `/${selectedBrandDetail.slug}` : 'No website linked')}</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedBrandDetail(null)} aria-label="Close brand preview">
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4 border border-neutral-200 bg-neutral-50 px-4 py-4">
                  {selectedBrandDetail.logo ? <span className="inline-flex h-14 w-14 items-center justify-center overflow-hidden border border-neutral-200 bg-white">
                      <img src={selectedBrandDetail.logo} alt="" className="h-full w-full object-cover" />
                    </span> : <span className="inline-flex h-14 w-14 items-center justify-center border border-neutral-200 bg-neutral-950 text-lg font-semibold uppercase text-white">{brandInitial(selectedBrandDetail)}</span>}
                  <div className="min-w-0">
                    <strong className="block text-base font-semibold text-neutral-950">{selectedBrandDetail.is_active === false ? 'Inactive' : 'Active'}</strong>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                  </div>
                </div>

                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{selectedBrandDetail.products_count || 0}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Linked products</span>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Slug</span>
                  <strong className="mt-2 block break-all text-sm font-semibold text-neutral-950">{selectedBrandDetail.slug || '-'}</strong>
                </div>

                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Website</span>
                  <p className="mt-2 break-all text-sm leading-6 text-neutral-700">{selectedBrandDetail.website_url || 'No website linked.'}</p>
                </div>

                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Description</span>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{selectedBrandDetail.description || 'No description added yet.'}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
                <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              openEdit(selectedBrandDetail);
              setSelectedBrandDetail(null);
            }}>
                  Edit Brand
                </Button>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}

      <div className="lg:hidden">
        <SellerMobileDetailSheet open={Boolean(selectedBrandDetail)} title={selectedBrandDetail?.name || ''} subtitle={selectedBrandDetail?.website_url || (selectedBrandDetail?.slug ? `/${selectedBrandDetail.slug}` : '')} onClose={() => setSelectedBrandDetail(null)} items={selectedBrandDetail ? [{
      label: 'Status',
      value: selectedBrandDetail.is_active === false ? 'Inactive' : 'Active'
    }, {
      label: 'Products',
      value: String(selectedBrandDetail.products_count || 0)
    }, {
      label: 'Slug',
      value: selectedBrandDetail.slug || '-'
    }, {
      label: 'Website',
      value: selectedBrandDetail.website_url || '-'
    }] : []} actions={selectedBrandDetail ? <Button type="button" variant="primary" onClick={() => {
      openEdit(selectedBrandDetail);
      setSelectedBrandDetail(null);
    }}>
            Edit Brand
          </Button> : null} />
      </div>

      <BrandDrawer isOpen={drawerOpen} onClose={closeDrawer} onCreated={addBrand} editingBrand={editingBrand} />
    </div>;
};
export default SellerBrands;
