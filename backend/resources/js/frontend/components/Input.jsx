import React from 'react';
import { cn } from '../utils/cn';
export const Input = ({
  label,
  error,
  type = 'text',
  className = '',
  inputClassName = '',
  labelClassName = '',
  as = 'input',
  rows = 4,
  ...props
}) => {
  const sharedClassName = cn('w-full rounded-lg border border-slate-300 bg-white px-4 text-[13px] text-slate-900 shadow-sm transition-colors duration-150', 'placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200/70', error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100', as === 'textarea' ? 'min-h-28 py-3.5' : 'h-10', inputClassName);
  return <div className={cn('space-y-2', className)}>
      {label && <label className={cn('block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500', labelClassName)}>
          {label}
        </label>}

      {as === 'textarea' ? <textarea rows={rows} className={sharedClassName} {...props} /> : <input type={type} className={sharedClassName} {...props} />}

      {error && <span className="block text-xs font-medium text-rose-600">{error}</span>}
    </div>;
};
