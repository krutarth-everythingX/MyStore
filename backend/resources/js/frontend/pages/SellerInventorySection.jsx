import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, BadgeCheck, ArrowDownToLine, ArrowRightLeft, ArrowUpToLine, ArrowUpDown, Calendar, Check, CheckCircle2, ChevronDown, ClipboardCheck, ClipboardList, Columns3, Download, Eye, Filter, Paperclip, Grid2X2, Import, ListChecks, MoreVertical, Package, Plus, RefreshCw, ScanBarcode, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SellerMobileDetailSheet } from '../components/SellerMobileDetailSheet';
import { SellerEmptyState, SellerGridBody, SellerGridCell, SellerGridHead, SellerGridRow, SellerModalBackdrop, SellerModalCard, SellerPageHeader, SellerPageShell, SellerPaginationCard, SellerPill, SellerSelect, SellerSortHeader, SellerTablePaginationBar, SellerTableSurface, SellerTextarea } from '../components/seller-workspace';
import { formatMoney, getUserLocalization } from '../utils/localization';
import { getNextSort, sortAriaSort, sortButtonClass, sortRows } from '../utils/tableSorting';
import { cn } from '../utils/cn';
const number = value => new Intl.NumberFormat('en-US').format(Number(value || 0));
const dateLabel = value => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-CA').format(new Date(value));
};
const stockEntryDateLabel = value => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value)).replace(/\//g, '-');
};
const daysUntil = value => {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};
const titleCase = value => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const buildPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({
    length: total
  }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
};
const InventorySortHeader = ({
  sort,
  setSort,
  sortKey,
  children
}) => <button type="button" onClick={() => setSort(current => getNextSort(current, sortKey))} aria-sort={sortAriaSort(sort, sortKey)}>
    {children}
    <ArrowUpDown size={12} />
  </button>;
const isoDate = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const parseCsvLine = line => {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values.map(value => value.trim());
};
const csvEscape = value => {
  const stringValue = String(value ?? '');
  return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
};
const entryCodeFromType = type => {
  const map = {
    adjustment_in: 'MR',
    opening_stock: 'OS',
    inward: 'IN',
    outward: 'OT',
    transfer: 'TR',
    manufacture: 'MF'
  };
  return map[type] || 'ST';
};
const entryPillTone = type => {
  if (type === 'manufacture') return 'blue';
  return 'green';
};
const movementTone = type => {
  if (['outward'].includes(type)) return 'purple';
  if (['pending', 'pending_approval'].includes(type)) return 'amber';
  return 'green';
};
const movementGuidance = type => {
  if (['outward', 'adjustment_out'].includes(type)) {
    return 'Choose the source warehouse where stock will be removed. Destination warehouse is not required.';
  }
  if (type === 'transfer') {
    return 'Choose both source and destination warehouses to move stock between locations.';
  }
  return 'Choose the destination warehouse receiving stock. Source warehouse is not required.';
};
const statusTone = status => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'draft') return 'gray';
  if (normalized === 'cancelled') return 'red';
  return 'green';
};
const adjustmentTone = status => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'draft') return 'gray';
  if (normalized === 'submitted') return 'amber';
  return 'green';
};
const varianceTone = value => {
  const amount = Number(value || 0);
  if (amount < 0) return 'purple';
  if (amount > 0) return 'green';
  return 'gray';
};
const metricTone = tone => cn('inline-flex min-h-6 items-center rounded-full px-2.5 text-[11px] font-semibold', tone === 'green' && 'bg-white0 text-white', tone === 'blue' && 'bg-white0 text-white', tone === 'purple' && 'bg-white0 text-white', tone === 'amber' && 'bg-white0 text-white', tone === 'red' && 'bg-white0 text-white', tone === 'gray' && 'bg-slate-500 text-white', !['green', 'blue', 'purple', 'amber', 'red', 'gray'].includes(tone) && 'bg-slate-100 text-slate-700');
const inventoryTabs = [['Stock Entries', '/seller/inventory/stock-entries', Grid2X2], ['Stock Movements', '/seller/inventory/stock-movements', ListChecks], ['Reconciliation', '/seller/inventory/reconciliation', ShieldCheck]];
const stockControlLinks = [['Batch Tracking', '/seller/inventory/batch-tracking'], ['Serial Tracking', '/seller/inventory/serial-tracking'], ['Expiry Tracking', '/seller/inventory/expiry-tracking']];
const reconciliationHighlights = [{
  title: 'Count Plan',
  copy: 'Set scope by warehouse, team, or product group before a count begins.',
  icon: ClipboardList
}, {
  title: 'Variance Review',
  copy: 'Spot gaps between system stock and physical stock with a quick scan.',
  icon: Sparkles
}, {
  title: 'Audit Trail',
  copy: 'Keep each review, approval, and posted adjustment easy to trace.',
  icon: ClipboardCheck
}];
const reconciliationChecklist = [['Choose scope', 'Select the warehouse or product slice you want the team to count.'], ['Capture actuals', 'Enter physical stock observed on the floor and compare it with system stock.'], ['Post approved differences', 'Turn reviewed variances into clean stock adjustments with context.']];
const TableButton = ({
  children,
  icon: Icon,
  dark = false,
  active = false,
  badge = null,
  onClick
}) => <button type="button" onClick={onClick}>
    {Icon && <Icon size={15} />}
    {children}
    {badge !== null && <b>{badge}</b>}
  </button>;
const IconButton = ({
  icon: Icon,
  label = 'Action',
  onClick
}) => <button type="button" aria-label={label} onClick={onClick}>
    <Icon size={16} />
  </button>;
const EmptyState = ({
  title,
  copy
}) => <SellerEmptyState title={title} description={copy} />;
const ReconciliationEmptyState = () => <div>
    <div>
      <span>Stock control workspace</span>
      <div>
        <ClipboardCheck size={30} />
      </div>
      <strong>Start your first reconciliation run</strong>
      <p>
        Launch a guided count session, compare physical stock against system stock,
        and move approved differences into adjustments from one workspace.
      </p>
      <div>
        <TableButton icon={Plus} dark>Create Reconciliation</TableButton>
        <TableButton icon={Calendar}>Schedule Count</TableButton>
      </div>
    </div>

    <div aria-label="Reconciliation workflow">
      {reconciliationChecklist.map(([title, copy], index) => <article key={title}>
          <span>{index + 1}</span>
          <div>
            <strong>{title}</strong>
            <p>{copy}</p>
          </div>
        </article>)}
    </div>
  </div>;
const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
  right,
  note,
  stats = []
}) => <SellerPageHeader title={title} description={subtitle} action={right ? <div className="flex flex-wrap gap-3 xl:justify-end">{right}</div> : null} stats={stats.length > 0 ? stats : note ? [{
  label: eyebrow || 'Status',
  value: note,
  icon: CheckCircle2,
  tone: 'green'
}] : []} />;
const SummaryPill = ({
  icon: Icon,
  label,
  value,
  tone
}) => <article className={cn('border border-neutral-200 bg-neutral-50 p-4', tone === 'green' && 'bg-white', tone === 'purple' && 'bg-white', tone === 'amber' && 'bg-white', tone === 'red' && 'bg-white', tone === 'gray' && 'bg-neutral-100')}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</span>
        <strong className="mt-2 block text-xl font-semibold tracking-tight text-neutral-950">{value}</strong>
      </div>
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-white text-neutral-950">
        <Icon size={15} />
      </span>
    </div>
  </article>;
const StockMovementSummary = ({
  rows
}) => {
  const total = rows.length;
  const inward = rows.filter(row => row.quantity > 0).length;
  const outward = rows.filter(row => row.quantity < 0).length;
  const pending = rows.filter(row => ['pending', 'pending_approval'].includes(String(row.type || '').toLowerCase())).length;
  return [{
    label: 'Total Movements',
    value: number(total),
    icon: ArrowRightLeft,
    tone: 'green'
  }, {
    label: 'Inward',
    value: number(inward),
    icon: ArrowDownToLine,
    tone: 'green'
  }, {
    label: 'Outward',
    value: number(outward),
    icon: ArrowUpToLine,
    tone: 'blue'
  }, {
    label: 'Pending Approval',
    value: number(pending),
    icon: RefreshCw,
    tone: 'amber'
  }];
};
const StockMovementHeader = ({
  title,
  subtitle,
  rows,
  action
}) => <SellerPageHeader title={title} description={subtitle} action={action ? <div className="flex flex-wrap gap-3 xl:justify-end">{action}</div> : null} stats={StockMovementSummary({
  rows
})} />;
const movementReasonOptions = ['Material Receipt', 'Sales Issue', 'Warehouse Transfer', 'Cycle count correction', 'Opening seller demo inventory', 'Damaged stock', 'Manual correction'];
const movementTypeOptions = [['inward', 'Inward'], ['outward', 'Outward'], ['transfer', 'Transfer'], ['adjustment_in', 'Adjustment In'], ['adjustment_out', 'Adjustment Out']];
const referenceTypeOptions = ['Manual', 'Purchase Order', 'Sales Order', 'Transfer Order', 'Adjustment'];
const StockMovementModal = ({
  products,
  warehouses,
  onClose
}) => {
  const [form, setForm] = useState({
    product_id: '',
    type: 'inward',
    quantity: '',
    from_warehouse_id: '',
    to_warehouse_id: '',
    reason: '',
    custom_reason: '',
    reference_type: 'Manual',
    reference_no: '',
    notes: '',
    attachment: null
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const fileInputRef = useRef(null);
  const needsSource = ['outward', 'transfer', 'adjustment_out'].includes(form.type);
  const needsDestination = ['inward', 'transfer', 'adjustment_in'].includes(form.type);
  const filteredProducts = products.filter(product => {
    const needle = productSearch.trim().toLowerCase();
    if (!needle) return true;
    return `${product.name} ${product.sku}`.toLowerCase().includes(needle);
  }).slice(0, 6);
  const selectedProduct = products.find(product => String(product.id) === String(form.product_id));
  const reason = form.custom_reason.trim() || form.reason;
  const setField = (field, value) => {
    setForm(current => ({
      ...current,
      [field]: value
    }));
    setErrors(current => ({
      ...current,
      [field]: undefined
    }));
  };
  const selectProduct = product => {
    setField('product_id', product.id);
    setProductSearch(`${product.name}${product.sku ? ` - ${product.sku}` : ''}`);
  };
  const handleSubmit = event => {
    event.preventDefault();
    const payload = new FormData();
    payload.append('product_id', form.product_id);
    payload.append('type', form.type);
    payload.append('quantity', form.quantity);
    payload.append('reference_type', form.reference_type.toLowerCase().replace(/\s+/g, '_'));
    payload.append('reason', reason);
    if (form.from_warehouse_id) payload.append('from_warehouse_id', form.from_warehouse_id);
    if (form.to_warehouse_id) payload.append('to_warehouse_id', form.to_warehouse_id);
    if (form.reference_no) payload.append('reference_no', form.reference_no);
    if (form.notes) payload.append('notes', form.notes);
    if (form.attachment) payload.append('attachment', form.attachment);
    setProcessing(true);
    router.post('/inventory/stock-movements', payload, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: onClose,
      onError: setErrors,
      onFinish: () => setProcessing(false)
    });
  };
  const fieldClassName = 'min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none';
  return <SellerModalBackdrop onClose={onClose}>
      <SellerModalCard className="max-w-5xl bg-white" onMouseDown={event => event.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
            <div className="space-y-2">
              <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Stock Movement</span>
              <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-neutral-950">
                <Plus size={18} />
                Record Movement
              </h2>
              <p className="text-sm leading-6 text-neutral-500">Create inward, outward, transfer, and adjustment movements from one form.</p>
            </div>
            <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" aria-label="Close record movement modal" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="space-y-4 border border-neutral-200 bg-neutral-50 p-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-neutral-950">Movement Details</h3>
                <p className="text-sm leading-6 text-neutral-500">{movementGuidance(form.type)}</p>
              </div>
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Product *</span>
                  <div className="flex min-h-12 items-center border border-neutral-200 bg-white px-4">
                    <Search size={16} className="shrink-0 text-neutral-500" />
                    <input className="w-full bg-transparent px-3 text-sm text-neutral-950 outline-none" type="text" placeholder="Search product..." value={productSearch} onChange={event => {
                  setProductSearch(event.target.value);
                  setField('product_id', '');
                }} />
                  </div>
                  {productSearch && !selectedProduct && filteredProducts.length > 0 && <div className="space-y-2 border border-neutral-200 bg-white p-3">
                      {filteredProducts.map(product => <button type="button" key={product.id} className="flex w-full items-center justify-between border border-neutral-200 bg-neutral-50 px-3 py-2 text-left transition hover:bg-neutral-100" onClick={() => selectProduct(product)}>
                          <strong className="truncate text-sm font-semibold text-neutral-950">{product.name}</strong>
                          <span className="ml-3 shrink-0 text-xs text-neutral-500">{product.sku || '-'}</span>
                        </button>)}
                    </div>}
                  {errors.product_id && <em className="text-xs not-italic text-rose-600">{errors.product_id}</em>}
                </label>

                <label className="block space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Movement Type</span>
                  <SellerSelect className={fieldClassName} value={form.type} onChange={event => setForm(current => ({
                ...current,
                type: event.target.value,
                from_warehouse_id: ['outward', 'transfer', 'adjustment_out'].includes(event.target.value) ? current.from_warehouse_id : '',
                to_warehouse_id: ['inward', 'transfer', 'adjustment_in'].includes(event.target.value) ? current.to_warehouse_id : ''
              }))}>
                    {movementTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </SellerSelect>
                </label>

                <label className="block space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Quantity *</span>
                  <input className={fieldClassName} type="number" min="1" value={form.quantity} onChange={event => setField('quantity', event.target.value)} />
                  {errors.quantity && <em className="text-xs not-italic text-rose-600">{errors.quantity}</em>}
                </label>
              </div>
            </section>

            <section className="space-y-4 border border-neutral-200 bg-neutral-50 p-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-neutral-950">Stock Flow</h3>
                <p className="text-sm leading-6 text-neutral-500">Choose the warehouse direction based on the selected movement type.</p>
              </div>
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">From Warehouse{needsSource ? ' *' : ''}</span>
                  <SellerSelect className={fieldClassName} value={form.from_warehouse_id} onChange={event => setField('from_warehouse_id', event.target.value)} disabled={!needsSource}>
                    <option value="">Select an option</option>
                    {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                  </SellerSelect>
                  {errors.from_warehouse_id && <em className="text-xs not-italic text-rose-600">{errors.from_warehouse_id}</em>}
                </label>

                <label className="block space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">To Warehouse{needsDestination ? ' *' : ''}</span>
                  <SellerSelect className={fieldClassName} value={form.to_warehouse_id} onChange={event => setField('to_warehouse_id', event.target.value)} disabled={!needsDestination}>
                    <option value="">Select an option</option>
                    {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                  </SellerSelect>
                  {errors.to_warehouse_id && <em className="text-xs not-italic text-rose-600">{errors.to_warehouse_id}</em>}
                </label>
              </div>
            </section>
          </div>

          <section className="space-y-4 border border-neutral-200 bg-white p-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-neutral-950">Reference & Notes</h3>
              <p className="text-sm leading-6 text-neutral-500">Add reason, document reference, and optional notes for the audit trail.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="block space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Reason</span>
                <SellerSelect className={fieldClassName} value={form.reason} onChange={event => setField('reason', event.target.value)}>
                  <option value="">Select an option</option>
                  {movementReasonOptions.map(option => <option key={option} value={option}>{option}</option>)}
                </SellerSelect>
              </label>

              <label className="block space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Custom Reason</span>
                <input className={fieldClassName} type="text" value={form.custom_reason} onChange={event => setField('custom_reason', event.target.value)} />
              </label>

              <label className="block space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Reference Type</span>
                <SellerSelect className={fieldClassName} value={form.reference_type} onChange={event => setField('reference_type', event.target.value)}>
                  {referenceTypeOptions.map(option => <option key={option} value={option}>{option}</option>)}
                </SellerSelect>
              </label>

              <label className="block space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Reference ID</span>
                <input className={fieldClassName} type="text" value={form.reference_no} onChange={event => setField('reference_no', event.target.value)} />
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <label className="block space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Attachment</span>
                <button className="flex min-h-12 w-full items-center justify-between gap-3 border border-neutral-200 bg-neutral-50 px-4 text-left transition hover:bg-neutral-100" type="button" onClick={() => fileInputRef.current?.click()}>
                  <span className="flex min-w-0 items-center gap-3">
                    <Paperclip size={16} className="shrink-0 text-neutral-500" />
                    <span className="truncate text-sm text-neutral-950">{form.attachment?.name || 'Upload attachment'}</span>
                  </span>
                  <small className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Choose</small>
                </button>
                <input ref={fileInputRef} className="hidden" type="file" onChange={event => setField('attachment', event.target.files?.[0] || null)} />
              </label>

              <label className="block space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Notes</span>
                <SellerTextarea className="min-h-[120px] rounded-none border border-neutral-200 px-4 py-3 text-sm text-neutral-950 shadow-none" value={form.notes} onChange={event => setField('notes', event.target.value)} placeholder="Add notes for this movement..." />
              </label>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
            <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={onClose}>
              <X size={15} />
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="rounded-none border border-neutral-200 px-4" disabled={processing}>
              <BadgeCheck size={15} />
              {processing ? 'Recording...' : 'Record Movement'}
            </Button>
          </div>
        </form>
      </SellerModalCard>
    </SellerModalBackdrop>;
};
const TraceabilityHeader = ({
  title,
  subtitle,
  summary,
  exportLabel = 'Export',
  onExport
}) => <header className="border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3 xl:justify-end">
          <Button type="button" variant="outline" onClick={onExport}>
            <Download size={14} />
            {exportLabel}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={`${title} summary`}>
        {summary}
      </div>
    </div>
  </header>;
const TraceabilityToolbar = ({
  placeholder,
  search,
  setSearch,
  manageLabel = 'Manage Columns',
  filterLabel = 'Filters',
  searchWidthClass = '',
  manageAction = null,
  filterAction = null,
  manageActive = false,
  filterActive = false
}) => <div>
    <label>
      <Search size={17} />
      <input type="text" placeholder={placeholder} value={search} onChange={event => setSearch(event.target.value)} />
    </label>

    <div>
      <TableButton icon={Columns3} active={manageActive} onClick={manageAction}>{manageLabel}</TableButton>
      <TableButton icon={Filter} active={filterActive} onClick={filterAction}>{filterLabel}</TableButton>
    </div>
  </div>;
const TraceabilityEmptyState = ({
  icon: Icon,
  title,
  copy
}) => <div>
    <span><Icon size={24} /></span>
    <strong>{title}</strong>
    <p>{copy}</p>
  </div>;
const TraceabilityCell = ({
  title,
  subtitle
}) => <div>
    <strong>{title}</strong>
    {subtitle && <span>{subtitle}</span>}
  </div>;
const BatchStatus = ({
  expiresAt
}) => {
  const remainingDays = daysUntil(expiresAt);
  if (remainingDays === null) {
    return <SellerPill tone="neutral">Tracked</SellerPill>;
  }
  if (remainingDays < 0) {
    return <SellerPill tone="danger">Expired</SellerPill>;
  }
  if (remainingDays <= 30) {
    return <SellerPill tone="warn">Near Expiry</SellerPill>;
  }
  return <SellerPill tone="neutral">Tracked</SellerPill>;
};
const BatchTrackingTable = ({
  rows,
  search,
  setSearch,
  perPage,
  setPerPage
}) => {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showColumns, setShowColumns] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState({
    key: 'productName',
    direction: 'asc'
  });
  const [visibleColumns, setVisibleColumns] = useState({
    batchNo: true,
    supplier: true,
    balanceQty: true,
    expiryDate: true,
    daysToExpiry: true,
    status: true
  });
  const [filtersDraft, setFiltersDraft] = useState({
    status: 'all',
    expiryWindow: 'all',
    startDate: '',
    endDate: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'all',
    expiryWindow: 'all',
    startDate: '',
    endDate: ''
  });
  const columnPanelRef = useRef(null);
  const columnTemplate = ['42px', 'minmax(0, 1.35fr)', visibleColumns.batchNo ? 'minmax(0, 0.95fr)' : null, visibleColumns.supplier ? 'minmax(0, 0.9fr)' : null, visibleColumns.balanceQty ? '90px' : null, visibleColumns.expiryDate ? '110px' : null, visibleColumns.daysToExpiry ? '100px' : null, visibleColumns.status ? '120px' : null, '96px'].filter(Boolean).join(' ');
  const renderBatchSortHeader = (key, label, className) => <SellerSortHeader active={sort.key === key} direction={sort.direction} className={`gap-1 ${className || ''}`} onClick={() => setSort(current => getNextSort(current, key))}>
      {label}
    </SellerSortHeader>;
  useEffect(() => {
    const handlePointerDown = event => {
      if (columnPanelRef.current && !columnPanelRef.current.contains(event.target)) {
        setShowColumns(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);
  const activeFilterCount = Object.values(appliedFilters).filter(value => value && value !== 'all').length;
  const columnLabels = {
    batchNo: 'Batch No',
    supplier: 'Supplier',
    balanceQty: 'Balance Qty',
    expiryDate: 'Expiry Date',
    daysToExpiry: 'Days To Expiry',
    status: 'Status'
  };
  const filteredRows = useMemo(() => rows.filter(row => {
    const remainingDays = daysUntil(row.expires_at);
    const statusValue = remainingDays === null ? 'tracked' : remainingDays < 0 ? 'expired' : remainingDays <= 30 ? 'near_expiry' : 'tracked';
    const matchesStatus = appliedFilters.status === 'all' || appliedFilters.status === statusValue;
    const matchesStartDate = !appliedFilters.startDate || row.expires_at && row.expires_at >= appliedFilters.startDate;
    const matchesEndDate = !appliedFilters.endDate || row.expires_at && row.expires_at <= appliedFilters.endDate;
    let matchesExpiryWindow = true;
    if (appliedFilters.expiryWindow === 'expired') {
      matchesExpiryWindow = remainingDays !== null && remainingDays < 0;
    } else if (appliedFilters.expiryWindow === '7days') {
      matchesExpiryWindow = remainingDays !== null && remainingDays >= 0 && remainingDays <= 7;
    } else if (appliedFilters.expiryWindow === '30days') {
      matchesExpiryWindow = remainingDays !== null && remainingDays >= 0 && remainingDays <= 30;
    } else if (appliedFilters.expiryWindow === 'future') {
      matchesExpiryWindow = remainingDays !== null && remainingDays > 30;
    }
    return matchesStatus && matchesStartDate && matchesEndDate && matchesExpiryWindow;
  }), [appliedFilters, rows]);
  const exportRows = useCallback(() => {
    const headers = ['Product Name', 'SKU', 'Batch No', 'Supplier', 'Balance Qty', 'Expiry Date', 'Days To Expiry', 'Status'];
    const csvRows = filteredRows.map(row => {
      const remainingDays = daysUntil(row.expires_at);
      const statusValue = remainingDays === null ? 'Tracked' : remainingDays < 0 ? 'Expired' : remainingDays <= 30 ? 'Near Expiry' : 'Tracked';
      return [
        row.product?.name || 'Unknown Product',
        row.product?.sku || row.product?.mystore_product_id || '',
        row.batch_no || '-',
        row.product?.brand?.name || '-',
        number(row.quantity || 0),
        dateLabel(row.expires_at),
        remainingDays === null ? '-' : String(remainingDays),
        statusValue
      ];
    });
    const csv = [headers, ...csvRows].map(columns => columns.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `batch-tracking-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [filteredRows]);
  const sortedRows = useMemo(() => sortRows(filteredRows, sort, {
    productName: row => row.product?.name,
    batchNo: row => row.batch_no,
    supplier: row => row.product?.brand?.name,
    balanceQty: row => row.quantity,
    expiryDate: row => row.expires_at,
    daysToExpiry: row => daysUntil(row.expires_at),
    status: row => daysUntil(row.expires_at)
  }), [filteredRows, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / perPage));
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const visibleRows = sortedRows.slice((currentPage - 1) * perPage, currentPage * perPage);
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, search, appliedFilters]);
  useEffect(() => {
    setCurrentPage(current => Math.min(current, totalPages));
  }, [totalPages]);
  const clearFilters = () => {
    const cleared = {
      status: 'all',
      expiryWindow: 'all',
      startDate: '',
      endDate: ''
    };
    setFiltersDraft(cleared);
    setAppliedFilters(cleared);
  };
  const resetVisibleColumns = () => setVisibleColumns({
    batchNo: true,
    supplier: true,
    balanceQty: true,
    expiryDate: true,
    daysToExpiry: true,
    status: true
  });
  return <>
    <TraceabilityHeader title="Batch Tracking" subtitle="Trace batch-level stock with supplier, expiry, and quantity visibility" onExport={exportRows} summary={<>
          <SummaryPill icon={Package} label="Total Batches" value={number(rows.length)} />
          <SummaryPill icon={AlertTriangle} label="Expired Batches" value={number(rows.filter(row => (daysUntil(row.expires_at) ?? 1) < 0).length)} tone="red" />
          <SummaryPill icon={AlertTriangle} label="Near Expiry Batches" value={number(rows.filter(row => {
        const remainingDays = daysUntil(row.expires_at);
        return remainingDays !== null && remainingDays >= 0 && remainingDays <= 30;
      }).length)} tone="amber" />
          <SummaryPill icon={CheckCircle2} label="Tracked Quantity" value={number(rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0))} tone="purple" />
        </>} exportLabel="Export" />

    <div className="space-y-6">
      <SellerTableSurface>
        <div className="flex flex-col gap-4 border-b border-neutral-200 bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
          <label className="flex min-h-12 w-full items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 xl:max-w-[560px] xl:flex-1">
            <Search size={17} />
            <input className="w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400" type="text" placeholder="Search batch, product, or supplier..." value={search} onChange={event => setSearch(event.target.value)} />
          </label>

          <div className="flex flex-wrap gap-3 xl:ml-auto">
            <div className="relative" ref={columnPanelRef}>
              <Button type="button" variant="outline" onClick={() => {
              setShowColumns(current => !current);
              setShowFilters(false);
            }}>
                <Columns3 size={14} />
                Manage Columns
              </Button>
              {showColumns && <div className="absolute left-0 top-[calc(100%+0.75rem)] z-20 w-64 border border-neutral-200 bg-white p-4">
                  {Object.entries(columnLabels).map(([key, label]) => <label key={key} className="mt-3 flex items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 first:mt-0">
                      <input type="checkbox" checked={visibleColumns[key]} onChange={event => setVisibleColumns(current => ({
                  ...current,
                  [key]: event.target.checked
                }))} className="h-4 w-4 accent-neutral-950" />
                      <span>{label}</span>
                    </label>)}
                  <div className="mt-4 flex gap-3">
                    <Button type="button" variant="outline" onClick={resetVisibleColumns}>
                      Reset
                    </Button>
                    <Button type="button" variant="primary" onClick={() => setShowColumns(false)}>
                      Close
                    </Button>
                  </div>
                </div>}
            </div>
            <Button type="button" variant={showFilters || activeFilterCount > 0 ? 'primary' : 'outline'} onClick={() => {
            setFiltersDraft(appliedFilters);
            setShowFilters(true);
            setShowColumns(false);
          }}>
              <Filter size={14} />
              Filters
              {activeFilterCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center border border-neutral-950 bg-neutral-950 px-1 text-[10px] font-semibold text-white">{activeFilterCount}</span>}
            </Button>
          </div>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <SellerGridHead style={{
          gridTemplateColumns: columnTemplate
        }}>
            <SellerGridCell>#</SellerGridCell>
            {renderBatchSortHeader('productName', 'Product Name', 'justify-start')}
            {visibleColumns.batchNo && renderBatchSortHeader('batchNo', 'Batch No', 'justify-start')}
            {visibleColumns.supplier && renderBatchSortHeader('supplier', 'Supplier', 'justify-start')}
            {visibleColumns.balanceQty && renderBatchSortHeader('balanceQty', 'Balance Qty', 'justify-center')}
            {visibleColumns.expiryDate && renderBatchSortHeader('expiryDate', 'Expiry Date', 'justify-center')}
            {visibleColumns.daysToExpiry && renderBatchSortHeader('daysToExpiry', 'Days To Expiry', 'justify-center')}
            {visibleColumns.status && renderBatchSortHeader('status', 'Status', 'justify-center')}
            <SellerGridCell className="text-center">Actions</SellerGridCell>
          </SellerGridHead>

          <SellerGridBody>
            {visibleRows.map((row, index) => {
            const remainingDays = daysUntil(row.expires_at);
            return <SellerGridRow key={row.id} style={{
              gridTemplateColumns: columnTemplate
            }}>
                  <SellerGridCell className="text-sm font-medium text-neutral-500">{(currentPage - 1) * perPage + index + 1}</SellerGridCell>
                  <SellerGridCell className="flex min-w-0 items-center gap-3">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-100 text-sm font-semibold uppercase text-neutral-950">BT</div>
                    <div className="min-w-0">
                      <strong className="block truncate text-sm font-semibold text-neutral-950">{row.product?.name || 'Unknown Product'}</strong>
                      <span className="mt-1 block truncate text-xs text-neutral-500">{row.product?.sku || row.product?.mystore_product_id || ''}</span>
                    </div>
                  </SellerGridCell>
                  {visibleColumns.batchNo && <SellerGridCell className="break-words text-sm text-neutral-700">{row.batch_no || '-'}</SellerGridCell>}
                  {visibleColumns.supplier && <SellerGridCell className="break-words text-sm text-neutral-700">{row.product?.brand?.name || '-'}</SellerGridCell>}
                  {visibleColumns.balanceQty && <SellerGridCell className="text-center text-sm font-semibold text-neutral-950">{number(row.quantity || 0)}</SellerGridCell>}
                  {visibleColumns.expiryDate && <SellerGridCell className="text-center text-sm text-neutral-700">{dateLabel(row.expires_at)}</SellerGridCell>}
                  {visibleColumns.daysToExpiry && <SellerGridCell className="text-center text-sm text-neutral-700">{remainingDays === null ? '-' : remainingDays}</SellerGridCell>}
                  {visibleColumns.status && <SellerGridCell className="flex justify-center">
                    <BatchStatus expiresAt={row.expires_at} />
                  </SellerGridCell>}
                  <SellerGridCell>
                    <div className="flex justify-center">
                      <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedBatch(row)} aria-label={`View batch ${row.batch_no || row.id}`} title="View">
                        <Eye size={14} />
                      </button>
                    </div>
                  </SellerGridCell>
                </SellerGridRow>;
          })}
            {visibleRows.length === 0 && <SellerEmptyState className="m-4" title="No batch records found" description="No batches matched the selected product, status, or expiry state." />}
          </SellerGridBody>
        </div>

        <div className="space-y-4 border-t border-neutral-200 p-4 xl:hidden">
          {visibleRows.map(row => {
          const remainingDays = daysUntil(row.expires_at);
          return <article key={`batch-mobile-${row.id}`} className="border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="block truncate text-base font-semibold text-neutral-950">{row.product?.name || 'Unknown Product'}</strong>
                    <span className="mt-1 block truncate text-xs text-neutral-500">{row.batch_no || '-'}</span>
                  </div>
                  <BatchStatus expiresAt={row.expires_at} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Balance Qty</span>
                    <strong className="mt-2 block text-sm font-semibold text-neutral-950">{number(row.quantity || 0)}</strong>
                  </div>
                  <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Expiry Date</span>
                    <strong className="mt-2 block text-sm font-semibold text-neutral-950">{dateLabel(row.expires_at)}</strong>
                  </div>
                  <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Days To Expiry</span>
                    <strong className="mt-2 block text-sm font-semibold text-neutral-950">{remainingDays === null ? '-' : remainingDays}</strong>
                  </div>
                  <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Supplier</span>
                    <strong className="mt-2 block text-sm font-semibold text-neutral-950">{row.product?.brand?.name || '-'}</strong>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={() => setSelectedBatch(row)}>View</Button>
                </div>
              </article>;
        })}
          {visibleRows.length === 0 && <SellerEmptyState title="No batch records found" description="No batches matched the selected product, status, or expiry state." />}
        </div>
      </SellerTableSurface>

      <SellerPaginationCard>
        <SellerTablePaginationBar showBorder={false} className="bg-transparent px-0 pb-0 pt-0" summary={`Showing ${filteredRows.length ? (currentPage - 1) * perPage + 1 : 0} to ${Math.min(currentPage * perPage, filteredRows.length)} of ${filteredRows.length} results`} currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} onPageChange={setCurrentPage} perPage={perPage} onPerPageChange={event => {
        setPerPage(Number(event.target.value));
        setCurrentPage(1);
      }} />
      </SellerPaginationCard>

      {showFilters && <SellerModalBackdrop onClose={() => setShowFilters(false)}>
          <SellerModalCard className="max-w-3xl bg-white" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Batch Filters</span>
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Filter Batch Tracking</h3>
                  <p className="text-sm leading-6 text-neutral-500">Refine batches by tracking status, expiry window, and expiry date range.</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setShowFilters(false)} aria-label="Close batch filters">
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                  <SellerSelect className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none" value={filtersDraft.status} onChange={event => setFiltersDraft(current => ({
                ...current,
                status: event.target.value
              }))}>
                    <option value="all">All Statuses</option>
                    <option value="tracked">Tracked</option>
                    <option value="near_expiry">Near Expiry</option>
                    <option value="expired">Expired</option>
                  </SellerSelect>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Expiry Window</span>
                  <SellerSelect className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none" value={filtersDraft.expiryWindow} onChange={event => setFiltersDraft(current => ({
                ...current,
                expiryWindow: event.target.value
              }))}>
                    <option value="all">All Batches</option>
                    <option value="expired">Expired</option>
                    <option value="7days">Next 7 Days</option>
                    <option value="30days">Next 30 Days</option>
                    <option value="future">Future</option>
                  </SellerSelect>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Expiry From</span>
                  <input className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none" type="date" value={filtersDraft.startDate} onChange={event => setFiltersDraft(current => ({
                ...current,
                startDate: event.target.value
              }))} />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Expiry To</span>
                  <input className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none" type="date" value={filtersDraft.endDate} onChange={event => setFiltersDraft(current => ({
                ...current,
                endDate: event.target.value
              }))} />
                </label>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
                <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              clearFilters();
              setShowFilters(false);
            }}>
                  Clear
                </Button>
                <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              setAppliedFilters(filtersDraft);
              setCurrentPage(1);
              setShowFilters(false);
            }}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}
    </div>

      {selectedBatch && <SellerModalBackdrop onClose={() => setSelectedBatch(null)}>
          <SellerModalCard className="hidden max-w-3xl bg-white lg:block" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Batch Preview</span>
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{selectedBatch.product?.name || 'Unknown Product'}</h3>
                  <p className="text-sm leading-6 text-neutral-500">{selectedBatch.batch_no || '-'}</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedBatch(null)} aria-label="Close batch preview">
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{selectedBatch.batch_no || '-'}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Batch No</span>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{number(selectedBatch.quantity || 0)}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Balance Qty</span>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{dateLabel(selectedBatch.expires_at)}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Expiry Date</span>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{String(daysUntil(selectedBatch.expires_at) ?? '-')}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Days To Expiry</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Supplier</span>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{selectedBatch.product?.brand?.name || '-'}</p>
                </div>
                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{daysUntil(selectedBatch.expires_at) === null ? 'Tracked' : daysUntil(selectedBatch.expires_at) < 0 ? 'Expired' : daysUntil(selectedBatch.expires_at) <= 30 ? 'Near Expiry' : 'Tracked'}</p>
                </div>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}

      <div className="lg:hidden">
        <SellerMobileDetailSheet open={Boolean(selectedBatch)} title={selectedBatch?.product?.name || ''} subtitle={selectedBatch?.batch_no || ''} onClose={() => setSelectedBatch(null)} items={selectedBatch ? [{
      label: 'Batch No',
      value: selectedBatch.batch_no || '-'
    }, {
      label: 'Supplier',
      value: selectedBatch.product?.brand?.name || '-'
    }, {
      label: 'Balance Qty',
      value: number(selectedBatch.quantity || 0)
    }, {
      label: 'Expiry Date',
      value: dateLabel(selectedBatch.expires_at)
    }, {
      label: 'Days To Expiry',
      value: String(daysUntil(selectedBatch.expires_at) ?? '-')
    }, {
      label: 'Status',
      value: daysUntil(selectedBatch.expires_at) === null ? 'Tracked' : daysUntil(selectedBatch.expires_at) < 0 ? 'Expired' : daysUntil(selectedBatch.expires_at) <= 30 ? 'Near Expiry' : 'Tracked'
    }] : []} />
      </div>
    </>;
};
const SerialTrackingTable = ({
  rows,
  search,
  setSearch,
  perPage,
  setPerPage
}) => {
  const [selectedSerial, setSelectedSerial] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState({
    key: 'serialNo',
    direction: 'asc'
  });
  const columnTemplate = ['42px', 'minmax(0, 1fr)', 'minmax(0, 1.3fr)', 'minmax(0, 0.95fr)', 'minmax(0, 0.85fr)', '100px', '120px', '100px', '96px'].join(' ');
  const renderSerialSortHeader = (key, label, className) => <SellerSortHeader active={sort.key === key} direction={sort.direction} className={`gap-1 ${className || ''}`} onClick={() => setSort(current => getNextSort(current, key))}>
      {label}
    </SellerSortHeader>;
  const sortedRows = useMemo(() => sortRows(rows, sort, {
    serialNo: row => row.serial_no,
    productName: row => row.product?.name,
    warehouse: row => row.warehouse?.name,
    batchNo: row => row.batch?.batch_no,
    status: row => row.status,
    warrantyState: () => 'Not Tracked',
    condition: row => row.warehouse?.name ? 'Assigned' : 'Pending'
  }), [rows, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / perPage));
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const visibleRows = sortedRows.slice((currentPage - 1) * perPage, currentPage * perPage);
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, search]);
  useEffect(() => {
    setCurrentPage(current => Math.min(current, totalPages));
  }, [totalPages]);
  const statusToneValue = status => String(status || 'active').toLowerCase() === 'returned' ? 'danger' : 'success';
  const conditionValue = row => row.warehouse?.name ? 'Assigned' : 'Pending';
  return <>
    <TraceabilityHeader title="Serial Tracking" subtitle="Trace item-level stock with serial numbers, warehouse assignment, and status visibility" summary={<>
          <SummaryPill icon={Package} label="Total Serials" value={number(rows.length)} />
          <SummaryPill icon={AlertTriangle} label="Returned Serials" value={number(rows.filter(row => String(row.status || '').toLowerCase() === 'returned').length)} tone="red" />
          <SummaryPill icon={ScanBarcode} label="Unassigned Serials" value={number(rows.filter(row => !row.warehouse?.name).length)} tone="amber" />
          <SummaryPill icon={CheckCircle2} label="Active Quantity" value={number(rows.filter(row => String(row.status || 'active').toLowerCase() !== 'returned').length)} tone="purple" />
        </>} exportLabel="Export" />

    <div className="space-y-6">
      <SellerTableSurface>
        <div className="flex flex-col gap-4 border-b border-neutral-200 bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
          <label className="flex min-h-12 w-full items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 xl:max-w-[560px] xl:flex-1">
            <Search size={17} />
            <input className="w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400" type="text" placeholder="Search serial, product, or warehouse..." value={search} onChange={event => setSearch(event.target.value)} />
          </label>

          <div className="flex flex-wrap gap-3 xl:ml-auto">
            <Button type="button" variant="outline">
              <Columns3 size={14} />
              Manage Columns
            </Button>
            <Button type="button" variant="outline">
              <Filter size={14} />
              Filters
            </Button>
          </div>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <SellerGridHead style={{
          gridTemplateColumns: columnTemplate
        }}>
            <SellerGridCell>#</SellerGridCell>
            {renderSerialSortHeader('serialNo', 'Serial No', 'justify-start')}
            {renderSerialSortHeader('productName', 'Product Name', 'justify-start')}
            {renderSerialSortHeader('warehouse', 'Warehouse', 'justify-start')}
            {renderSerialSortHeader('batchNo', 'Batch No', 'justify-start')}
            {renderSerialSortHeader('status', 'Status', 'justify-center')}
            {renderSerialSortHeader('warrantyState', 'Warranty State', 'justify-center')}
            {renderSerialSortHeader('condition', 'Condition', 'justify-center')}
            <SellerGridCell className="text-center">Actions</SellerGridCell>
          </SellerGridHead>

          <SellerGridBody>
            {visibleRows.map((row, index) => <SellerGridRow key={row.id} style={{
            gridTemplateColumns: columnTemplate
          }}>
                <SellerGridCell className="text-sm font-medium text-neutral-500">{(currentPage - 1) * perPage + index + 1}</SellerGridCell>
                <SellerGridCell className="break-words text-sm font-semibold text-neutral-950">{row.serial_no || '-'}</SellerGridCell>
                <SellerGridCell className="flex min-w-0 items-center gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-100 text-sm font-semibold uppercase text-neutral-950">SR</div>
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-semibold text-neutral-950">{row.product?.name || 'Unknown Product'}</strong>
                    <span className="mt-1 block truncate text-xs text-neutral-500">{row.product?.sku || row.product?.mystore_product_id || ''}</span>
                  </div>
                </SellerGridCell>
                <SellerGridCell className="break-words text-sm text-neutral-700">{row.warehouse?.name || '-'}</SellerGridCell>
                <SellerGridCell className="break-words text-sm text-neutral-700">{row.batch?.batch_no || '-'}</SellerGridCell>
                <SellerGridCell className="flex justify-center">
                  <SellerPill tone={statusToneValue(row.status)}>
                    {titleCase(row.status || 'active')}
                  </SellerPill>
                </SellerGridCell>
                <SellerGridCell className="flex justify-center">
                  <SellerPill tone="neutral">Not Tracked</SellerPill>
                </SellerGridCell>
                <SellerGridCell className="flex justify-center">
                  <SellerPill tone={row.warehouse?.name ? 'success' : 'warn'}>
                    {conditionValue(row)}
                  </SellerPill>
                </SellerGridCell>
                <SellerGridCell>
                  <div className="flex justify-center">
                    <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedSerial(row)} aria-label={`View serial ${row.serial_no || row.id}`} title="View">
                      <Eye size={14} />
                    </button>
                  </div>
                </SellerGridCell>
              </SellerGridRow>)}
            {visibleRows.length === 0 && <SellerEmptyState className="m-4" title="No serial records found" description="No serials matched the selected product, status, or warehouse filters." />}
          </SellerGridBody>
        </div>

        <div className="space-y-4 border-t border-neutral-200 p-4 xl:hidden">
          {visibleRows.map(row => <article key={`serial-mobile-${row.id}`} className="border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block truncate text-base font-semibold text-neutral-950">{row.serial_no || '-'}</strong>
                  <span className="mt-1 block truncate text-xs text-neutral-500">{row.product?.name || 'Unknown Product'}</span>
                </div>
                <SellerPill tone={statusToneValue(row.status)}>
                  {titleCase(row.status || 'active')}
                </SellerPill>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Warehouse</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">{row.warehouse?.name || '-'}</strong>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Batch No</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">{row.batch?.batch_no || '-'}</strong>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Condition</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">{conditionValue(row)}</strong>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Warranty State</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">Not Tracked</strong>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => setSelectedSerial(row)}>View</Button>
              </div>
            </article>)}
          {visibleRows.length === 0 && <SellerEmptyState title="No serial records found" description="No serials matched the selected product, status, or warehouse filters." />}
        </div>
      </SellerTableSurface>

      <SellerPaginationCard>
        <SellerTablePaginationBar showBorder={false} className="bg-transparent px-0 pb-0 pt-0" summary={`Showing ${rows.length ? (currentPage - 1) * perPage + 1 : 0} to ${Math.min(currentPage * perPage, rows.length)} of ${rows.length} results`} currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} onPageChange={setCurrentPage} perPage={perPage} onPerPageChange={event => {
        setPerPage(Number(event.target.value));
        setCurrentPage(1);
      }} />
      </SellerPaginationCard>
    </div>

      <SellerMobileDetailSheet open={Boolean(selectedSerial)} title={selectedSerial?.serial_no || ''} subtitle={selectedSerial?.product?.name || ''} onClose={() => setSelectedSerial(null)} items={selectedSerial ? [{
      label: 'Product',
      value: selectedSerial.product?.name || 'Unknown Product',
      hint: selectedSerial.product?.sku || selectedSerial.product?.mystore_product_id || ''
    }, {
      label: 'Warehouse',
      value: selectedSerial.warehouse?.name || '-'
    }, {
      label: 'Batch No',
      value: selectedSerial.batch?.batch_no || '-'
    }, {
      label: 'Status',
      value: titleCase(selectedSerial.status || 'active')
    }, {
      label: 'Warranty State',
      value: 'Not Tracked'
    }, {
      label: 'Condition',
      value: selectedSerial.warehouse?.name ? 'Assigned' : 'Pending'
    }] : []} />
    </>;
};
const ExpiryTrackingTable = ({
  rows,
  search,
  setSearch,
  perPage,
  setPerPage
}) => {
  const [showColumns, setShowColumns] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExpiryRow, setSelectedExpiryRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState({
    key: 'expiryDate',
    direction: 'asc'
  });
  const [visibleColumns, setVisibleColumns] = useState({
    batchNo: true,
    productName: true,
    expiryDate: true,
    daysToExpiry: true,
    balanceQty: true,
    status: true
  });
  const [filtersDraft, setFiltersDraft] = useState({
    status: 'all',
    expiryWindow: 'all',
    startDate: '',
    endDate: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'all',
    expiryWindow: 'all',
    startDate: '',
    endDate: ''
  });
  const columnPanelRef = useRef(null);
  const columnTemplate = ['42px', visibleColumns.batchNo ? 'minmax(0, 0.95fr)' : null, visibleColumns.productName ? 'minmax(0, 1.35fr)' : null, visibleColumns.expiryDate ? '124px' : null, visibleColumns.daysToExpiry ? '124px' : null, visibleColumns.balanceQty ? '108px' : null, visibleColumns.status ? '120px' : null, '96px'].filter(Boolean).join(' ');
  const renderExpirySortHeader = (key, label, className) => <SellerSortHeader active={sort.key === key} direction={sort.direction} className={`gap-1 ${className || ''}`} onClick={() => setSort(current => getNextSort(current, key))}>
      {label}
    </SellerSortHeader>;
  useEffect(() => {
    const handlePointerDown = event => {
      if (columnPanelRef.current && !columnPanelRef.current.contains(event.target)) {
        setShowColumns(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);
  const activeFilterCount = Object.values(appliedFilters).filter(value => value && value !== 'all').length;
  const columnLabels = {
    batchNo: 'Batch No',
    productName: 'Product Name',
    expiryDate: 'Expiry Date',
    daysToExpiry: 'Days To Expiry',
    balanceQty: 'Balance Qty',
    status: 'Status'
  };
  const filteredRows = useMemo(() => rows.filter(row => {
    const remainingDays = daysUntil(row.expires_at);
    const statusValue = remainingDays === null ? 'tracked' : remainingDays < 0 ? 'expired' : remainingDays <= 30 ? 'near_expiry' : 'tracked';
    const matchesStatus = appliedFilters.status === 'all' || appliedFilters.status === statusValue;
    const matchesStartDate = !appliedFilters.startDate || row.expires_at && row.expires_at >= appliedFilters.startDate;
    const matchesEndDate = !appliedFilters.endDate || row.expires_at && row.expires_at <= appliedFilters.endDate;
    let matchesWindow = true;
    if (appliedFilters.expiryWindow === 'expired') {
      matchesWindow = remainingDays !== null && remainingDays < 0;
    } else if (appliedFilters.expiryWindow === '7days') {
      matchesWindow = remainingDays !== null && remainingDays >= 0 && remainingDays <= 7;
    } else if (appliedFilters.expiryWindow === '30days') {
      matchesWindow = remainingDays !== null && remainingDays >= 0 && remainingDays <= 30;
    } else if (appliedFilters.expiryWindow === 'future') {
      matchesWindow = remainingDays !== null && remainingDays > 30;
    }
    return matchesStatus && matchesStartDate && matchesEndDate && matchesWindow;
  }), [appliedFilters, rows]);
  const exportRows = useCallback(() => {
    const headers = ['Batch No', 'Product Name', 'SKU', 'Expiry Date', 'Days To Expiry', 'Balance Qty', 'Status'];
    const csvRows = filteredRows.map(row => {
      const remainingDays = daysUntil(row.expires_at);
      const statusValue = remainingDays === null ? 'Tracked' : remainingDays < 0 ? 'Expired' : remainingDays <= 30 ? 'Near Expiry' : 'Tracked';
      return [
        row.batch_no || '-',
        row.product?.name || 'Unknown Product',
        row.product?.sku || row.product?.mystore_product_id || '',
        dateLabel(row.expires_at),
        remainingDays === null ? '-' : String(remainingDays),
        number(row.quantity || 0),
        statusValue
      ];
    });
    const csv = [headers, ...csvRows].map(columns => columns.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `expiry-tracking-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [filteredRows]);
  const sortedRows = useMemo(() => sortRows(filteredRows, sort, {
    batchNo: row => row.batch_no,
    productName: row => row.product?.name,
    expiryDate: row => row.expires_at,
    daysToExpiry: row => daysUntil(row.expires_at),
    balanceQty: row => row.quantity,
    status: row => daysUntil(row.expires_at)
  }), [filteredRows, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / perPage));
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const visibleRows = sortedRows.slice((currentPage - 1) * perPage, currentPage * perPage);
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters, perPage, search]);
  useEffect(() => {
    setCurrentPage(current => Math.min(current, totalPages));
  }, [totalPages]);
  const clearFilters = () => {
    const cleared = {
      status: 'all',
      expiryWindow: 'all',
      startDate: '',
      endDate: ''
    };
    setFiltersDraft(cleared);
    setAppliedFilters(cleared);
  };
  const resetVisibleColumns = () => setVisibleColumns({
    batchNo: true,
    productName: true,
    expiryDate: true,
    daysToExpiry: true,
    balanceQty: true,
    status: true
  });
  return <>
      <TraceabilityHeader title="Expiry Tracking" subtitle="Monitor expired and near-expiry batches before they block sellable stock" onExport={exportRows} summary={<>
            <SummaryPill icon={Calendar} label="Tracked Batches" value={number(filteredRows.length)} tone="gray" />
            <SummaryPill icon={AlertTriangle} label="Expired Batches" value={number(filteredRows.filter(row => (daysUntil(row.expires_at) ?? 1) < 0).length)} tone="red" />
            <SummaryPill icon={Calendar} label="Near Expiry Batches" value={number(filteredRows.filter(row => {
        const remainingDays = daysUntil(row.expires_at);
        return remainingDays !== null && remainingDays >= 0 && remainingDays <= 30;
      }).length)} tone="amber" />
            <SummaryPill icon={CheckCircle2} label="Expiring Quantity" value={number(filteredRows.filter(row => {
        const remainingDays = daysUntil(row.expires_at);
        return remainingDays !== null && remainingDays <= 30;
      }).reduce((sum, row) => sum + Number(row.quantity || 0), 0))} tone="purple" />
          </>} />

      <div className="space-y-6">
        <SellerTableSurface>
          <div className="flex flex-col gap-4 border-b border-neutral-200 bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
            <label className="flex min-h-12 w-full items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 xl:max-w-[560px] xl:flex-1">
              <Search size={17} />
              <input className="w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400" type="text" placeholder="Search batch or product..." value={search} onChange={event => setSearch(event.target.value)} />
            </label>

            <div className="flex flex-wrap gap-3 xl:ml-auto">
              <div className="relative" ref={columnPanelRef}>
                <Button type="button" variant="outline" onClick={() => {
                setShowColumns(current => !current);
                setShowFilters(false);
              }}>
                  <Columns3 size={14} />
                  Manage Columns
                </Button>
                {showColumns && <div className="absolute left-0 top-[calc(100%+0.75rem)] z-20 w-64 border border-neutral-200 bg-white p-4 shadow-sm">
                    {Object.entries(columnLabels).map(([key, label]) => <label key={key} className="mt-3 flex items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 first:mt-0">
                        <input type="checkbox" checked={visibleColumns[key]} onChange={event => setVisibleColumns(current => ({
                    ...current,
                    [key]: event.target.checked
                  }))} className="h-4 w-4 accent-neutral-950" />
                        <span>{label}</span>
                      </label>)}
                    <div className="mt-4 flex gap-3">
                      <Button type="button" variant="outline" onClick={resetVisibleColumns}>
                        Reset
                      </Button>
                      <Button type="button" variant="primary" onClick={() => setShowColumns(false)}>
                        Close
                      </Button>
                    </div>
                  </div>}
              </div>

              <Button type="button" variant={showFilters || activeFilterCount > 0 ? 'primary' : 'outline'} onClick={() => {
              setFiltersDraft(appliedFilters);
              setShowFilters(true);
              setShowColumns(false);
            }}>
                <Filter size={14} />
                Filters
                {activeFilterCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center border border-neutral-950 bg-neutral-950 px-1 text-[10px] font-semibold text-white">{activeFilterCount}</span>}
              </Button>
            </div>
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <SellerGridHead style={{
            gridTemplateColumns: columnTemplate
          }}>
              <SellerGridCell>#</SellerGridCell>
              {visibleColumns.batchNo && renderExpirySortHeader('batchNo', 'Batch No', 'justify-start')}
              {visibleColumns.productName && renderExpirySortHeader('productName', 'Product Name', 'justify-start')}
              {visibleColumns.expiryDate && renderExpirySortHeader('expiryDate', 'Expiry Date', 'justify-center')}
              {visibleColumns.daysToExpiry && renderExpirySortHeader('daysToExpiry', 'Days To Expiry', 'justify-center')}
              {visibleColumns.balanceQty && renderExpirySortHeader('balanceQty', 'Balance Qty', 'justify-center')}
              {visibleColumns.status && renderExpirySortHeader('status', 'Status', 'justify-center')}
              <SellerGridCell className="text-center">Actions</SellerGridCell>
            </SellerGridHead>

            <SellerGridBody>
              {visibleRows.map((row, index) => {
              const remainingDays = daysUntil(row.expires_at);
              return <SellerGridRow key={row.id} style={{
                gridTemplateColumns: columnTemplate
              }}>
                    <SellerGridCell className="text-sm font-medium text-neutral-500">{(currentPage - 1) * perPage + index + 1}</SellerGridCell>
                    {visibleColumns.batchNo && <SellerGridCell className="break-words text-sm text-neutral-700">{row.batch_no || '-'}</SellerGridCell>}
                    {visibleColumns.productName && <SellerGridCell className="flex min-w-0 items-center gap-3">
                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-100 text-sm font-semibold uppercase text-neutral-950">EX</div>
                        <div className="min-w-0">
                          <strong className="block truncate text-sm font-semibold text-neutral-950">{row.product?.name || 'Unknown Product'}</strong>
                          <span className="mt-1 block truncate text-xs text-neutral-500">{row.product?.sku || row.product?.mystore_product_id || ''}</span>
                        </div>
                      </SellerGridCell>}
                    {visibleColumns.expiryDate && <SellerGridCell className="text-center text-sm text-neutral-700">{dateLabel(row.expires_at)}</SellerGridCell>}
                    {visibleColumns.daysToExpiry && <SellerGridCell className="text-center text-sm text-neutral-700">{remainingDays === null ? '-' : remainingDays}</SellerGridCell>}
                    {visibleColumns.balanceQty && <SellerGridCell className="text-center text-sm font-semibold text-neutral-950">{number(row.quantity || 0)}</SellerGridCell>}
                    {visibleColumns.status && <SellerGridCell className="flex justify-center">
                        <BatchStatus expiresAt={row.expires_at} />
                      </SellerGridCell>}
                    <SellerGridCell>
                      <div className="flex justify-center">
                        <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedExpiryRow(row)} aria-label={`View expiry item ${row.batch_no || row.id}`} title="View">
                          <Eye size={14} />
                        </button>
                      </div>
                    </SellerGridCell>
                  </SellerGridRow>;
            })}
              {visibleRows.length === 0 && <SellerEmptyState className="m-4" title="No expiry-tracked batches found" description="No batches with expiry dates matched the selected filters." />}
            </SellerGridBody>
          </div>

          <div className="space-y-4 border-t border-neutral-200 p-4 xl:hidden">
            {visibleRows.map(row => {
            const remainingDays = daysUntil(row.expires_at);
            return <article key={`expiry-mobile-${row.id}`} className="border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-base font-semibold text-neutral-950">{row.batch_no || '-'}</strong>
                      <span className="mt-1 block truncate text-xs text-neutral-500">{row.product?.name || 'Unknown Product'}</span>
                    </div>
                    <BatchStatus expiresAt={row.expires_at} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Expiry Date</span>
                      <strong className="mt-2 block text-sm font-semibold text-neutral-950">{dateLabel(row.expires_at)}</strong>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Days To Expiry</span>
                      <strong className="mt-2 block text-sm font-semibold text-neutral-950">{remainingDays === null ? '-' : remainingDays}</strong>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Balance Qty</span>
                      <strong className="mt-2 block text-sm font-semibold text-neutral-950">{number(row.quantity || 0)}</strong>
                    </div>
                    <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Item Code</span>
                      <strong className="mt-2 block text-sm font-semibold text-neutral-950">{row.product?.sku || row.product?.mystore_product_id || '-'}</strong>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={() => setSelectedExpiryRow(row)}>View</Button>
                  </div>
                </article>;
          })}
            {visibleRows.length === 0 && <SellerEmptyState title="No expiry-tracked batches found" description="No batches with expiry dates matched the selected filters." />}
          </div>
        </SellerTableSurface>

        <SellerPaginationCard>
          <SellerTablePaginationBar showBorder={false} className="bg-transparent px-0 pb-0 pt-0" summary={`Showing ${filteredRows.length ? (currentPage - 1) * perPage + 1 : 0} to ${Math.min(currentPage * perPage, filteredRows.length)} of ${filteredRows.length} results`} currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} onPageChange={setCurrentPage} perPage={perPage} onPerPageChange={event => {
          setPerPage(Number(event.target.value));
          setCurrentPage(1);
        }} />
        </SellerPaginationCard>
      </div>

      {showFilters && <SellerModalBackdrop onClose={() => setShowFilters(false)}>
          <SellerModalCard className="max-w-3xl bg-white" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Expiry Filters</span>
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Filter Expiry Tracking</h3>
                  <p className="text-sm leading-6 text-neutral-500">Refine expiry-tracked batches by status, expiry window, and expiry date range.</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setShowFilters(false)} aria-label="Close expiry filters">
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                  <SellerSelect className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none" value={filtersDraft.status} onChange={event => setFiltersDraft(current => ({
                ...current,
                status: event.target.value
              }))}>
                    <option value="all">All Statuses</option>
                    <option value="tracked">Tracked</option>
                    <option value="near_expiry">Near Expiry</option>
                    <option value="expired">Expired</option>
                  </SellerSelect>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Expiry Window</span>
                  <SellerSelect className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none" value={filtersDraft.expiryWindow} onChange={event => setFiltersDraft(current => ({
                ...current,
                expiryWindow: event.target.value
              }))}>
                    <option value="all">All Batches</option>
                    <option value="expired">Expired</option>
                    <option value="7days">Next 7 Days</option>
                    <option value="30days">Next 30 Days</option>
                    <option value="future">Future</option>
                  </SellerSelect>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Expiry From</span>
                  <input className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none" type="date" value={filtersDraft.startDate} onChange={event => setFiltersDraft(current => ({
                ...current,
                startDate: event.target.value
              }))} />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Expiry To</span>
                  <input className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none" type="date" value={filtersDraft.endDate} onChange={event => setFiltersDraft(current => ({
                ...current,
                endDate: event.target.value
              }))} />
                </label>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
                <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              clearFilters();
              setCurrentPage(1);
              setShowFilters(false);
            }}>
                  Clear
                </Button>
                <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              setAppliedFilters(filtersDraft);
              setCurrentPage(1);
              setShowFilters(false);
            }}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}

      <SellerMobileDetailSheet open={Boolean(selectedExpiryRow)} title={selectedExpiryRow?.batch_no || ''} subtitle={selectedExpiryRow?.product?.name || ''} onClose={() => setSelectedExpiryRow(null)} items={selectedExpiryRow ? [{
      label: 'Product',
      value: selectedExpiryRow.product?.name || 'Unknown Product',
      hint: selectedExpiryRow.product?.sku || selectedExpiryRow.product?.mystore_product_id || ''
    }, {
      label: 'Expiry Date',
      value: dateLabel(selectedExpiryRow.expires_at)
    }, {
      label: 'Days To Expiry',
      value: String(daysUntil(selectedExpiryRow.expires_at) ?? '-')
    }, {
      label: 'Balance Qty',
      value: number(selectedExpiryRow.quantity || 0)
    }, {
      label: 'Status',
      value: daysUntil(selectedExpiryRow.expires_at) === null ? 'Tracked' : daysUntil(selectedExpiryRow.expires_at) < 0 ? 'Expired' : daysUntil(selectedExpiryRow.expires_at) <= 30 ? 'Near Expiry' : 'Tracked'
    }] : []} />
    </>;
};
const StockEntryTable = ({
  rows,
  search,
  setSearch,
  perPage,
  setPerPage,
  formatCurrency,
  onActionsChange,
  products = [],
  warehouses = []
}) => {
  const [showColumns, setShowColumns] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [statusOverrides, setStatusOverrides] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState({
    key: 'date',
    direction: 'desc'
  });
  const [visibleColumns, setVisibleColumns] = useState({
    warehouses: true,
    date: true,
    items: true,
    value: true,
    status: true
  });
  const [filtersDraft, setFiltersDraft] = useState({
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: ''
  });
  const columnPanelRef = useRef(null);
  const columnTemplate = ['42px', 'minmax(250px, 1.4fr)', visibleColumns.warehouses ? 'minmax(190px, 1fr)' : null, visibleColumns.date ? '120px' : null, visibleColumns.items ? '90px' : null, visibleColumns.value ? '120px' : null, visibleColumns.status ? '118px' : null, '118px'].filter(Boolean).join(' ');
  const renderEntrySortHeader = (key, label, className) => <SellerSortHeader active={sort.key === key} direction={sort.direction} className={`gap-1 ${className || ''}`} onClick={() => setSort(current => getNextSort(current, key))}>
      {label}
    </SellerSortHeader>;
  useEffect(() => {
    const handlePointerDown = event => {
      if (columnPanelRef.current && !columnPanelRef.current.contains(event.target)) {
        setShowColumns(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);
  const activeFilterCount = Object.values(appliedFilters).filter(value => value && value !== 'all').length;
  const columnLabels = {
    warehouses: 'Warehouses',
    date: 'Date',
    items: 'Items',
    value: 'Value',
    status: 'Status'
  };
  const enrichedRows = useMemo(() => rows.map(row => {
    const code = `${entryCodeFromType(row.type)}-${String(row.id).padStart(4, '0')}`;
    const fallbackStatus = row.quantity > 40 ? 'Submitted' : 'Draft';
    const status = statusOverrides[row.id] || fallbackStatus;
    const value = Number(row.quantity || 0) * Number(row.unit_cost || 0);
    return {
      ...row,
      code,
      entryDate: isoDate(row.created_at),
      entryLabel: titleCase(row.type),
      entryStatus: status,
      entryValue: value,
      warehouseName: row.to_warehouse?.name || row.from_warehouse?.name || '',
      warehousePrefix: row.to_warehouse?.name ? 'To' : row.from_warehouse?.name ? 'From' : '',
      itemCount: Math.abs(row.quantity || 0) > 0 ? 1 : 0
    };
  }), [rows, statusOverrides]);
  const filteredRows = useMemo(() => enrichedRows.filter(row => {
    const matchesType = appliedFilters.type === 'all' || row.type === appliedFilters.type;
    const matchesStatus = appliedFilters.status === 'all' || String(row.entryStatus).toLowerCase() === appliedFilters.status;
    const matchesStartDate = !appliedFilters.startDate || row.entryDate && row.entryDate >= appliedFilters.startDate;
    const matchesEndDate = !appliedFilters.endDate || row.entryDate && row.entryDate <= appliedFilters.endDate;
    return matchesType && matchesStatus && matchesStartDate && matchesEndDate;
  }), [appliedFilters, enrichedRows]);
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));
    setCurrentPage(current => Math.min(current, totalPages));
  }, [filteredRows.length, perPage]);
  const sortedRows = useMemo(() => sortRows(filteredRows, sort, {
    stockEntry: row => row.code,
    warehouses: row => row.warehouseName,
    date: row => row.created_at,
    items: row => row.itemCount,
    value: row => row.entryValue,
    status: row => row.entryStatus
  }), [filteredRows, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / perPage));
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const visibleRows = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedRows.slice(start, start + perPage);
  }, [currentPage, perPage, sortedRows]);
  const clearFilters = () => {
    const cleared = {
      type: 'all',
      status: 'all',
      startDate: '',
      endDate: ''
    };
    setFiltersDraft(cleared);
    setAppliedFilters(cleared);
  };
  const exportRows = useCallback(() => {
    const headers = ['Code', 'Entry Type', 'Warehouse', 'Date', 'Items', 'Value', 'Status'];
    const csvRows = sortedRows.map(row => [row.code, row.entryLabel, row.warehouseName ? `${row.warehousePrefix}: ${row.warehouseName}` : '', stockEntryDateLabel(row.created_at), number(row.itemCount), row.entryValue > 0 ? row.entryValue.toFixed(2) : '0.00', row.entryStatus]);
    const csv = [headers, ...csvRows].map(columns => columns.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `stock-entries-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [sortedRows]);
  useEffect(() => {
    if (!onActionsChange) return undefined;
    const actions = {
      openImport: () => setImportOpen(true),
      exportRows
    };
    onActionsChange(actions);
    return () => onActionsChange(null);
  }, [exportRows, onActionsChange]);
  const importRows = async file => {
    if (!file) return;
    setImporting(true);
    setImportError('');
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        throw new Error('CSV file is empty.');
      }
      const headers = parseCsvLine(lines[0]).map(header => header.toLowerCase());
      const headerIndex = key => headers.indexOf(key);
      const requiredHeaders = ['product_id', 'quantity', 'unit_cost', 'warehouse_id'];
      const missingHeaders = requiredHeaders.filter(header => headerIndex(header) === -1);
      if (missingHeaders.length) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }
      const entries = lines.slice(1).map(line => {
        const columns = parseCsvLine(line);
        const getValue = key => columns[headerIndex(key)] || '';
        return {
          product_id: Number(getValue('product_id')),
          quantity: Number(getValue('quantity')),
          unit_cost: Number(getValue('unit_cost') || 0),
          warehouse_id: Number(getValue('warehouse_id')),
          entry_type: getValue('entry_type') || 'opening_stock',
          posting_date: getValue('posting_date') || isoDate(new Date()),
          posting_time: getValue('posting_time') || '',
          remarks: getValue('remarks') || 'Imported stock entry'
        };
      }).filter(entry => entry.product_id && entry.quantity && entry.warehouse_id);
      if (!entries.length) {
        throw new Error('No valid stock-entry rows found in the file.');
      }
      await Promise.all(entries.map(entry => router.post('/inventory/stock-entries', {
        entry_type: entry.entry_type,
        posting_date: entry.posting_date,
        posting_time: entry.posting_time,
        to_warehouse_id: entry.warehouse_id,
        remarks: entry.remarks,
        items: [{
          product_id: entry.product_id,
          quantity: entry.quantity,
          unit_cost: entry.unit_cost,
          discount: 0,
          tax: 0
        }]
      }, {
        preserveScroll: true,
        preserveState: true,
        only: ['sellerInventorySnapshot', 'flash']
      })));
      setImportOpen(false);
    } catch (error) {
      setImportError(error.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };
  const handleCancelEntry = row => {
    if (!window.confirm(`Cancel ${row.code}?`)) return;
    setStatusOverrides(current => ({
      ...current,
      [row.id]: 'Cancelled'
    }));
  };
  return <div className="space-y-6">
    <SellerTableSurface>
      <div className="flex flex-col gap-4 border-b border-neutral-200 bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
        <label className="flex min-h-12 w-full items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 xl:max-w-[560px] xl:flex-1">
          <Search size={17} />
          <input className="w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400" type="text" placeholder="Search entries..." value={search} onChange={event => setSearch(event.target.value)} />
        </label>

        <div className="flex flex-wrap gap-3 xl:ml-auto">
          <div className="relative" ref={columnPanelRef}>
            <Button type="button" variant="outline" onClick={() => {
            setShowColumns(current => !current);
            setShowFilters(false);
          }}>
              <Columns3 size={14} />
              Manage Columns
            </Button>
            {showColumns && <div className="absolute left-0 top-[calc(100%+0.75rem)] z-20 w-64 border border-neutral-200 bg-white p-4 shadow-sm">
                {Object.entries(columnLabels).map(([key, label]) => <label key={key} className="mt-3 flex items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 first:mt-0">
                    <input type="checkbox" checked={visibleColumns[key]} onChange={event => setVisibleColumns(current => ({
                ...current,
                [key]: event.target.checked
              }))} className="h-4 w-4 accent-neutral-950" />
                    <span>{label}</span>
                  </label>)}
              </div>}
          </div>

          <Button type="button" variant={showFilters || activeFilterCount > 0 ? 'primary' : 'outline'} onClick={() => {
          setFiltersDraft(appliedFilters);
          setShowFilters(true);
          setShowColumns(false);
        }}>
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center border border-neutral-950 bg-neutral-950 px-1 text-[10px] font-semibold text-white">{activeFilterCount}</span>}
          </Button>
        </div>
      </div>

      <div className="hidden xl:block">
        <SellerGridHead style={{
        gridTemplateColumns: columnTemplate
      }}>
          <SellerGridCell>#</SellerGridCell>
          {renderEntrySortHeader('stockEntry', 'Stock Entry', 'justify-start')}
          {visibleColumns.warehouses && renderEntrySortHeader('warehouses', 'Warehouses', 'justify-start')}
          {visibleColumns.date && renderEntrySortHeader('date', 'Date', 'justify-center')}
          {visibleColumns.items && renderEntrySortHeader('items', 'Items', 'justify-center')}
          {visibleColumns.value && renderEntrySortHeader('value', 'Value', 'justify-center')}
          {visibleColumns.status && renderEntrySortHeader('status', 'Status', 'justify-center')}
          <SellerGridCell className="text-center">Actions</SellerGridCell>
        </SellerGridHead>

        <SellerGridBody>
          {visibleRows.map((row, index) => <SellerGridRow key={row.id} style={{
          gridTemplateColumns: columnTemplate
        }}>
              <SellerGridCell className="text-sm font-medium text-neutral-500">{(currentPage - 1) * perPage + index + 1}</SellerGridCell>
              <SellerGridCell className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-100 text-sm font-semibold uppercase text-neutral-950">{row.code.slice(0, 2)}</div>
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-semibold text-neutral-950">{row.code}</strong>
                  <span className="mt-1 block truncate text-xs text-neutral-500">{row.entryLabel}</span>
                </div>
              </SellerGridCell>
              {visibleColumns.warehouses && <SellerGridCell className="text-sm text-neutral-700">{row.warehouseName ? `${row.warehousePrefix}: ${row.warehouseName}` : '-'}</SellerGridCell>}
              {visibleColumns.date && <SellerGridCell className="text-center text-sm text-neutral-700">{stockEntryDateLabel(row.created_at)}</SellerGridCell>}
              {visibleColumns.items && <SellerGridCell className="text-center text-sm text-neutral-700">{number(row.itemCount)}</SellerGridCell>}
              {visibleColumns.value && <SellerGridCell className="text-center text-sm text-neutral-700">{row.entryValue > 0 ? `+${formatCurrency(row.entryValue)}` : '-'}</SellerGridCell>}
              {visibleColumns.status && <SellerGridCell className="flex justify-center">
                  <SellerPill tone={statusTone(row.entryStatus) === 'red' ? 'danger' : statusTone(row.entryStatus) === 'gray' ? 'neutral' : 'success'}>
                    {row.entryStatus}
                  </SellerPill>
                </SellerGridCell>}
              <SellerGridCell>
                <div className="flex justify-center">
                  <div className="grid w-full max-w-[5.5rem] grid-cols-2 gap-2">
                    <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedEntry(row)} aria-label={`View ${row.code}`} title="View">
                      <Eye size={14} />
                    </button>
                    <button className="inline-flex h-9 w-9 items-center justify-center border border-rose-500 bg-white text-rose-600 transition hover:bg-neutral-100" type="button" onClick={() => handleCancelEntry(row)} aria-label={`Cancel ${row.code}`} title="Cancel">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </SellerGridCell>
            </SellerGridRow>)}
          {visibleRows.length === 0 && <SellerEmptyState className="m-4" title="No stock entries found" description="Entries will appear here once inward stock activity is recorded." />}
        </SellerGridBody>
      </div>

      <div className="space-y-4 border-t border-neutral-200 p-4 xl:hidden">
        {visibleRows.map(row => <article key={`entry-mobile-${row.id}`} className="border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block truncate text-base font-semibold text-neutral-950">{row.code}</strong>
                <span className="mt-1 block truncate text-xs text-neutral-500">{row.entryLabel}</span>
              </div>
              <SellerPill tone={statusTone(row.entryStatus) === 'red' ? 'danger' : statusTone(row.entryStatus) === 'gray' ? 'neutral' : 'success'}>
                {row.entryStatus}
              </SellerPill>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Date</span>
                <strong className="mt-2 block text-sm font-semibold text-neutral-950">{stockEntryDateLabel(row.created_at)}</strong>
              </div>
              <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Items</span>
                <strong className="mt-2 block text-sm font-semibold text-neutral-950">{number(row.itemCount)}</strong>
              </div>
              <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Value</span>
                <strong className="mt-2 block text-sm font-semibold text-neutral-950">{row.entryValue > 0 ? `+${formatCurrency(row.entryValue)}` : '-'}</strong>
              </div>
              <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Warehouse</span>
                <strong className="mt-2 block text-sm font-semibold text-neutral-950">{row.warehouseName ? `${row.warehousePrefix}: ${row.warehouseName}` : '-'}</strong>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => setSelectedEntry(row)}>View</Button>
              <Button type="button" variant="primary" onClick={() => handleCancelEntry(row)}>Cancel</Button>
            </div>
          </article>)}
        {visibleRows.length === 0 && <SellerEmptyState title="No stock entries found" description="Entries will appear here once inward stock activity is recorded." />}
      </div>

      {showFilters && <SellerModalBackdrop onClose={() => setShowFilters(false)}>
          <SellerModalCard className="max-w-xl bg-white" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Stock Entry Filters</span>
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-neutral-950" />
                    <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Filter Stock Entries</h3>
                  </div>
                  <p className="text-sm leading-6 text-neutral-500">Refine stock entries by type, status, and date range.</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setShowFilters(false)} aria-label="Close stock entry filters">
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Entry Type</span>
                  <SellerSelect value={filtersDraft.type} onChange={event => setFiltersDraft(current => ({
              ...current,
              type: event.target.value
            }))} className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950 shadow-none">
                    <option value="all">All Types</option>
                    <option value="adjustment_in">Adjustment In</option>
                    <option value="opening_stock">Opening Stock</option>
                    <option value="inward">Inward</option>
                    <option value="outward">Outward</option>
                    <option value="transfer">Transfer</option>
                    <option value="manufacture">Manufacture</option>
                  </SellerSelect>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                  <SellerSelect value={filtersDraft.status} onChange={event => setFiltersDraft(current => ({
              ...current,
              status: event.target.value
            }))} className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950 shadow-none">
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                  </SellerSelect>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Start Date</span>
                  <input className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none" type="date" value={filtersDraft.startDate} onChange={event => setFiltersDraft(current => ({
              ...current,
              startDate: event.target.value
            }))} />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">End Date</span>
                  <input className="min-h-11 w-full rounded-none border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none" type="date" value={filtersDraft.endDate} onChange={event => setFiltersDraft(current => ({
              ...current,
              endDate: event.target.value
            }))} />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 pt-4">
                <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={clearFilters}>
                  Clear
                </Button>
                <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              setAppliedFilters(filtersDraft);
              setShowFilters(false);
            }}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}

      {selectedEntry && <SellerModalBackdrop onClose={() => setSelectedEntry(null)}>
          <SellerModalCard className="hidden max-w-2xl bg-white lg:block" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Stock Entry Preview</span>
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{selectedEntry.code || 'Stock entry'}</h3>
                  <p className="text-sm leading-6 text-neutral-500">{selectedEntry.entryLabel || '-'}</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedEntry(null)} aria-label="Close stock entry preview">
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{selectedEntry.entryStatus}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{stockEntryDateLabel(selectedEntry.created_at)}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Date</span>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{number(selectedEntry.itemCount)}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Items</span>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{selectedEntry.entryValue > 0 ? `+${formatCurrency(selectedEntry.entryValue)}` : '-'}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Value</span>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Warehouse</span>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{selectedEntry.warehouseName ? `${selectedEntry.warehousePrefix}: ${selectedEntry.warehouseName}` : 'No warehouse linked.'}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
                <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              handleCancelEntry(selectedEntry);
              setSelectedEntry(null);
            }}>
                  Cancel Entry
                </Button>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}

      <div className="lg:hidden">
        <SellerMobileDetailSheet open={Boolean(selectedEntry)} title={selectedEntry?.code || ''} subtitle={selectedEntry?.entryLabel || ''} onClose={() => setSelectedEntry(null)} items={selectedEntry ? [{
      label: 'Entry Type',
      value: selectedEntry.entryLabel
    }, {
      label: 'Status',
      value: selectedEntry.entryStatus
    }, {
      label: 'Date',
      value: stockEntryDateLabel(selectedEntry.created_at)
    }, {
      label: 'Items',
      value: number(selectedEntry.itemCount)
    }, {
      label: 'Value',
      value: selectedEntry.entryValue > 0 ? `+${formatCurrency(selectedEntry.entryValue)}` : '-'
    }, {
      label: 'Warehouse',
      value: selectedEntry.warehouseName ? `${selectedEntry.warehousePrefix}: ${selectedEntry.warehouseName}` : '-'
    }] : []} actions={selectedEntry ? <Button type="button" variant="primary" onClick={() => {
      handleCancelEntry(selectedEntry);
      setSelectedEntry(null);
    }}>
            Cancel Entry
          </Button> : null} />
      </div>

      {importOpen && <SellerModalBackdrop onClose={() => setImportOpen(false)}>
          <SellerModalCard className="max-w-xl bg-white" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Stock Entry Import</span>
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Import Stock Entries</h3>
                  <p className="text-sm leading-6 text-neutral-500">Upload a CSV with `product_id`, `quantity`, `unit_cost`, and `warehouse_id`. Optional columns: `entry_type`, `posting_date`, `posting_time`, `remarks`.</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setImportOpen(false)} aria-label="Close stock entry import">
                  <X size={16} />
                </button>
              </div>

              {importError ? <div className="border border-rose-500 bg-white px-4 py-3 text-sm font-medium text-rose-700">{importError}</div> : null}

              <label className="flex cursor-pointer flex-col items-center justify-center gap-4 border border-dashed border-neutral-950 bg-neutral-50 px-6 py-10 text-center transition hover:bg-neutral-100">
                <input type="file" accept=".csv" className="hidden" onChange={event => importRows(event.target.files?.[0])} />
                <span className="inline-flex h-12 w-12 items-center justify-center border border-neutral-200 bg-white text-neutral-950">
                  <Import size={18} />
                </span>
                <div className="space-y-1">
                  <strong className="block text-base font-semibold text-neutral-950">{importing ? 'Importing entries...' : 'Choose a stock entry CSV file'}</strong>
                  <span className="block text-sm text-neutral-500">CSV only. Each row creates one stock entry against the existing create-entry endpoint.</span>
                </div>
              </label>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 pt-4">
                <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={() => setImportOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}
    </SellerTableSurface>

    <SellerPaginationCard>
      <SellerTablePaginationBar showBorder={false} className="bg-transparent px-0 pb-0 pt-0" summary={`Showing ${filteredRows.length ? (currentPage - 1) * perPage + 1 : 0} to ${Math.min(currentPage * perPage, filteredRows.length)} of ${filteredRows.length} results`} currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} onPageChange={setCurrentPage} perPage={perPage} onPerPageChange={event => {
      setPerPage(Number(event.target.value));
      setCurrentPage(1);
    }} />
    </SellerPaginationCard>
    </div>;
};
const movementReferenceLabel = row => `Manual #${row.reference_no || `${entryCodeFromType(row.type)}-${String(row.id).padStart(4, '0')}`}`;
const movementStatusLabel = row => {
  if (['pending', 'pending_approval'].includes(String(row.type || '').toLowerCase())) return 'Pending';
  return 'Posted';
};
const movementTypeLabel = row => titleCase(row.type === 'adjustment_in' ? 'inward' : row.type);
const StockMovementTable = ({
  rows,
  search,
  setSearch,
  perPage,
  setPerPage
}) => {
  const [showColumns, setShowColumns] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState({
    key: 'date',
    direction: 'desc'
  });
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    product: true,
    date: true,
    movementType: true,
    quantity: true,
    warehouses: true,
    reference: true,
    reason: true
  });
  const [filtersDraft, setFiltersDraft] = useState({
    startDate: '',
    endDate: '',
    productId: 'all',
    fromWarehouseId: 'all',
    movementType: 'all'
  });
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: '',
    endDate: '',
    productId: 'all',
    fromWarehouseId: 'all',
    movementType: 'all'
  });
  const columnPanelRef = useRef(null);
  const columnTemplate = ['42px', visibleColumns.product ? 'minmax(0, 1.5fr)' : null, visibleColumns.date ? '110px' : null, visibleColumns.movementType ? '120px' : null, visibleColumns.quantity ? '90px' : null, visibleColumns.warehouses ? 'minmax(0, 1.15fr)' : null, visibleColumns.reference ? 'minmax(0, 1fr)' : null, visibleColumns.reason ? 'minmax(0, 1fr)' : null, '96px'].filter(Boolean).join(' ');
  const renderMovementSortHeader = (key, label, className) => <SellerSortHeader active={sort.key === key} direction={sort.direction} className={`gap-1 ${className || ''}`} onClick={() => setSort(current => getNextSort(current, key))}>
      {label}
    </SellerSortHeader>;
  useEffect(() => {
    const handlePointerDown = event => {
      if (columnPanelRef.current && !columnPanelRef.current.contains(event.target)) {
        setShowColumns(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);
  const columnLabels = {
    product: 'Product',
    date: 'Date',
    movementType: 'Movement Type',
    quantity: 'Quantity',
    warehouses: 'Warehouses',
    reference: 'Reference',
    reason: 'Reason'
  };
  const activeFilterCount = Object.values(appliedFilters).filter(value => value && value !== 'all').length;
  const productOptions = useMemo(() => {
    const seen = new Map();
    rows.forEach(row => {
      if (!row.product?.id || seen.has(String(row.product.id))) return;
      seen.set(String(row.product.id), {
        value: String(row.product.id),
        label: row.product.name || `Product #${row.product.id}`
      });
    });
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);
  const warehouseOptions = useMemo(() => {
    const seen = new Map();
    rows.forEach(row => {
      const warehouse = row.from_warehouse || row.warehouse || row.to_warehouse;
      if (!warehouse?.id || seen.has(String(warehouse.id))) return;
      seen.set(String(warehouse.id), {
        value: String(warehouse.id),
        label: warehouse.name || `Warehouse #${warehouse.id}`
      });
    });
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);
  const filteredRows = useMemo(() => rows.filter(row => {
    const movementDate = isoDate(row.created_at);
    const fromWarehouseId = String(row.from_warehouse?.id || row.warehouse?.id || row.to_warehouse?.id || '');
    const productId = String(row.product?.id || '');
    const matchesStartDate = !appliedFilters.startDate || movementDate && movementDate >= appliedFilters.startDate;
    const matchesEndDate = !appliedFilters.endDate || movementDate && movementDate <= appliedFilters.endDate;
    const matchesProduct = appliedFilters.productId === 'all' || productId === appliedFilters.productId;
    const matchesWarehouse = appliedFilters.fromWarehouseId === 'all' || fromWarehouseId === appliedFilters.fromWarehouseId;
    const matchesMovementType = appliedFilters.movementType === 'all' || row.type === appliedFilters.movementType;
    return matchesStartDate && matchesEndDate && matchesProduct && matchesWarehouse && matchesMovementType;
  }), [appliedFilters, rows]);
  const sortedRows = useMemo(() => sortRows(filteredRows, sort, {
    product: row => row.product?.name,
    date: row => row.created_at,
    movementType: row => movementTypeLabel(row),
    quantity: row => Math.abs(Number(row.quantity || 0)),
    warehouses: row => row.from_warehouse?.name || row.warehouse?.name || row.to_warehouse?.name,
    reference: row => movementReferenceLabel(row),
    reason: row => row.reason
  }), [filteredRows, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / perPage));
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const visibleRows = sortedRows.slice((currentPage - 1) * perPage, currentPage * perPage);
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, search, appliedFilters]);
  useEffect(() => {
    setCurrentPage(current => Math.min(current, totalPages));
  }, [totalPages]);
  const resetVisibleColumns = () => {
    setVisibleColumns({
      product: true,
      date: true,
      movementType: true,
      quantity: true,
      warehouses: true,
      reference: true,
      reason: true
    });
  };
  const clearFilters = () => {
    const cleared = {
      startDate: '',
      endDate: '',
      productId: 'all',
      fromWarehouseId: 'all',
      movementType: 'all'
    };
    setFiltersDraft(cleared);
    setAppliedFilters(cleared);
  };
  return <div className="space-y-6">
      <SellerTableSurface>
        <div className="flex flex-col gap-4 border-b border-neutral-200 bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
          <label className="flex min-h-12 w-full items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 xl:max-w-[560px] xl:flex-1">
            <Search size={17} />
            <input className="w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400" type="text" placeholder="Search product, reason, reference..." value={search} onChange={event => setSearch(event.target.value)} />
          </label>

          <div className="flex flex-wrap gap-3 xl:ml-auto">
            <div className="relative" ref={columnPanelRef}>
              <Button type="button" variant="outline" onClick={() => {
              setShowColumns(current => !current);
              setShowFilters(false);
            }}>
                <Columns3 size={14} />
                Manage Columns
              </Button>
              {showColumns && <div className="absolute left-0 top-[calc(100%+0.75rem)] z-20 w-64 border border-neutral-200 bg-white p-4 shadow-sm">
                  {Object.entries(columnLabels).map(([key, label]) => <label key={key} className="mt-3 flex items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 first:mt-0">
                      <input type="checkbox" checked={visibleColumns[key]} onChange={event => setVisibleColumns(current => ({
                  ...current,
                  [key]: event.target.checked
                }))} className="h-4 w-4 accent-neutral-950" />
                      <span>{label}</span>
                    </label>)}
                  <div className="mt-4 flex gap-3">
                    <Button type="button" variant="outline" onClick={resetVisibleColumns}>
                      Reset
                    </Button>
                    <Button type="button" variant="primary" onClick={() => setShowColumns(false)}>
                      Close
                    </Button>
                  </div>
                </div>}
            </div>

            <Button type="button" variant={showFilters || activeFilterCount > 0 ? 'primary' : 'outline'} onClick={() => {
            setFiltersDraft(appliedFilters);
            setShowFilters(true);
            setShowColumns(false);
          }}>
              <Filter size={14} />
              Filters
              {activeFilterCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center border border-neutral-950 bg-neutral-950 px-1 text-[10px] font-semibold text-white">{activeFilterCount}</span>}
            </Button>
          </div>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <SellerGridHead style={{
          gridTemplateColumns: columnTemplate
        }}>
            <SellerGridCell>#</SellerGridCell>
            {visibleColumns.product && renderMovementSortHeader('product', 'Product', 'justify-start')}
            {visibleColumns.date && renderMovementSortHeader('date', 'Date', 'justify-center')}
            {visibleColumns.movementType && renderMovementSortHeader('movementType', 'Movement Type', 'justify-center')}
            {visibleColumns.quantity && renderMovementSortHeader('quantity', 'Quantity', 'justify-center')}
            {visibleColumns.warehouses && renderMovementSortHeader('warehouses', 'Warehouses', 'justify-start')}
            {visibleColumns.reference && renderMovementSortHeader('reference', 'Reference', 'justify-start')}
            {visibleColumns.reason && renderMovementSortHeader('reason', 'Reason', 'justify-start')}
            <SellerGridCell className="text-center">Actions</SellerGridCell>
          </SellerGridHead>

          <SellerGridBody>
            {visibleRows.map((row, index) => <SellerGridRow key={row.id} style={{
            gridTemplateColumns: columnTemplate
          }}>
                <SellerGridCell className="text-sm font-medium text-neutral-500">{(currentPage - 1) * perPage + index + 1}</SellerGridCell>
                {visibleColumns.product && <SellerGridCell className="flex min-w-0 items-center gap-3">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-100 text-sm font-semibold uppercase text-neutral-950">{String(row.product?.name || 'U').slice(0, 2)}</div>
                    <div className="min-w-0">
                      <strong className="block truncate text-sm font-semibold text-neutral-950">{row.product?.name || 'Unknown Product'}</strong>
                      <span className="mt-1 block truncate text-xs text-neutral-500">{row.product?.sku || row.product?.mystore_product_id || '-'}</span>
                    </div>
                  </SellerGridCell>}
                {visibleColumns.date && <SellerGridCell className="text-center text-sm text-neutral-700">{stockEntryDateLabel(row.created_at)}</SellerGridCell>}
                {visibleColumns.movementType && <SellerGridCell className="flex justify-center">
                    <SellerPill tone={String(row.type || '').toLowerCase().includes('out') ? 'info' : ['pending', 'pending_approval'].includes(String(row.type || '').toLowerCase()) ? 'warn' : 'success'}>
                      {movementTypeLabel(row)}
                    </SellerPill>
                  </SellerGridCell>}
                {visibleColumns.quantity && <SellerGridCell className="text-center text-sm font-semibold text-neutral-950">{number(Math.abs(row.quantity || 0))}</SellerGridCell>}
                {visibleColumns.warehouses && <SellerGridCell className="text-sm text-neutral-700">
                    {row.from_warehouse?.name ? `From: ${row.from_warehouse.name}` : row.to_warehouse?.name || row.warehouse?.name ? `To: ${row.to_warehouse?.name || row.warehouse?.name}` : '-'}
                  </SellerGridCell>}
                {visibleColumns.reference && <SellerGridCell className="break-words text-sm text-neutral-700">{movementReferenceLabel(row)}</SellerGridCell>}
                {visibleColumns.reason && <SellerGridCell className="break-words text-sm text-neutral-700">{row.reason || '-'}</SellerGridCell>}
                <SellerGridCell>
                  <div className="flex justify-center">
                    <div className="grid w-full max-w-[4.5rem] grid-cols-2 gap-2">
                      <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedMovement(row)} aria-label={`View movement ${movementReferenceLabel(row)}`} title="View">
                        <Eye size={14} />
                      </button>
                      <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" aria-label={`Download movement ${movementReferenceLabel(row)}`} title="Download">
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                </SellerGridCell>
              </SellerGridRow>)}
            {visibleRows.length === 0 && <SellerEmptyState className="m-4" title="No stock movements found" description="Movements will appear here once inventory is received, transferred, or adjusted." />}
          </SellerGridBody>
        </div>

        <div className="space-y-4 border-t border-neutral-200 p-4 xl:hidden">
          {visibleRows.map(row => <article key={`movement-mobile-${row.id}`} className="border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block truncate text-base font-semibold text-neutral-950">{row.product?.name || 'Unknown Product'}</strong>
                  <span className="mt-1 block truncate text-xs text-neutral-500">{movementReferenceLabel(row)}</span>
                </div>
                <SellerPill tone={String(row.type || '').toLowerCase().includes('out') ? 'info' : ['pending', 'pending_approval'].includes(String(row.type || '').toLowerCase()) ? 'warn' : 'success'}>
                  {movementTypeLabel(row)}
                </SellerPill>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Date</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">{stockEntryDateLabel(row.created_at)}</strong>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Quantity</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">{number(Math.abs(row.quantity || 0))}</strong>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">From Warehouse</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">{row.from_warehouse?.name || '-'}</strong>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">To Warehouse</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">{row.to_warehouse?.name || row.warehouse?.name || 'Main Distribution Center'}</strong>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => setSelectedMovement(row)}>View</Button>
                <Button type="button" variant="primary">
                  <Download size={14} />
                  Download
                </Button>
              </div>
            </article>)}
          {visibleRows.length === 0 && <SellerEmptyState title="No stock movements found" description="Movements will appear here once inventory is received, transferred, or adjusted." />}
        </div>
      </SellerTableSurface>

      <SellerPaginationCard>
        <SellerTablePaginationBar showBorder={false} className="bg-transparent px-0 pb-0 pt-0" summary={`Showing ${filteredRows.length ? (currentPage - 1) * perPage + 1 : 0} to ${Math.min(currentPage * perPage, filteredRows.length)} of ${filteredRows.length} results`} currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} onPageChange={setCurrentPage} perPage={perPage} onPerPageChange={event => {
        setPerPage(Number(event.target.value));
        setCurrentPage(1);
      }} />
      </SellerPaginationCard>

      {showFilters && <SellerModalBackdrop onClose={() => setShowFilters(false)}>
          <SellerModalCard className="max-w-3xl bg-white" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Stock Movement Filters</span>
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Filter Stock Movements</h3>
                  <p className="text-sm leading-6 text-neutral-500">Refine movements by date, product, warehouse, and movement type.</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setShowFilters(false)} aria-label="Close stock movement filters">
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Date From</span>
                  <input className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none" type="date" value={filtersDraft.startDate} onChange={event => setFiltersDraft(current => ({
                ...current,
                startDate: event.target.value
              }))} />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Date To</span>
                  <input className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none" type="date" value={filtersDraft.endDate} onChange={event => setFiltersDraft(current => ({
                ...current,
                endDate: event.target.value
              }))} />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Product</span>
                  <SellerSelect className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none" value={filtersDraft.productId} onChange={event => setFiltersDraft(current => ({
                ...current,
                productId: event.target.value
              }))}>
                    <option value="all">All Products</option>
                    {productOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SellerSelect>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">From Warehouse</span>
                  <SellerSelect className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none" value={filtersDraft.fromWarehouseId} onChange={event => setFiltersDraft(current => ({
                ...current,
                fromWarehouseId: event.target.value
              }))}>
                    <option value="all">All Warehouses</option>
                    {warehouseOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SellerSelect>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Movement Type</span>
                  <SellerSelect className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none" value={filtersDraft.movementType} onChange={event => setFiltersDraft(current => ({
                ...current,
                movementType: event.target.value
              }))}>
                    <option value="all">All Types</option>
                    <option value="adjustment_in">Adjustment In</option>
                    <option value="adjustment_out">Adjustment Out</option>
                    <option value="inward">Inward</option>
                    <option value="outward">Outward</option>
                    <option value="transfer">Transfer</option>
                    <option value="opening_stock">Opening Stock</option>
                    <option value="manufacture">Manufacture</option>
                  </SellerSelect>
                </label>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
                <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              clearFilters();
              setShowFilters(false);
            }}>
                  Clear
                </Button>
                <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              setAppliedFilters(filtersDraft);
              setCurrentPage(1);
              setShowFilters(false);
            }}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}

      {selectedMovement && <SellerModalBackdrop onClose={() => setSelectedMovement(null)}>
          <SellerModalCard className="hidden max-w-3xl bg-white lg:block" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Stock Movement Preview</span>
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{movementReferenceLabel(selectedMovement)}</h3>
                  <p className="text-sm leading-6 text-neutral-500">{selectedMovement.product?.name || 'Unknown Product'}</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedMovement(null)} aria-label="Close stock movement preview">
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{movementTypeLabel(selectedMovement)}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Movement Type</span>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{movementStatusLabel(selectedMovement)}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{stockEntryDateLabel(selectedMovement.created_at)}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Date</span>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <strong className="block text-base font-semibold text-neutral-950">{number(Math.abs(selectedMovement.quantity || 0))}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Quantity</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">From Warehouse</span>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{selectedMovement.from_warehouse?.name || 'N/A'}</p>
                </div>
                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">To Warehouse</span>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{selectedMovement.to_warehouse?.name || selectedMovement.warehouse?.name || 'Main Distribution Center'}</p>
                </div>
                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Product</span>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{selectedMovement.product?.name || 'Unknown Product'}</p>
                  <span className="mt-2 block text-xs text-neutral-500">{selectedMovement.product?.sku || selectedMovement.product?.mystore_product_id || '-'}</span>
                </div>
                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Created By</span>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{selectedMovement.created_by || 'Demo Admin'}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="border border-neutral-200 bg-white px-4 py-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Reason</span>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{selectedMovement.reason || 'Material Receipt'}</p>
                </div>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}

      <div className="lg:hidden">
        <SellerMobileDetailSheet open={Boolean(selectedMovement)} title={selectedMovement ? movementReferenceLabel(selectedMovement) : ''} subtitle={selectedMovement?.product?.name || ''} onClose={() => setSelectedMovement(null)} items={selectedMovement ? [{
      label: 'Date',
      value: `${stockEntryDateLabel(selectedMovement.created_at)} 12:00 AM`
    }, {
      label: 'Movement Type',
      value: movementTypeLabel(selectedMovement)
    }, {
      label: 'Product',
      value: selectedMovement.product?.name || 'Unknown Product',
      hint: selectedMovement.product?.sku || selectedMovement.product?.mystore_product_id || ''
    }, {
      label: 'Quantity',
      value: number(Math.abs(selectedMovement.quantity || 0))
    }, {
      label: 'From Warehouse',
      value: selectedMovement.from_warehouse?.name || 'N/A'
    }, {
      label: 'To Warehouse',
      value: selectedMovement.to_warehouse?.name || selectedMovement.warehouse?.name || 'Main Distribution Center'
    }, {
      label: 'Reason',
      value: selectedMovement.reason || 'Material Receipt'
    }, {
      label: 'Created By',
      value: selectedMovement.created_by || 'Demo Admin'
    }, {
      label: 'Status',
      value: movementStatusLabel(selectedMovement)
    }] : []} />
      </div>
    </div>;
};
const ReconciliationTable = ({
  rows,
  search,
  setSearch,
  perPage,
  setPerPage
}) => {
  const displayRows = rows.filter(row => String(row.adjustment_no || '').startsWith('REC-'));
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReconciliation, setSelectedReconciliation] = useState(null);
  const [showColumns, setShowColumns] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState({
    key: 'date',
    direction: 'desc'
  });
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    difference: true,
    status: true
  });
  const [filtersDraft, setFiltersDraft] = useState({
    status: 'all',
    startDate: '',
    endDate: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: ''
  });
  const columnPanelRef = useRef(null);
  const columnTemplate = ['42px', 'minmax(0, 1.45fr)', visibleColumns.date ? '120px' : null, visibleColumns.difference ? '110px' : null, visibleColumns.status ? '120px' : null, '96px'].filter(Boolean).join(' ');
  const renderReconciliationSortHeader = (key, label, className) => <SellerSortHeader active={sort.key === key} direction={sort.direction} className={`gap-1 ${className || ''}`} onClick={() => setSort(current => getNextSort(current, key))}>
      {label}
    </SellerSortHeader>;
  useEffect(() => {
    const handlePointerDown = event => {
      if (columnPanelRef.current && !columnPanelRef.current.contains(event.target)) {
        setShowColumns(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);
  const activeFilterCount = Object.values(appliedFilters).filter(value => value && value !== 'all').length;
  const columnLabels = {
    date: 'Date',
    difference: 'Difference',
    status: 'Status'
  };
  const filteredRows = useMemo(() => displayRows.filter(row => {
    const rowDate = isoDate(row.created_at);
    const rowStatus = String(row.status || 'posted').toLowerCase();
    const matchesStatus = appliedFilters.status === 'all' || rowStatus === appliedFilters.status;
    const matchesStartDate = !appliedFilters.startDate || rowDate && rowDate >= appliedFilters.startDate;
    const matchesEndDate = !appliedFilters.endDate || rowDate && rowDate <= appliedFilters.endDate;
    return matchesStatus && matchesStartDate && matchesEndDate;
  }), [appliedFilters, displayRows]);
  const sortedRows = useMemo(() => sortRows(filteredRows, sort, {
    reconciliation: row => row.adjustment_no || `REC-${String(row.id).padStart(4, '0')}`,
    date: row => row.created_at,
    difference: row => row.variance_quantity,
    status: row => row.status
  }), [filteredRows, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / perPage));
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const visibleRows = sortedRows.slice((currentPage - 1) * perPage, currentPage * perPage);
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage, search, appliedFilters]);
  useEffect(() => {
    setCurrentPage(current => Math.min(current, totalPages));
  }, [totalPages]);
  const clearFilters = () => {
    const cleared = {
      status: 'all',
      startDate: '',
      endDate: ''
    };
    setFiltersDraft(cleared);
    setAppliedFilters(cleared);
  };
  const resetVisibleColumns = () => setVisibleColumns({
    date: true,
    difference: true,
    status: true
  });
  return <div className="space-y-6">
      <SellerTableSurface>
        <div className="flex flex-col gap-4 border-b border-neutral-200 bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
          <label className="flex min-h-12 w-full items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 xl:max-w-[560px] xl:flex-1">
            <Search size={17} />
            <input className="w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400" type="text" placeholder="Search reconciliations..." value={search} onChange={event => setSearch(event.target.value)} />
          </label>

          <div className="flex flex-wrap gap-3 xl:ml-auto">
            <div className="relative" ref={columnPanelRef}>
              <Button type="button" variant="outline" onClick={() => {
              setShowColumns(current => !current);
              setShowFilters(false);
            }}>
                <Columns3 size={14} />
                Manage Columns
              </Button>
              {showColumns && <div className="absolute left-0 top-[calc(100%+0.75rem)] z-20 w-64 border border-neutral-200 bg-white p-4">
                  {Object.entries(columnLabels).map(([key, label]) => <label key={key} className="mt-3 flex items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 first:mt-0">
                      <input type="checkbox" checked={visibleColumns[key]} onChange={event => setVisibleColumns(current => ({
                  ...current,
                  [key]: event.target.checked
                }))} className="h-4 w-4 accent-neutral-950" />
                      <span>{label}</span>
                    </label>)}
                  <div className="mt-4 flex gap-3">
                    <Button type="button" variant="outline" onClick={resetVisibleColumns}>
                      Reset
                    </Button>
                    <Button type="button" variant="primary" onClick={() => setShowColumns(false)}>
                      Close
                    </Button>
                  </div>
                </div>}
            </div>
            <Button type="button" variant={showFilters || activeFilterCount > 0 ? 'primary' : 'outline'} onClick={() => {
            setFiltersDraft(appliedFilters);
            setShowFilters(true);
            setShowColumns(false);
          }}>
              <Filter size={14} />
              Filters
              {activeFilterCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center border border-neutral-950 bg-neutral-950 px-1 text-[10px] font-semibold text-white">{activeFilterCount}</span>}
            </Button>
          </div>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <SellerGridHead style={{
          gridTemplateColumns: columnTemplate
        }}>
            <SellerGridCell>#</SellerGridCell>
            {renderReconciliationSortHeader('reconciliation', 'Reconciliation', 'justify-start')}
            {visibleColumns.date && renderReconciliationSortHeader('date', 'Date', 'justify-center')}
            {visibleColumns.difference && renderReconciliationSortHeader('difference', 'Difference', 'justify-center')}
            {visibleColumns.status && renderReconciliationSortHeader('status', 'Status', 'justify-center')}
            <SellerGridCell className="text-center">Actions</SellerGridCell>
          </SellerGridHead>

          <SellerGridBody>
            {visibleRows.map((row, index) => <SellerGridRow key={row.id} style={{
            gridTemplateColumns: columnTemplate
          }}>
                <SellerGridCell className="text-sm font-medium text-neutral-500">{(currentPage - 1) * perPage + index + 1}</SellerGridCell>
                <SellerGridCell className="flex min-w-0 items-center gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-100 text-sm font-semibold uppercase text-neutral-950">RC</div>
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-semibold text-neutral-950">{row.adjustment_no || `REC-${String(row.id).padStart(4, '0')}`}</strong>
                    <span className="mt-1 block truncate text-xs text-neutral-500">{row.reason || 'Physical stock reconciliation'}</span>
                  </div>
                </SellerGridCell>
                {visibleColumns.date && <SellerGridCell className="text-center text-sm text-neutral-700">{stockEntryDateLabel(row.created_at)}</SellerGridCell>}
                {visibleColumns.difference && <SellerGridCell className="text-center text-sm font-semibold text-neutral-950">
                  {Number(row.variance_quantity || 0) > 0 ? '+' : ''}{number(row.variance_quantity || 0)}
                </SellerGridCell>}
                {visibleColumns.status && <SellerGridCell className="flex justify-center">
                  <SellerPill tone={String(row.status || 'posted').toLowerCase() === 'draft' ? 'neutral' : String(row.status || 'posted').toLowerCase() === 'submitted' ? 'warn' : 'success'}>
                    {titleCase(row.status || 'posted')}
                  </SellerPill>
                </SellerGridCell>}
                <SellerGridCell>
                  <div className="flex justify-center">
                    <button className="inline-flex h-9 w-9 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setSelectedReconciliation(row)} aria-label={`View reconciliation ${row.adjustment_no || row.id}`} title="View">
                      <Eye size={14} />
                    </button>
                  </div>
                </SellerGridCell>
              </SellerGridRow>)}
            {visibleRows.length === 0 && <SellerEmptyState className="m-4 shadow-none" title="No reconciliations found" description="Get started by creating a stock reconciliation." action={<Button type="button" variant="primary" onClick={() => router.visit('/seller/inventory/reconciliation/create')}>
                    <Plus size={14} />
                    Create Reconciliation
                  </Button>} />}
          </SellerGridBody>
        </div>

        <div className="space-y-4 border-t border-neutral-200 p-4 shadow-none xl:hidden">
          {visibleRows.map(row => <article key={`recon-mobile-${row.id}`} className="border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block truncate text-base font-semibold text-neutral-950">{row.adjustment_no || `REC-${String(row.id).padStart(4, '0')}`}</strong>
                  <span className="mt-1 block truncate text-xs text-neutral-500">{row.reason || 'Physical stock reconciliation'}</span>
                </div>
                <SellerPill tone={String(row.status || 'posted').toLowerCase() === 'draft' ? 'neutral' : String(row.status || 'posted').toLowerCase() === 'submitted' ? 'warn' : 'success'}>
                  {titleCase(row.status || 'posted')}
                </SellerPill>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Date</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">{stockEntryDateLabel(row.created_at)}</strong>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Difference</span>
                  <strong className="mt-2 block text-sm font-semibold text-neutral-950">{Number(row.variance_quantity || 0) > 0 ? '+' : ''}{number(row.variance_quantity || 0)}</strong>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => setSelectedReconciliation(row)}>View</Button>
              </div>
            </article>)}
          {visibleRows.length === 0 && <SellerEmptyState className="shadow-none" title="No reconciliations found" description="Get started by creating a stock reconciliation." action={<Button type="button" variant="primary" onClick={() => router.visit('/seller/inventory/reconciliation/create')}>
                  <Plus size={14} />
                  Create Reconciliation
                </Button>} />}
        </div>
      </SellerTableSurface>

      <SellerPaginationCard>
        <SellerTablePaginationBar showBorder={false} className="bg-transparent px-0 pb-0 pt-0" summary={`Showing ${filteredRows.length > 0 ? (currentPage - 1) * perPage + 1 : 0} to ${Math.min(currentPage * perPage, filteredRows.length)} of ${filteredRows.length} results`} currentPage={currentPage} totalPages={totalPages} pageNumbers={pageNumbers} onPageChange={setCurrentPage} perPage={perPage} onPerPageChange={event => {
        setPerPage(Number(event.target.value));
        setCurrentPage(1);
      }} />
      </SellerPaginationCard>

      {showFilters && <SellerModalBackdrop onClose={() => setShowFilters(false)}>
          <SellerModalCard className="max-w-3xl bg-white" onMouseDown={event => event.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex border border-neutral-950 bg-neutral-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Reconciliation Filters</span>
                  <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">Filter Reconciliations</h3>
                  <p className="text-sm leading-6 text-neutral-500">Refine reconciliation runs by status and posting date.</p>
                </div>
                <button className="inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" type="button" onClick={() => setShowFilters(false)} aria-label="Close reconciliation filters">
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                  <SellerSelect className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-none" value={filtersDraft.status} onChange={event => setFiltersDraft(current => ({
                ...current,
                status: event.target.value
              }))}>
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="posted">Posted</option>
                  </SellerSelect>
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Date From</span>
                  <input className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none" type="date" value={filtersDraft.startDate} onChange={event => setFiltersDraft(current => ({
                ...current,
                startDate: event.target.value
              }))} />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Date To</span>
                  <input className="min-h-12 w-full rounded-none border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none" type="date" value={filtersDraft.endDate} onChange={event => setFiltersDraft(current => ({
                ...current,
                endDate: event.target.value
              }))} />
                </label>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-200 pt-4">
                <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              clearFilters();
              setShowFilters(false);
            }}>
                  Clear
                </Button>
                <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={() => {
              setAppliedFilters(filtersDraft);
              setCurrentPage(1);
              setShowFilters(false);
            }}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </SellerModalCard>
        </SellerModalBackdrop>}

      <SellerMobileDetailSheet open={Boolean(selectedReconciliation)} title={selectedReconciliation?.adjustment_no || `REC-${String(selectedReconciliation?.id || '').padStart(4, '0')}`} subtitle={selectedReconciliation?.reason || 'Physical stock reconciliation'} onClose={() => setSelectedReconciliation(null)} items={selectedReconciliation ? [{
      label: 'Date',
      value: stockEntryDateLabel(selectedReconciliation.created_at)
    }, {
      label: 'Difference',
      value: `${Number(selectedReconciliation.variance_quantity || 0) > 0 ? '+' : ''}${number(selectedReconciliation.variance_quantity || 0)}`
    }, {
      label: 'Status',
      value: titleCase(selectedReconciliation.status || 'posted')
    }, {
      label: 'Warehouse',
      value: selectedReconciliation.warehouse?.name || '-'
    }, {
      label: 'Product',
      value: selectedReconciliation.product?.name || '-'
    }] : []} />
    </div>;
};
export const SellerInventorySection = () => {
  const {
    props
  } = usePage();
  const localization = getUserLocalization(props);
  const section = props.sellerInventorySection || 'stock-movements';
  const snapshot = props.sellerInventorySnapshot || {};
  const metrics = snapshot.metrics || {};
  const stockRows = snapshot.stock_entries || [];
  const allocationRows = snapshot.allocations || [];
  const snapshotProducts = snapshot.products || [];
  const snapshotWarehouses = snapshot.warehouses || [];
  const reconciliationRows = snapshot.recent_adjustments || [];
  const batchRows = snapshot.traceability?.batches || [];
  const serialRows = snapshot.traceability?.serials || [];
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [recordMovementOpen, setRecordMovementOpen] = useState(false);
  const [stockEntryActions, setStockEntryActions] = useState(null);
  const formatCurrency = value => formatMoney(value, {
    currency: localization.currency,
    locale: localization.locale
  }, props);
  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const isBatchTracking = section === 'batch-tracking';
    const isSerialTracking = section === 'serial-tracking';
    const isExpiryTracking = section === 'expiry-tracking';
    if (section === 'reconciliation') {
      if (!needle) return reconciliationRows;
      return reconciliationRows.filter(row => [row.adjustment_no, row.reason, row.status, row.product?.name, row.product?.sku, row.product?.mystore_product_id, row.warehouse?.name].filter(Boolean).join(' ').toLowerCase().includes(needle));
    }
    if (isBatchTracking || isExpiryTracking) {
      const sourceRows = isExpiryTracking ? batchRows.filter(row => row.expires_at) : batchRows;
      if (!needle) return sourceRows;
      return sourceRows.filter(row => [row.batch_no, row.product?.name, row.product?.sku, row.product?.mystore_product_id, row.product?.brand?.name, row.warehouse?.name, row.status].filter(Boolean).join(' ').toLowerCase().includes(needle));
    }
    if (isSerialTracking) {
      if (!needle) return serialRows;
      return serialRows.filter(row => [row.serial_no, row.status, row.product?.name, row.product?.sku, row.product?.mystore_product_id, row.warehouse?.name, row.batch?.batch_no].filter(Boolean).join(' ').toLowerCase().includes(needle));
    }
    if (!needle) return stockRows;
    return stockRows.filter(row => [row.product?.name, row.product?.sku, row.reason, row.reference_no, row.type, row.warehouse?.name, row.from_warehouse?.name, row.to_warehouse?.name].filter(Boolean).join(' ').toLowerCase().includes(needle));
  }, [batchRows, reconciliationRows, search, section, serialRows, stockRows]);
  const isStockEntries = section === 'stock-entries';
  const isStockMovements = section === 'stock-movements';
  const isReconciliation = section === 'reconciliation';
  const isBatchTracking = section === 'batch-tracking';
  const isSerialTracking = section === 'serial-tracking';
  const isExpiryTracking = section === 'expiry-tracking';
  const isTraceabilitySection = isBatchTracking || isSerialTracking || isExpiryTracking;
  const stockEntryStats = useMemo(() => {
    const submittedCount = stockRows.filter(row => Number(row.quantity || 0) > 40).length;
    const draftCount = stockRows.length - submittedCount;
    const totalValue = stockRows.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.unit_cost || 0), 0);
    return [{
      label: 'Total Entries',
      value: number(stockRows.length),
      icon: Grid2X2,
      tone: 'green'
    }, {
      label: 'Submitted',
      value: number(submittedCount),
      icon: CheckCircle2,
      tone: 'green'
    }, {
      label: 'Draft',
      value: number(Math.max(draftCount, 0)),
      icon: ClipboardList,
      tone: 'amber'
    }, {
      label: 'Tracked Value',
      value: formatCurrency(totalValue),
      icon: BadgeCheck,
      tone: 'purple'
    }];
  }, [formatCurrency, stockRows]);
  const productOptions = useMemo(() => {
    const map = new Map();
    snapshotProducts.forEach(product => {
      if (product.id) {
        map.set(product.id, {
          id: product.id,
          name: product.name || 'Unknown Product',
          sku: product.sku || ''
        });
      }
    });
    stockRows.forEach(row => {
      if (row.product?.id) {
        map.set(row.product.id, {
          id: row.product.id,
          name: row.product.name || 'Unknown Product',
          sku: row.product.sku || row.product.mystore_product_id || ''
        });
      }
    });
    allocationRows.forEach(row => {
      if (row.product_id) {
        map.set(row.product_id, {
          id: row.product_id,
          name: row.product_name || 'Unknown Product',
          sku: row.sku || ''
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allocationRows, snapshotProducts, stockRows]);
  const warehouseOptions = useMemo(() => {
    const map = new Map();
    snapshotWarehouses.forEach(warehouse => {
      if (warehouse.id) {
        map.set(warehouse.id, {
          id: warehouse.id,
          name: warehouse.name || warehouse.code || `Warehouse ${warehouse.id}`
        });
      }
    });
    allocationRows.forEach(row => {
      if (row.warehouse_id) {
        map.set(row.warehouse_id, {
          id: row.warehouse_id,
          name: row.warehouse_name || row.warehouse_code || `Warehouse ${row.warehouse_id}`
        });
      }
    });
    stockRows.forEach(row => {
      [row.warehouse, row.from_warehouse, row.to_warehouse].forEach(warehouse => {
        if (warehouse?.id) {
          map.set(warehouse.id, {
            id: warehouse.id,
            name: warehouse.name || warehouse.code || `Warehouse ${warehouse.id}`
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allocationRows, snapshotWarehouses, stockRows]);
  const headerRight = isStockEntries ? <>
      <Button type="button" variant="outline" onClick={() => stockEntryActions?.openImport?.()} disabled={!stockEntryActions}>
        <Import size={15} />
        Import
      </Button>
      <Button type="button" variant="outline" onClick={() => stockEntryActions?.exportRows?.()} disabled={!stockEntryActions}>
        <ArrowUpToLine size={15} />
        Export
      </Button>
      <Button type="button" variant="primary" onClick={() => router.visit('/seller/inventory/stock-entries/create')}>
        <Plus size={15} />
        Create Entry
      </Button>
    </> : isReconciliation ? <Button type="button" variant="primary" onClick={() => router.visit('/seller/inventory/reconciliation/create')}>
      <Plus size={15} />
      Create Reconciliation
    </Button> : <Button type="button" variant="primary" onClick={() => setRecordMovementOpen(true)}>
      <Plus size={15} />
      Record Movement
    </Button>;
  const headerProps = isStockEntries ? {
    title: 'Stock Entries',
    subtitle: 'Track all inventory movements and transactions',
    stats: stockEntryStats
  } : isReconciliation ? {
    title: 'Stock Reconciliations',
    subtitle: 'Physical counts and adjustments'
  } : {
    title: 'Stock Movements',
    subtitle: 'Unified inventory ledger for inward, outward, transfer, adjustment, and reconciliation movements.'
  };
  return <div>
      <Sidebar />

      <SellerPageShell>
        <div className="space-y-6">
          {!isTraceabilitySection && !isStockEntries && !isStockMovements && !isReconciliation && <>
              <nav aria-label="Inventory sections">
                <div>
                  {inventoryTabs.map(([label, href, Icon]) => <Link key={label} href={href}>
                      <Icon size={16} />
                      {label}
                    </Link>)}
                </div>

                <div>
                  {stockControlLinks.map(([label, href]) => <Link key={label} href={href}>
                      {label}
                    </Link>)}
                </div>
              </nav>

              <SectionHeader eyebrow={headerProps.eyebrow} title={headerProps.title} subtitle={headerProps.subtitle} note={headerProps.note} right={headerRight} />
            </>}

          {isReconciliation && <SectionHeader title={headerProps.title} subtitle={headerProps.subtitle} right={headerRight} />}

          {isStockEntries && <SectionHeader title={headerProps.title} subtitle={headerProps.subtitle} stats={headerProps.stats} right={headerRight} />}

          {isStockMovements && <StockMovementHeader title={headerProps.title} subtitle={headerProps.subtitle} rows={filteredRows} action={headerRight} />}

          {isBatchTracking ? <BatchTrackingTable rows={filteredRows} search={search} setSearch={setSearch} perPage={perPage} setPerPage={setPerPage} /> : isSerialTracking ? <SerialTrackingTable rows={filteredRows} search={search} setSearch={setSearch} perPage={perPage} setPerPage={setPerPage} /> : isExpiryTracking ? <ExpiryTrackingTable rows={filteredRows} search={search} setSearch={setSearch} perPage={perPage} setPerPage={setPerPage} /> : isStockEntries ? <StockEntryTable rows={filteredRows} search={search} setSearch={setSearch} perPage={perPage} setPerPage={setPerPage} formatCurrency={formatCurrency} onActionsChange={setStockEntryActions} products={snapshotProducts} warehouses={snapshotWarehouses} /> : isReconciliation ? <ReconciliationTable rows={filteredRows} search={search} setSearch={setSearch} perPage={perPage} setPerPage={setPerPage} /> : <StockMovementTable rows={filteredRows} search={search} setSearch={setSearch} perPage={perPage} setPerPage={setPerPage} />}

          {isStockMovements && recordMovementOpen && <StockMovementModal products={productOptions} warehouses={warehouseOptions} onClose={() => setRecordMovementOpen(false)} />}
        </div>
      </SellerPageShell>
    </div>;
};
export default SellerInventorySection;
