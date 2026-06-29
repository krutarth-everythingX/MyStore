import React, { useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ArrowUpToLine, Calendar, Check, CheckSquare, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, File, FileSpreadsheet, FileUp, Table2, Upload } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { SellerCard, SellerPageHeader, SellerPageShell, SellerSelect } from '../components/seller-workspace';
import { useToast } from '../context/ToastContext';
const IMPORT_OPTIONAL_FIELDS = ['Type', 'Product Code', 'Description', 'HSN Code', 'Category', 'Sub Category', 'Brand', 'Unit', 'Cost', 'Tax Type', 'Tax Inclusion', 'Status', 'Opening Stock', 'SKU'];
const IMPORT_INSTRUCTIONS = ['Download the example CSV file to see the correct format', 'Fill in your data following the same column structure', 'Required fields: Product Name, Price', 'Product Code is auto-generated if left empty', 'Type values: product or service (defaults to product)', 'Category and Sub Category are matched by name; new ones are created automatically if not found', 'Brand is matched by name; a new brand is created automatically if not found', 'Tax Type is matched by name; a new tax rate is created automatically if not found', 'Tax Inclusion values: include or exclude (defaults to include)', 'Unit examples: unit, piece, hour, kg, meter, litre, box', 'Status values: Active (default) or Inactive', 'Save your file as CSV format', 'Upload the file using the form below'];
const EXPORT_FIELDS = ['Product Code', 'Name', 'Sku', 'Description', 'Category Name', 'Subcategory Name', 'Brand', 'Unit', 'Price', 'Cost', 'Tax Rate', 'Stock Quantity', 'Min Stock Level', 'Max Stock Level', 'Reorder Level', 'Supplier Name', 'Manufacturer', 'Barcode', 'Hsn Code', 'Status', 'Is Featured', 'Weight', 'Dimensions', 'Warranty Period', 'Tags', 'Created At', 'Updated At'];
const EXPORT_SCOPES = [{
  value: 'all',
  label: 'All Records',
  helper: 'Download all'
}];
const EXPORT_FORMATS = [{
  value: 'csv',
  label: 'CSV',
  helper: 'Comma Separated',
  icon: FileSpreadsheet
}, {
  value: 'excel',
  label: 'Excel',
  helper: 'XLSX Format',
  icon: Table2
}, {
  value: 'pdf',
  label: 'PDF',
  helper: 'Portable Document',
  icon: File
}];
const STATUS_OPTIONS = [{
  value: 'all',
  label: 'All Status'
}, {
  value: 'active',
  label: 'Active'
}, {
  value: 'inactive',
  label: 'Inactive'
}, {
  value: 'pending',
  label: 'Pending'
}];
const DATE_INPUT_FORMAT = 'DD/MM/YYYY';
const formatDateInput = value => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};
const parseDateInput = value => {
  const trimmed = String(value || '').trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return null;
  const [day, month, year] = trimmed.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
};
const formatDateLabel = date => {
  if (!(date instanceof Date)) return '';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};
const formatDateParam = date => {
  if (!(date instanceof Date)) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const isSameDay = (left, right) => left instanceof Date && right instanceof Date && left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
const isBetweenDates = (date, start, end) => {
  if (!(date instanceof Date) || !(start instanceof Date) || !(end instanceof Date)) return false;
  const time = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return time > Math.min(startTime, endTime) && time < Math.max(startTime, endTime);
};
const buildCalendarDays = monthDate => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);
  return Array.from({
    length: 42
  }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
};
const DateRangePicker = ({
  open,
  onToggle,
  startInput,
  endInput,
  onStartInputChange,
  onEndInputChange,
  onInputBlur,
  onDateSelect,
  activeField,
  setActiveField,
  visibleMonth,
  onMonthChange,
  startDate,
  endDate,
  onClear,
  onApply
}) => {
  const monthLabel = visibleMonth.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  });
  const calendarDays = buildCalendarDays(visibleMonth);
  const triggerLabel = startInput || endInput ? `${startInput || DATE_INPUT_FORMAT}${endInput ? ` - ${endInput}` : ''}` : 'Select date range';
  return <div className="relative">
    <button type="button" className={`flex min-h-11 w-full items-center justify-between border px-3 text-left text-sm transition ${open ? 'border-neutral-950 bg-neutral-100' : 'border-neutral-950 bg-white hover:bg-neutral-100'}`} onClick={() => onToggle(!open)}>
      <span className={startInput || endInput ? 'text-neutral-950' : 'text-neutral-400'}>{triggerLabel}</span>
      <Calendar size={15} className="shrink-0 text-neutral-500" />
    </button>

    {open && <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 space-y-4 border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Start Date</span>
          <input type="text" inputMode="numeric" placeholder={DATE_INPUT_FORMAT} value={startInput} onFocus={() => setActiveField('start')} onChange={event => onStartInputChange(event.target.value)} onBlur={() => onInputBlur('start')} className="min-h-10 w-full border border-neutral-200 px-3 text-sm text-neutral-950 outline-none placeholder:text-neutral-400" />
        </label>
        <label className="space-y-2">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">End Date</span>
          <input type="text" inputMode="numeric" placeholder={DATE_INPUT_FORMAT} value={endInput} onFocus={() => setActiveField('end')} onChange={event => onEndInputChange(event.target.value)} onBlur={() => onInputBlur('end')} className="min-h-10 w-full border border-neutral-200 px-3 text-sm text-neutral-950 outline-none placeholder:text-neutral-400" />
        </label>
      </div>

      <div className="rounded-none border border-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" onClick={() => onMonthChange(-1)}>
            <ChevronLeft size={14} />
          </button>
          <div className="text-sm font-semibold text-neutral-950">{monthLabel}</div>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100" onClick={() => onMonthChange(1)}>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-neutral-200 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day} className="py-2">{day}</div>)}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map(day => {
            const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
            const selected = isSameDay(day, startDate) || isSameDay(day, endDate);
            const inRange = isBetweenDates(day, startDate, endDate);
            return <button key={day.toISOString()} type="button" className={`flex aspect-square items-center justify-center border-r border-b border-neutral-200 text-sm transition last:border-r-0 ${selected ? 'bg-neutral-950 font-semibold text-white' : inRange ? 'bg-neutral-100 text-neutral-950' : isCurrentMonth ? 'bg-white text-neutral-950 hover:bg-neutral-100' : 'bg-neutral-50 text-neutral-400 hover:bg-neutral-100'}`} onClick={() => onDateSelect(day)}>
              {day.getDate()}
            </button>;
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">Format: {DATE_INPUT_FORMAT}</div>
        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex min-h-10 items-center gap-2 border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100" onClick={onClear}>
            Clear
          </button>
          <button type="button" className="inline-flex min-h-10 items-center gap-2 border border-neutral-200 bg-neutral-950 px-3 text-sm font-medium text-white transition hover:bg-neutral-800" onClick={onApply}>
            Apply
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>}
  </div>;
};
const TransferCard = ({
  title,
  children,
  className = ''
}) => <SellerCard>
    {title !== '' && <div>
      <h2>{title}</h2>
    </div>}
    {children}
  </SellerCard>;
const ImportPage = () => {
  const {
    showToast
  } = useToast();
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const requiredFields = ['Product Name', 'Price'];
  const submitImport = () => {
    if (!file) {
      showToast('Please choose a CSV file first.', 'error');
      return;
    }
    router.post('/products/import', {
      file
    }, {
      forceFormData: true,
      preserveScroll: true,
      onStart: () => setSubmitting(true),
      onSuccess: () => showToast('Products imported successfully.', 'success'),
      onError: errors => showToast(errors.file || 'Import failed.', 'error'),
      onFinish: () => setSubmitting(false)
    });
  };
  return <>
    <SellerPageHeader title="Import Products" description="Upload a CSV file to validate and add products in bulk." action={<div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" className="rounded-none border border-neutral-200 px-4">
        <Download size={15} />
        Download Example CSV
      </Button>
      <Button type="button" variant="outline" onClick={() => router.visit('/seller/products')}>
        <ArrowLeft size={15} />
        Back
      </Button>
    </div>} />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_340px]">
      <div className="space-y-5">
        <TransferCard title="Upload CSV File">
          <div className="space-y-5">
            <label className="group flex cursor-pointer flex-col items-center justify-center gap-4 border border-dashed border-neutral-950 bg-neutral-50 px-6 py-10 text-center transition hover:bg-neutral-100">
              <input type="file" accept=".csv" className="hidden" onChange={event => {
                const nextFile = event.target.files?.[0] || null;
                setFile(nextFile);
                setFileName(nextFile?.name || '');
              }} />
              <span className="inline-flex h-14 w-14 items-center justify-center border border-neutral-200 bg-white transition group-hover:bg-neutral-950 group-hover:text-white">
                <FileUp size={24} />
              </span>
              <div className="space-y-2">
                <strong className="block text-lg font-semibold text-neutral-950">{fileName ? fileName : 'Drop your CSV file here or click to browse'}</strong>
                <span className="block text-sm text-neutral-500">Upload a properly formatted `.csv` file up to 10MB.</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-neutral-500">
                <span className="border border-neutral-950 bg-white px-2 py-1 text-neutral-950">CSV only</span>
                <span className="border border-neutral-300 bg-white px-2 py-1">Max 10MB</span>
                <span className="border border-neutral-300 bg-white px-2 py-1">Paste supported</span>
              </div>
              <em className="text-xs not-italic text-neutral-400"><kbd className="border border-neutral-300 bg-white px-1.5 py-0.5 font-sans text-[11px]">Ctrl</kbd> + <kbd className="border border-neutral-300 bg-white px-1.5 py-0.5 font-sans text-[11px]">V</kbd> to paste CSV file</em>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Selected File</div>
                <div className="text-sm font-medium text-neutral-950">{fileName || 'No file selected yet'}</div>
              </div>
              <Button type="button" variant="primary" className="rounded-none border border-neutral-200 px-4" onClick={submitImport} disabled={submitting}>
                <Upload size={15} />
                {submitting ? 'Importing...' : 'Validate & Import Data'}
              </Button>
            </div>
          </div>
        </TransferCard>

        <TransferCard title="Import Instructions">
          <ol className="grid gap-3">
            {IMPORT_INSTRUCTIONS.map((item, index) => <li key={item} className="flex items-start gap-3 border border-neutral-200 bg-white px-4 py-3">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-950 text-xs font-semibold text-white">{index + 1}</span>
              <p className="text-sm leading-6 text-neutral-700">{item}</p>
            </li>)}
          </ol>
        </TransferCard>
      </div>

      <aside className="space-y-5">
        <div className="sticky top-28 space-y-5">
          <div className="border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Import Summary</span>
              <strong className="mt-2 block text-2xl font-semibold tracking-tight text-neutral-950">{fileName ? 'Ready to import' : 'Upload required'}</strong>
              <span className="mt-1 block text-sm text-neutral-500">{fileName ? 'CSV selected and ready for validation.' : 'Choose a CSV file to continue.'}</span>
            </div>
            <Button type="button" variant="dark" className="min-h-11 w-full rounded-none border border-neutral-200 px-4" onClick={submitImport} disabled={submitting || !file}>
              <Upload size={15} />
              {submitting ? 'Importing...' : 'Start Import'}
            </Button>
          </div>

        <TransferCard title="Required Fields">
          <div className="grid gap-3">
            {requiredFields.map(field => <div key={field} className="flex items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-950">
              <span className="inline-flex h-6 w-6 items-center justify-center border border-neutral-200 bg-neutral-950 text-xs font-semibold text-white">*</span>
              <span>{field}</span>
            </div>)}
          </div>
        </TransferCard>

        <TransferCard title="Optional Fields">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {IMPORT_OPTIONAL_FIELDS.map(field => <div key={field} className="border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
              {field}
            </div>)}
          </div>
        </TransferCard>
        </div>
      </aside>
    </div>
  </>;
};
const ExportPage = ({
  products
}) => {
  const [format, setFormat] = useState('csv');
  const [scope, setScope] = useState('all');
  const [status, setStatus] = useState('all');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState('start');
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState(EXPORT_FIELDS);
  const totals = useMemo(() => {
    const total = products.length;
    const active = products.filter(item => String(item.status || '').toLowerCase() !== 'inactive').length;
    const services = products.filter(item => String(item.type || '').toLowerCase() === 'service').length;
    return {
      total,
      active,
      services
    };
  }, [products]);
  const selectedCount = selectedColumns.length;
  const scopeCount = useMemo(() => {
    if (scope === 'active') return totals.active;
    if (scope === 'services') return totals.services;
    return totals.total;
  }, [scope, totals]);
  const toggleColumn = field => {
    setSelectedColumns(current => current.includes(field) ? current.filter(item => item !== field) : [...current, field]);
  };
  const allColumnsSelected = selectedColumns.length === EXPORT_FIELDS.length;
  const exportData = () => {
    const params = new URLSearchParams();
    params.set('format', format === 'excel' ? 'excel' : 'csv');
    params.set('scope', scope);
    params.set('status', status);
    if (startDate) params.set('start_date', formatDateParam(startDate));
    if (endDate) params.set('end_date', formatDateParam(endDate));
    if (selectedColumns.length) {
      params.set('columns', selectedColumns.join(','));
    }
    window.location.assign(`/seller/export/inventory?${params.toString()}`);
  };
  const syncDateField = (field, rawValue) => {
    const formattedValue = formatDateInput(rawValue);
    if (field === 'start') {
      setStartDateInput(formattedValue);
      if (formattedValue.length === 10) {
        const parsed = parseDateInput(formattedValue);
        setStartDate(parsed);
        if (parsed) setVisibleMonth(parsed);
      } else {
        setStartDate(null);
      }
      return;
    }
    setEndDateInput(formattedValue);
    if (formattedValue.length === 10) {
      const parsed = parseDateInput(formattedValue);
      setEndDate(parsed);
      if (parsed) setVisibleMonth(parsed);
    } else {
      setEndDate(null);
    }
  };
  const handleDateBlur = field => {
    if (field === 'start') {
      const parsed = parseDateInput(startDateInput);
      if (parsed) {
        setStartDate(parsed);
        setStartDateInput(formatDateLabel(parsed));
      } else if (startDateInput) {
        setStartDate(null);
        setStartDateInput('');
      }
      return;
    }
    const parsed = parseDateInput(endDateInput);
    if (parsed) {
      setEndDate(parsed);
      setEndDateInput(formatDateLabel(parsed));
    } else if (endDateInput) {
      setEndDate(null);
      setEndDateInput('');
    }
  };
  const handleDateSelect = day => {
    const pickedDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    if (activeDateField === 'end') {
      setEndDate(pickedDate);
      setEndDateInput(formatDateLabel(pickedDate));
      return;
    }
    setStartDate(pickedDate);
    setStartDateInput(formatDateLabel(pickedDate));
    setActiveDateField('end');
  };
  const clearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    setStartDateInput('');
    setEndDateInput('');
    setActiveDateField('start');
  };
  const applyDateRange = () => {
    setDateRangeOpen(false);
  };
  const selectedStatusLabel = STATUS_OPTIONS.find(option => option.value === status)?.label || 'All Status';
  return <>
    <SellerPageHeader title="Export Products" description="Choose your export options and download your data." action={<div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="inline-flex min-h-10 items-center gap-2 border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100">
          <File size={14} />
          New
        </button>
        <button type="button" className="inline-flex min-h-10 items-center gap-2 border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100">
          <Table2 size={14} />
          Existing
        </button>
      </div>
      <Button type="button" variant="outline" onClick={() => router.visit('/seller/products')}>
        <ArrowLeft size={15} />
        Back
      </Button>
    </div>} />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_340px]">
      <div className="space-y-5">
        <TransferCard title="">
          <div className="space-y-6">
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Export Type</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {EXPORT_SCOPES.map(option => <button key={option.value} type="button" className={`flex items-start justify-between border px-4 py-4 text-left transition ${scope === option.value ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100'}`} onClick={() => setScope(option.value)}>
                  <div>
                    <strong className="block text-base font-bold">{option.label}</strong>
                    <small className={`mt-1 block text-sm ${scope === option.value ? 'text-white/80' : 'text-neutral-500'}`}>{option.helper}</small>
                  </div>
                  <em className={`text-2xl font-semibold not-italic ${scope === option.value ? 'text-white' : 'text-neutral-950'}`}>{option.value === 'all' ? totals.total : scopeCount}</em>
                </button>)}
              </div>
            </div>

            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">File Format</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {EXPORT_FORMATS.map(option => {
                  const Icon = option.icon;
                  const active = format === option.value;
                  return <button key={option.value} type="button" className={`flex min-h-[112px] flex-col items-start gap-3 border px-4 py-4 text-left transition ${active ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100'}`} onClick={() => setFormat(option.value)}>
                    <span className={`inline-flex h-10 w-10 items-center justify-center border ${active ? 'border-white bg-white/10' : 'border-neutral-950 bg-white'}`}>
                      <Icon size={18} className={active ? 'text-white' : 'text-neutral-950'} />
                    </span>
                    <strong className="block text-base font-bold">{option.label}</strong>
                    <span className={`block text-sm ${active ? 'text-white/80' : 'text-neutral-500'}`}>{option.helper}</span>
                  </button>;
                })}
              </div>
            </div>
          </div>
        </TransferCard>

        <TransferCard>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="inline-flex min-h-10 items-center gap-2 border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100" onClick={() => setSelectedColumns(allColumnsSelected ? [] : EXPORT_FIELDS)}>
              <CheckSquare size={14} />
              {allColumnsSelected ? 'Deselect All' : 'Select All'}
            </button>
            <div className="inline-flex min-h-10 items-center border border-neutral-200 bg-neutral-950 px-3 text-sm font-semibold text-white">{selectedCount} of {EXPORT_FIELDS.length} selected</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {EXPORT_FIELDS.map(field => <label key={field} className={`flex items-center gap-3 border px-4 py-3 text-sm transition ${selectedColumns.includes(field) ? 'border-neutral-950 bg-white text-neutral-950' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100'}`}>
              <input type="checkbox" className="h-4 w-4 accent-neutral-950" checked={selectedColumns.includes(field)} onChange={() => toggleColumn(field)} />
              <span>{field}</span>
            </label>)}
          </div>
        </TransferCard>
      </div>

      <aside className="space-y-5">
        <div className="sticky top-28 space-y-5">
          <div className="border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Ready To Export</span>
              <strong className="mt-2 block text-2xl font-semibold tracking-tight text-neutral-950">{scopeCount} records</strong>
              <span className="mt-1 block text-sm text-neutral-500">{format.toUpperCase()} file with {selectedCount} selected columns</span>
            </div>
            <Button type="button" variant="dark" className="min-h-11 w-full rounded-none border border-neutral-200 px-4" onClick={exportData}>
              <ArrowUpToLine size={15} />
              Export Data
            </Button>
          </div>

          <TransferCard title="Filters">
            <div className="flex flex-col gap-6 mt-2">
              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Date Range</span>
                <DateRangePicker open={dateRangeOpen} onToggle={setDateRangeOpen} startInput={startDateInput} endInput={endDateInput} onStartInputChange={value => syncDateField('start', value)} onEndInputChange={value => syncDateField('end', value)} onInputBlur={handleDateBlur} onDateSelect={handleDateSelect} activeField={activeDateField} setActiveField={setActiveDateField} visibleMonth={visibleMonth} onMonthChange={direction => setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + direction, 1))} startDate={startDate} endDate={endDate} onClear={clearDateRange} onApply={applyDateRange} />
              </label>

              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Status</span>
                <div className="relative">
                  <button type="button" className="flex min-h-11 w-full items-center justify-between border border-neutral-200 bg-white px-3 text-sm text-neutral-950" onClick={() => setStatusMenuOpen(current => !current)}>
                    <span>{selectedStatusLabel}</span>
                    {statusMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {statusMenuOpen && <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 border border-neutral-200 bg-white p-2 shadow-sm">
                    {STATUS_OPTIONS.map(option => <button key={option.value} type="button" className={`flex min-h-10 w-full items-center justify-between border px-3 text-sm font-medium transition ${status === option.value ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100'}`} onClick={() => {
                      setStatus(option.value);
                      setStatusMenuOpen(false);
                    }}>
                      <span>{option.label}</span>
                      {status === option.value && <Check size={16} />}
                    </button>)}
                  </div>}
                </div>
              </label>
            </div>
          </TransferCard>
        </div>
      </aside>
    </div>
  </>;
};
export const SellerProductTransfer = () => {
  const {
    props,
    url
  } = usePage();
  const pathname = new URL(url || window.location.href, window.location.origin).pathname;
  return <div>
    <Sidebar />

    <SellerPageShell>
      {pathname === '/seller/products/export' ? <ExportPage products={props.sellerProducts || []} /> : <ImportPage />}
    </SellerPageShell>
  </div>;
};
export default SellerProductTransfer;
