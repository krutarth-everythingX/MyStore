import React, { useEffect, useMemo, useState } from 'react';
import { Box, Check, CheckCircle2, Columns3, Edit2, Filter, Plus, Ruler, Search, Trash2, Wrench, X } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { DEFAULT_UNITS, UnitMeasurementDrawer } from '../components/UnitMeasurementDrawer';
import { SellerMobileDetailSheet } from '../components/SellerMobileDetailSheet';
import { SellerAvatar, SellerCheckboxOption, SellerEmptyState, SellerFloatingPanel, SellerGridBody, SellerGridCell, SellerGridHead, SellerGridRow, SellerModalBackdrop, SellerModalCard, SellerPageShell, SellerPaginationCard, SellerPill, SellerSearchField, SellerSelect, SellerSortHeader, SellerTablePaginationBar, SellerTableSurface, SellerTableWrap, SellerToolbar, SellerToolbarActions } from '../components/seller-workspace';
import { getNextSort, sortRows } from '../utils/tableSorting';
import { useAuth } from '../context/AuthContext';
const getStorageKey = (userId) => `seller-unit-measurements-${userId || 'default'}`;
const loadUnits = (userId) => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(getStorageKey(userId)) || 'null');
    return Array.isArray(stored) && stored.length ? stored : DEFAULT_UNITS;
  } catch (error) {
    return DEFAULT_UNITS;
  }
};
const initialForUnit = unit => String(unit?.symbol || unit?.name || 'U').slice(0, 2).toUpperCase();
const scopeLabel = value => String(value || 'product').replace(/\b\w/g, letter => letter.toUpperCase());
const typeLabel = value => String(value || 'Count').replace(/\b\w/g, letter => letter.toUpperCase());
const buildPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({
    length: total
  }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
};
export const SellerUnitMeasurements = () => {
  const { user } = useAuth();
  const [units, setUnits] = useState(() => loadUnits(user?.id));
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const [unitsPerPage, setUnitsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumns, setShowColumns] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUnitDetail, setSelectedUnitDetail] = useState(null);
  const [filters, setFilters] = useState({
    scope: 'all',
    type: 'all',
    status: 'all'
  });
  const [sort, setSort] = useState({
    key: 'name',
    direction: 'asc'
  });
  const [visibleColumns, setVisibleColumns] = useState({
    scope: true,
    type: true,
    items: true,
    status: true
  });

  useEffect(() => {
    setUnits(loadUnits(user?.id));
  }, [user?.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(getStorageKey(user?.id), JSON.stringify(units));
    } catch (error) {
      // Keep working in memory when storage is unavailable.
    }
  }, [units, user?.id]);
  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase();
    return units.filter(unit => {
      const matchesSearch = !query || [unit.name, unit.symbol, unit.type, unit.scope].join(' ').toLowerCase().includes(query);
      const unitScope = String(unit.scope || 'product').toLowerCase();
      const unitType = String(unit.type || 'count').toLowerCase();
      const isActive = unit.is_active !== false;
      const matchesScope = filters.scope === 'all' || unitScope === filters.scope || filters.scope === 'product' && unitScope === 'both' || filters.scope === 'service' && unitScope === 'both';
      const matchesType = filters.type === 'all' || unitType === filters.type;
      const matchesStatus = filters.status === 'all' || (filters.status === 'active' ? isActive : !isActive);
      return matchesSearch && matchesScope && matchesType && matchesStatus;
    });
  }, [filters.scope, filters.status, filters.type, search, units]);
  useEffect(() => {
    const totalPagesCount = Math.max(1, Math.ceil(filteredUnits.length / unitsPerPage));
    setCurrentPage(current => Math.min(current, totalPagesCount));
  }, [filteredUnits.length, unitsPerPage]);
  const sortedUnits = useMemo(() => sortRows(filteredUnits, sort, {
    name: unit => unit.name,
    scope: unit => scopeLabel(unit.scope),
    type: unit => typeLabel(unit.type),
    items: unit => Number(unit.items_count || 0),
    status: unit => unit.is_active === false ? 'inactive' : 'active'
  }), [filteredUnits, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedUnits.length / unitsPerPage));
  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * unitsPerPage;
    return sortedUnits.slice(start, start + unitsPerPage);
  }, [currentPage, sortedUnits, unitsPerPage]);
  const paginatedUnitIds = paginatedUnits.map(unit => unit.id);
  const allVisibleSelected = paginatedUnitIds.length > 0 && paginatedUnitIds.every(id => selectedUnitIds.includes(id));
  const someVisibleSelected = paginatedUnitIds.some(id => selectedUnitIds.includes(id));
  const activeFilterCount = Object.values(filters).filter(value => value !== 'all').length;
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const stats = useMemo(() => ({
    total: units.length,
    active: units.filter(unit => unit.is_active !== false).length,
    product: units.filter(unit => ['product', 'both'].includes(String(unit.scope || 'product').toLowerCase())).length,
    service: units.filter(unit => ['service', 'both'].includes(String(unit.scope || 'product').toLowerCase())).length,
    custom: units.filter(unit => String(unit.type || '').toLowerCase() === 'custom').length
  }), [units]);
  const unitColumnTemplate = ['34px', '42px', 'minmax(300px, 1.5fr)', visibleColumns.scope ? '160px' : null, visibleColumns.type ? '150px' : null, visibleColumns.items ? '110px' : null, visibleColumns.status ? '118px' : null, '118px'].filter(Boolean).join(' ');
  const renderUnitSortHeader = (key, label, className) => <SellerSortHeader active={sort.key === key} direction={sort.direction} className={`gap-1 ${className || ''}`} onClick={() => updateSort(key)}>
      {label}
    </SellerSortHeader>;
  const deleteUnit = unit => {
    if (!window.confirm(`Delete ${unit.name}?`)) return;
    setUnits(current => current.filter(item => item.id !== unit.id));
    setSelectedUnitIds(current => current.filter(id => id !== unit.id));
  };
  const openCreate = () => {
    setEditingUnit(null);
    setDrawerOpen(true);
  };
  const openEdit = unit => {
    setEditingUnit(unit);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingUnit(null);
  };
  const deleteSelectedUnits = () => {
    if (!selectedUnitIds.length) return;
    if (!window.confirm(`Delete ${selectedUnitIds.length} selected unit${selectedUnitIds.length === 1 ? '' : 's'}?`)) return;
    const selectedSet = new Set(selectedUnitIds);
    setUnits(current => current.filter(unit => !selectedSet.has(unit.id)));
    setSelectedUnitIds([]);
  };
  const clearFilters = () => {
    setFilters({
      scope: 'all',
      type: 'all',
      status: 'all'
    });
  };
  const toggleUnitSelection = id => {
    setSelectedUnitIds(current => current.includes(id) ? current.filter(unitId => unitId !== id) : [...current, id]);
  };
  const updateSort = key => setSort(current => getNextSort(current, key));
  return <div>
      <Sidebar />

      <SellerPageShell>
        <div className="border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">Units</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">Manage measurement units for products, services, and custom formulas.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={openCreate}>
                <Plus size={15} />
                Add Unit
              </Button>
            </div>
          </div>

          <div aria-label="Units summary" className="mt-6 grid gap-4 xl:grid-cols-5">
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Total Units</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{stats.total}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Ruler size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Active</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{stats.active}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><CheckCircle2 size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Product Units</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{stats.product}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Box size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Service Units</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{stats.service}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Wrench size={14} /></div>
              </div>
            </div>
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Formula Units</span>
                  <strong className="mt-3 block text-3xl font-semibold tracking-tight text-neutral-950">{stats.custom}</strong>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white"><Ruler size={14} /></div>
              </div>
            </div>
          </div>
        </div>

        <SellerTableSurface>
          <SellerToolbar search={<SellerSearchField className="xl:max-w-[560px]" icon={Search} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search units..." />} actions={<SellerToolbarActions>
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
                scope: 'Applies To',
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
                    <Filter size={14} />
                    Filters
                    {activeFilterCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center border border-neutral-950 bg-neutral-950 px-1 text-[10px] font-semibold text-white">
                        {activeFilterCount}
                      </span>}
                  </Button>
                  </div>
                </div>
              </SellerToolbarActions>} />

          <SellerTableWrap className="hidden xl:block">
            <SellerGridHead style={{
            gridTemplateColumns: unitColumnTemplate
          }}>
              <SellerGridCell>
                <input type="checkbox" checked={allVisibleSelected} ref={input => {
                if (input) input.indeterminate = !allVisibleSelected && someVisibleSelected;
              }} onChange={event => {
                setSelectedUnitIds(current => event.target.checked ? Array.from(new Set([...current, ...paginatedUnitIds])) : current.filter(id => !paginatedUnitIds.includes(id)));
              }} aria-label="Select all units" className="h-4 w-4 accent-neutral-950" />
              </SellerGridCell>
              <SellerGridCell>#</SellerGridCell>
              {renderUnitSortHeader('name', 'Unit', 'justify-start')}
              {visibleColumns.scope && renderUnitSortHeader('scope', 'Applies To', 'justify-center')}
              {visibleColumns.type && renderUnitSortHeader('type', 'Type', 'justify-center')}
              {visibleColumns.items && renderUnitSortHeader('items', 'Items', 'justify-center')}
              {visibleColumns.status && renderUnitSortHeader('status', 'Status', 'justify-center')}
              <SellerGridCell className="text-center">Actions</SellerGridCell>
            </SellerGridHead>

            <SellerGridBody>
              {paginatedUnits.length === 0 ? <SellerEmptyState title="No units found" description="Create units to standardize measurements across products." action={<Button variant="primary" onClick={openCreate}>
                      <Plus size={16} />
                      Add Unit
                    </Button>} /> : paginatedUnits.map((unit, index) => <SellerGridRow key={unit.id} style={{
                  gridTemplateColumns: unitColumnTemplate
                }}>
                  <SellerGridCell>
                    <input type="checkbox" checked={selectedUnitIds.includes(unit.id)} onChange={() => toggleUnitSelection(unit.id)} aria-label={`Select ${unit.name}`} className="h-4 w-4 accent-neutral-950" />
                  </SellerGridCell>
                  <SellerGridCell className="text-sm font-medium text-neutral-500">{(currentPage - 1) * unitsPerPage + index + 1}</SellerGridCell>
                  <SellerGridCell className="flex items-center gap-3">
                    <SellerAvatar>{initialForUnit(unit)}</SellerAvatar>
                    <div className="min-w-0">
                      <strong className="block truncate text-sm font-semibold text-neutral-950">{unit.name}</strong>
                      <small className="mt-1 block truncate text-xs text-neutral-500">{unit.symbol}</small>
                    </div>
                  </SellerGridCell>
                  {visibleColumns.scope && <SellerGridCell className="flex justify-center">
                      <SellerPill tone={String(unit.scope || 'product').toLowerCase() === 'service' ? 'info' : String(unit.scope || 'product').toLowerCase() === 'both' ? 'neutral' : 'success'}>
                        {scopeLabel(unit.scope)}
                      </SellerPill>
                    </SellerGridCell>}
                  {visibleColumns.type && <SellerGridCell className="flex justify-center">
                      <SellerPill>{typeLabel(unit.type)}</SellerPill>
                    </SellerGridCell>}
                  {visibleColumns.items && <SellerGridCell className="text-center text-sm text-neutral-700">{unit.items_count || 0}</SellerGridCell>}
                  {visibleColumns.status && <SellerGridCell className="flex justify-center">
                      <SellerPill tone={unit.is_active === false ? 'danger' : 'success'}>
                        {unit.is_active === false ? 'Inactive' : 'Active'}
                      </SellerPill>
                    </SellerGridCell>}
                  <SellerGridCell>
                    <div className="flex justify-center">
                      <div className="flex w-full max-w-[7.75rem] items-center justify-center gap-2">
                        <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedUnitDetail(unit)} aria-label={`View ${unit.name}`} title="View">
                          <Search size={14} />
                        </button>
                        <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => openEdit(unit)} aria-label={`Edit ${unit.name}`} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="inline-flex h-9 w-9 items-center justify-center border border-rose-500 bg-white text-rose-600 transition hover:bg-neutral-100" type="button" onClick={() => deleteUnit(unit)} aria-label={`Delete ${unit.name}`} title="Delete">
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
              {paginatedUnits.map(unit => <article key={`mobile-${unit.id}`} className="border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-base font-semibold text-neutral-950">{unit.name}</strong>
                      <span className="mt-1 block truncate text-xs text-neutral-500">{unit.symbol}</span>
                    </div>
                    <SellerPill tone={unit.is_active === false ? 'danger' : 'success'}>
                      {unit.is_active === false ? 'Inactive' : 'Active'}
                    </SellerPill>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Applies To</span>
                      <strong className="mt-2 block text-sm font-semibold text-neutral-950">{scopeLabel(unit.scope)}</strong>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Type</span>
                      <strong className="mt-2 block text-sm font-semibold text-neutral-950">{typeLabel(unit.type)}</strong>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3 sm:col-span-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Items</span>
                      <strong className="mt-2 block text-sm font-semibold text-neutral-950">{unit.items_count || 0}</strong>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={() => setSelectedUnitDetail(unit)}>View</Button>
                    <Button type="button" variant="primary" onClick={() => openEdit(unit)}>Edit</Button>
                  </div>
                </article>)}
            </div>
          </div>

        </SellerTableSurface>

        <SellerPaginationCard>
          <SellerTablePaginationBar showBorder={false} className="bg-transparent px-0 pb-0 pt-0" summary={`Showing ${filteredUnits.length ? (currentPage - 1) * unitsPerPage + 1 : 0} to ${Math.min(currentPage * unitsPerPage, filteredUnits.length)} of ${filteredUnits.length} results`} currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} onPageChange={setCurrentPage} perPage={unitsPerPage} onPerPageChange={event => {
          setUnitsPerPage(Number(event.target.value));
          setCurrentPage(1);
        }} />
        </SellerPaginationCard>
      </SellerPageShell>

      {selectedUnitIds.length > 0 && <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 pb-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold text-neutral-950">{selectedUnitIds.length} item{selectedUnitIds.length === 1 ? '' : 's'} selected</span>
            <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => setSelectedUnitIds([])}>
              <X size={14} />
              Clear
            </Button>
            <Button type="button" variant="primary" onClick={deleteSelectedUnits}>
              <Trash2 size={14} />
              Delete
            </Button>
            </div>
          </div>
        </div>}

      {showFilters && <SellerModalBackdrop onClose={() => setShowFilters(false)}>
          <SellerModalCard className="max-w-xl bg-white" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Unit Filters</span>
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-neutral-950" />
                    <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Filter Units</h3>
                  </div>
                  <p className="text-sm leading-6 text-neutral-500">Refine the unit list by scope, unit type, and status.</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setShowFilters(false)} aria-label="Close unit filters">
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Scope</span>
                  <SellerSelect value={filters.scope} onChange={event => setFilters(current => ({
              ...current,
              scope: event.target.value
            }))} className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950 shadow-none">
                    <option value="all">All Scope</option>
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                    <option value="both">Both</option>
                  </SellerSelect>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Type</span>
                  <SellerSelect value={filters.type} onChange={event => setFilters(current => ({
              ...current,
              type: event.target.value
            }))} className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950 shadow-none">
                    <option value="all">All Types</option>
                    <option value="count">Count</option>
                    <option value="weight">Weight</option>
                    <option value="volume">Volume</option>
                    <option value="length">Length</option>
                    <option value="area">Area</option>
                    <option value="time">Time</option>
                    <option value="custom">Custom</option>
                    <option value="stock">Stock</option>
                  </SellerSelect>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                  <SellerSelect value={filters.status} onChange={event => setFilters(current => ({
              ...current,
              status: event.target.value
            }))} className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950 shadow-none">
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

      {selectedUnitDetail && <SellerModalBackdrop onClose={() => setSelectedUnitDetail(null)}>
          <SellerModalCard className="hidden max-w-2xl bg-white lg:block" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Unit Preview</span>
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{selectedUnitDetail.name || 'Untitled unit'}</h3>
                  <p className="text-sm leading-6 text-neutral-500">{selectedUnitDetail.symbol || '-'}</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedUnitDetail(null)} aria-label="Close unit preview">
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4 border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <SellerAvatar className="h-14 w-14">{initialForUnit(selectedUnitDetail)}</SellerAvatar>
                  <div className="min-w-0">
                    <strong className="block text-base font-semibold text-neutral-950">{scopeLabel(selectedUnitDetail.scope)}</strong>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Applies to</span>
                  </div>
                </div>

                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{typeLabel(selectedUnitDetail.type)}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Type</span>
                </div>

                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{selectedUnitDetail.items_count || 0}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Items</span>
                </div>

                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{selectedUnitDetail.is_active === false ? 'Inactive' : 'Active'}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Description</span>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{selectedUnitDetail.description || 'No description added yet.'}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
                <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              openEdit(selectedUnitDetail);
              setSelectedUnitDetail(null);
            }}>
                  Edit Unit
                </Button>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}

      <div className="lg:hidden">
        <SellerMobileDetailSheet open={Boolean(selectedUnitDetail)} title={selectedUnitDetail?.name || ''} subtitle={selectedUnitDetail?.symbol || ''} onClose={() => setSelectedUnitDetail(null)} items={selectedUnitDetail ? [{
      label: 'Applies To',
      value: scopeLabel(selectedUnitDetail.scope)
    }, {
      label: 'Type',
      value: typeLabel(selectedUnitDetail.type)
    }, {
      label: 'Status',
      value: selectedUnitDetail.is_active === false ? 'Inactive' : 'Active'
    }, {
      label: 'Items',
      value: String(selectedUnitDetail.items_count || 0)
    }, {
      label: 'Description',
      value: selectedUnitDetail.description || '-'
    }] : []} actions={selectedUnitDetail ? <Button type="button" variant="primary" onClick={() => {
      openEdit(selectedUnitDetail);
      setSelectedUnitDetail(null);
    }}>
            Edit Unit
          </Button> : null} />
      </div>

      <UnitMeasurementDrawer isOpen={drawerOpen} onClose={closeDrawer} units={units} onUnitsChange={setUnits} editingUnit={editingUnit} />
    </div>;
};
export default SellerUnitMeasurements;
