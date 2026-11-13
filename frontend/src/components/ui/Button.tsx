'use client';

import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'tonal'
  | 'secondary'
  | 'outline'
  | 'subtle'
  | 'tertiary'
  | 'danger'
  | 'ghost'
  | 'icon';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary shadow-sm hover:bg-primary-container hover:shadow-md active:scale-[0.98]',
  tonal:
    'bg-primary-fixed text-on-primary-fixed-variant hover:bg-secondary-fixed-dim hover:text-on-secondary-fixed active:scale-[0.98]',
  secondary:
    'bg-surface-container-high text-on-surface hover:bg-surface-variant active:scale-[0.98]',
  outline:
    'bg-surface-container-high text-on-surface hover:bg-surface-variant active:scale-[0.98]',
  subtle:
    'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface active:scale-[0.98]',
  tertiary:
    'bg-tertiary text-on-tertiary shadow-sm hover:bg-tertiary-container active:scale-[0.98]',
  danger:
    'bg-error text-on-error shadow-sm hover:opacity-90 active:scale-[0.98]',
  ghost:
    'bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface active:scale-[0.98]',
  icon:
    'w-10 h-10 rounded-full bg-surface-container text-on-surface-variant hover:bg-primary-fixed hover:text-primary active:scale-95 p-0',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-[2rem] px-3 py-1.5 text-xs rounded-lg',
  md: 'min-h-[2.5rem] px-4 py-2.5 text-sm rounded-lg',
  lg: 'min-h-[3rem] px-6 py-3 text-[15px] rounded-lg',
};

/**
 * Canonical action button following Tutorías Pro Living Styleguide v2.4 (Section 02).
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sizeClass = variant === 'icon' ? '' : SIZE_CLASSES[size];

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 font-label-md font-medium transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none disabled:opacity-60 disabled:pointer-events-none ${
        loading ? 'cursor-wait' : ''
      } ${VARIANT_CLASSES[variant]} ${sizeClass} ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 text-current shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            fill="currentColor"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
