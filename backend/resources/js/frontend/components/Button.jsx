import React from 'react';
import { cn } from '../utils/cn';
const variantClasses = {
  primary: 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800 hover:border-slate-800 focus-visible:ring-slate-300',
  secondary: 'border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200 hover:border-slate-300 focus-visible:ring-slate-200',
  outline: 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-slate-200',
  ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-200',
  dark: 'border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30 focus-visible:ring-white/30',
  icon: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-slate-200'
};
const sizeClasses = {
  sm: 'min-h-8 px-3 text-xs',
  md: 'min-h-9 px-3.5 text-[13px]',
  lg: 'min-h-10 px-4 text-[13px]'
};
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  disabled = false,
  className = '',
  ...props
}) => {
  const isIconVariant = variant === 'icon';
  return <button type={type} onClick={onClick} disabled={disabled} className={cn('inline-flex items-center justify-center gap-2 border font-medium transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60', isIconVariant ? 'h-10 w-10 p-0' : sizeClasses[size], variantClasses[variant], className)} {...props}>
      {children}
    </button>;
};
