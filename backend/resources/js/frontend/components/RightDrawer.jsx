import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
export const RightDrawer = ({
  isOpen,
  onClose,
  title,
  children,
  wide = false
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  if (typeof document === 'undefined') {
    return null;
  }
  if (!isOpen) {
    return null;
  }
  return createPortal(
    <div className="fixed inset-0 z-[70] bg-neutral-950/35" onClick={onClose}>
      <div
        className={cn(
          'ml-auto flex h-dvh w-full flex-col border-l border-neutral-200 bg-neutral-50 shadow-[-10px_0_0_#171717]',
          wide ? 'max-w-3xl' : 'max-w-xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 sm:px-6">
          <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center border border-neutral-200 bg-white text-neutral-950 transition hover:bg-neutral-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};
