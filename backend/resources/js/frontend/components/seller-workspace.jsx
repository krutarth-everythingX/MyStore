import React from 'react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { cn } from '../utils/cn';

export const SellerPageShell = ({ children, className = '' }) => (
  <main className={cn('min-h-dvh bg-neutral-50 pl-0 lg:pl-24', className)}>
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 pb-8 pt-28 sm:px-6 lg:px-8">
      {children}
    </div>
  </main>
);

export const SellerPageHeader = ({ title, description, stats = [], action, className = '' }) => (
  <header className={cn('border border-neutral-200 bg-white p-5 shadow-sm sm:p-6', className)}>
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600">{description}</p> : null}
      </div>

      {action ? <div className="flex flex-wrap gap-3 xl:justify-end">{action}</div> : null}
      </div>

      {stats.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={`${title} summary`}>
          {stats.map((stat) => (
            <article
              key={stat.label}
              className={cn(
                'border border-neutral-200 bg-neutral-50 p-4',
                stat.tone === 'green' && 'bg-white',
                stat.tone === 'blue' && 'bg-white',
                stat.tone === 'purple' && 'bg-white',
                stat.tone === 'amber' && 'bg-white',
                stat.tone === 'red' && 'bg-white',
                stat.tone === 'gray' && 'bg-neutral-100',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{stat.label}</span>
                  <strong className="mt-2 block break-words text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">{stat.value}</strong>
                </div>
                {stat.icon ? (
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-white text-neutral-950">
                    <stat.icon size={15} className="text-neutral-700" />
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  </header>
);

export const SellerCard = ({ children, className = '' }) => (
  <section className={cn('border border-neutral-200 bg-white p-5 shadow-sm sm:p-6', className)}>
    {children}
  </section>
);

export const SellerToolbar = ({ search, actions, className = '' }) => (
  <div className={cn('flex flex-col gap-4 border border-neutral-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between', className)}>
    <div className="min-w-0 flex-1">{search}</div>
    <div className="flex flex-wrap gap-3">{actions}</div>
  </div>
);

export const SellerSearchField = ({ icon: Icon, value, onChange, placeholder, className = '' }) => (
  <label className={cn('flex min-h-12 items-center gap-3 border border-neutral-200 bg-neutral-50 px-4', className)}>
    {Icon ? <Icon size={16} className="text-neutral-600" /> : null}
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400"
    />
  </label>
);

export const SellerToolbarActions = ({ children, className = '' }) => (
  <div className={cn('flex flex-wrap gap-3', className)}>{children}</div>
);

export const SellerPanelWrap = ({ children, className = '' }) => (
  <div className={cn('grid gap-5 xl:grid-cols-2', className)}>{children}</div>
);

export const SellerFloatingPanel = ({ children, className = '' }) => (
  <div className={cn('border border-neutral-200 bg-white p-4 shadow-sm', className)}>
    {children}
  </div>
);

export const SellerCheckboxOption = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900">
    <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-neutral-950" />
    <span>{label}</span>
  </label>
);

export const SellerFilterOption = ({ label, children }) => (
  <label className="space-y-2">
    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</span>
    {children}
  </label>
);

export const SellerSelect = ({ className = '', children, ...props }) => (
  <select
    {...props}
    className={cn('min-h-11 w-full border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none', className)}
  >
    {children}
  </select>
);

export const SellerTextarea = ({ className = '', ...props }) => (
  <textarea
    {...props}
    className={cn('min-h-[120px] w-full border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-950 outline-none', className)}
  />
);

export const SellerTableWrap = ({ children, className = '' }) => (
  <div className={cn('overflow-hidden', className)}>{children}</div>
);

export const SellerTableSurface = ({ children, className = '' }) => (
  <section className={cn('border border-neutral-200 bg-white shadow-sm', className)}>
    {children}
  </section>
);

export const SellerGridHead = ({ children, style, className = '' }) => (
  <div
    style={style}
    className={cn('grid border-b border-neutral-200 bg-neutral-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500', className)}
  >
    {children}
  </div>
);

export const SellerGridBody = ({ children, className = '' }) => (
  <div className={cn('divide-y-2 divide-neutral-200', className)}>{children}</div>
);

export const SellerGridRow = ({ children, style, className = '' }) => (
  <div style={style} className={cn('grid items-center gap-3 px-4 py-4 text-sm text-neutral-800', className)}>
    {children}
  </div>
);

export const SellerGridCell = ({ children, className = '' }) => (
  <div className={cn('min-w-0', className)}>{children}</div>
);

export const SellerSortHeader = ({ active, direction, children, className = '', ...props }) => (
  <button
    type="button"
    {...props}
    aria-sort={active ? direction === 'desc' ? 'descending' : 'ascending' : 'none'}
    className={cn('flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-[0.16em]', active ? 'text-neutral-950' : 'text-neutral-500', className)}
  >
    <span className="truncate">{children}</span>
    <ChevronDown size={12} className={cn('shrink-0 transition', active ? 'opacity-100' : 'opacity-35', active && direction === 'desc' ? 'rotate-180' : '')} />
  </button>
);

export const SellerPill = ({ children, tone = 'neutral', className = '' }) => (
  <span
    className={cn(
      'inline-flex items-center border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
      tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
      tone === 'warn' && 'border-amber-200 bg-amber-50 text-amber-800',
      tone === 'danger' && 'border-rose-200 bg-rose-50 text-rose-800',
      tone === 'info' && 'border-sky-200 bg-sky-50 text-sky-800',
      tone === 'blue' && 'border-blue-200 bg-blue-50 text-blue-800',
      tone === 'neutral' && 'border-neutral-300 bg-neutral-100 text-neutral-700',
      className,
    )}
  >
    {children}
  </span>
);

export const SellerEmptyState = ({ title, description, action, className = '' }) => (
  <div className={cn('border border-neutral-200 bg-neutral-100 p-8 text-center shadow-sm', className)}>
    <strong className="block text-lg font-semibold text-neutral-950">{title}</strong>
    <span className="mt-2 block text-sm leading-7 text-neutral-600">{description}</span>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

export const SellerAvatar = ({ children, className = '' }) => (
  <span className={cn('inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-950 text-sm font-semibold uppercase text-white', className)}>
    {children}
  </span>
);

export const SellerActionButtons = ({ children, className = '' }) => (
  <div className={cn('flex flex-wrap gap-2', className)}>{children}</div>
);

export const SellerIconButton = ({ danger = false, className = '', children, ...props }) => (
  <button
    type="button"
    {...props}
    className={cn(
      'inline-flex h-9 w-9 items-center justify-center border bg-white transition',
      danger ? 'border-rose-700 text-rose-700 hover:bg-white' : 'border-neutral-950 text-neutral-950 hover:bg-neutral-100',
      className,
    )}
  >
    {children}
  </button>
);

export const SellerMenuButton = ({ className = '', ...props }) => (
  <button
    type="button"
    {...props}
    className={cn(
      'inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100',
      className,
    )}
  >
    <MoreHorizontal size={16} />
  </button>
);

export const SellerMenuPanel = ({ children, className = '' }) => (
  <div className={cn('absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-[180px] border border-neutral-200 bg-white p-2 shadow-sm', className)}>
    {children}
  </div>
);

export const SellerMenuItem = ({ danger = false, className = '', children, ...props }) => (
  <button
    type="button"
    {...props}
    className={cn(
      'flex min-h-10 w-full items-center gap-3 border px-3 text-sm font-medium transition',
      danger ? 'border-rose-700 bg-white text-rose-700 hover:bg-neutral-100' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100',
      className,
    )}
  >
    {children}
  </button>
);

export const SellerTableFooter = ({ children, showBorder = true, className = '' }) => (
  <footer className={cn('flex flex-col gap-3 bg-neutral-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between', showBorder && 'border-t border-neutral-200', className)}>
    {children}
  </footer>
);

export const SellerPaginationControls = ({ currentPage, totalPages, pageNumbers, onPageChange, className = '' }) => {
  if (totalPages <= 1) return null;

  return (
    <nav className={cn('flex flex-wrap items-center justify-end gap-2', className)}>
      <ButtonLike disabled={currentPage === 1} onClick={() => onPageChange(1)}>{'<<'} First</ButtonLike>
      <ButtonLike disabled={currentPage === 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))}>{'<'} Back</ButtonLike>
      {pageNumbers.map((page) => (
        <ButtonLike key={page} active={page === currentPage} onClick={() => onPageChange(page)}>
          {page}
        </ButtonLike>
      ))}
      <ButtonLike disabled={currentPage === totalPages} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}>Next {'>'}</ButtonLike>
      <ButtonLike disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)}>Last {'>>'}</ButtonLike>
    </nav>
  );
};

export const SellerTablePaginationBar = ({
  summary,
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange,
  perPage,
  onPerPageChange,
  perPageOptions = [10, 100, 1000],
  showBorder = true,
  className = '',
}) => (
  <SellerTableFooter showBorder={showBorder} className={cn('lg:flex-nowrap', className)}>
    <span className="text-sm text-neutral-600">{summary}</span>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:ml-auto lg:flex-nowrap">
      <SellerPaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageNumbers={pageNumbers}
        onPageChange={onPageChange}
        className="sm:ml-0"
      />
      <label className="flex items-center gap-3 whitespace-nowrap">
        <span className="text-sm font-medium text-neutral-700">Per page:</span>
        <SellerSelect value={perPage} onChange={onPerPageChange} className="min-h-10 w-auto min-w-[88px]">
          {perPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SellerSelect>
      </label>
    </div>
  </SellerTableFooter>
);

export const SellerPaginationCard = ({ children, className = '' }) => (
  <div className={cn('border border-neutral-200 bg-white p-4 shadow-sm', className)}>
    {children}
  </div>
);

const ButtonLike = ({ active = false, disabled = false, children, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'inline-flex min-h-10 items-center justify-center border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
      active ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100',
    )}
  >
    {children}
  </button>
);

export const SellerModalBackdrop = ({ children, onClose }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-950/35 px-4 py-6" onMouseDown={onClose}>
    {children}
  </div>
);

export const SellerModalCard = ({ children, className = '', onMouseDown }) => (
  <div className={cn('w-full max-w-2xl max-h-[90dvh] overflow-y-auto border border-neutral-200 bg-neutral-50 p-6 shadow-sm', className)} onMouseDown={onMouseDown}>
    {children}
  </div>
);
