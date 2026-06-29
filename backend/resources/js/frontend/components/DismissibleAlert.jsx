import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
export const DismissibleAlert = ({
  children,
  className = '',
  duration = 3000,
  onClose,
  role = 'status',
  ...props
}) => {
  const onCloseRef = useRef(onClose);
  const canClose = Boolean(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!canClose) return undefined;
    const timeoutId = window.setTimeout(() => onCloseRef.current?.(), Math.min(duration, 3000));
    return () => window.clearTimeout(timeoutId);
  }, [duration, children, canClose]);
  return <div role={role} className={cn('flex items-start justify-between gap-3 border-2 border-neutral-950 bg-neutral-100 px-4 py-3 text-sm text-neutral-900 shadow-[4px_4px_0_#171717]', className)} {...props}>
      <span className="min-w-0 flex-1">{children}</span>
      {onClose && <button type="button" aria-label="Close notification" onClick={onClose} className="inline-flex h-8 w-8 shrink-0 items-center justify-center border-2 border-neutral-950 bg-white text-neutral-950">
          <X size={16} />
        </button>}
    </div>;
};
export default DismissibleAlert;
