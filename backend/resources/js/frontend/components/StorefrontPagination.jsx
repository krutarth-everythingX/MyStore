import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const buildPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  const items = [];

  sorted.forEach((page, index) => {
    if (index > 0) {
      const previous = sorted[index - 1];
      if (page - previous > 1) {
        items.push(`ellipsis-${previous}-${page}`);
      }
    }

    items.push(page);
  });

  return items;
};

const baseButtonClassName = 'inline-flex h-11 min-w-11 items-center justify-center border-2 px-3 text-sm font-medium transition';

export const StorefrontPagination = ({ currentPage, totalPages, onPageChange, className = '' }) => {
  const items = useMemo(() => buildPaginationItems(currentPage, totalPages), [currentPage, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-3 border-2 border-neutral-950 bg-white p-3 shadow-[8px_8px_0_#171717] sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
        Page {currentPage} of {totalPages}
      </div>

      <nav className="flex flex-wrap items-center gap-2" aria-label="Pagination">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className={`${baseButtonClassName} gap-2 border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100 disabled:border-neutral-200 disabled:text-neutral-400 disabled:hover:bg-white`}
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {items.map((item) => (
            typeof item === 'number' ? (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={currentPage === item ? 'page' : undefined}
                className={`${baseButtonClassName} ${
                  currentPage === item
                    ? 'border-neutral-950 bg-neutral-950 text-white'
                    : 'border-neutral-200 bg-white text-neutral-950 hover:border-neutral-950 hover:bg-neutral-100'
                }`}
              >
                {item}
              </button>
            ) : (
              <span
                key={item}
                className="inline-flex h-11 min-w-11 items-center justify-center border-2 border-neutral-200 bg-neutral-50 px-2 text-neutral-400"
                aria-hidden="true"
              >
                <MoreHorizontal size={16} />
              </span>
            )
          ))}
        </div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className={`${baseButtonClassName} gap-2 border-neutral-950 bg-white text-neutral-950 hover:bg-neutral-100 disabled:border-neutral-200 disabled:text-neutral-400 disabled:hover:bg-white`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
};

export default StorefrontPagination;
