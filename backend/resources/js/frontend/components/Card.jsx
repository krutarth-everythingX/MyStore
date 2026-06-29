import React from 'react';
import { cn } from '../utils/cn';
export const Card = ({
  children,
  title,
  eyebrow,
  extra,
  className = '',
  ...props
}) => {
  return <section className={cn('border border-neutral-200 bg-white p-5 shadow-sm sm:p-6', className)} {...props}>
      {(title || extra) && <div className="mb-5 flex flex-col gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          {title && <div className="min-w-0">
              {eyebrow && <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{eyebrow}</span>}
              <h3 className="mt-1 text-xl font-semibold tracking-tight text-neutral-950">{title}</h3>
            </div>}
          {extra ? <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-white text-neutral-950">{extra}</div> : null}
        </div>}
      <div className="space-y-5">
        {children}
      </div>
    </section>;
};
