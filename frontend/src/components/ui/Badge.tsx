import React from 'react';
import { Icon } from './Icon';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'high';

interface BadgeProps {
  variant?: BadgeVariant;
  pill?: boolean;
  dot?: boolean;
  pulseDot?: boolean;
  onRemove?: () => void;
  className?: string;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary: 'bg-primary-fixed text-on-primary-fixed',
  secondary: 'bg-secondary-fixed text-on-secondary-fixed',
  tertiary: 'bg-tertiary-fixed text-on-tertiary-fixed',
  success: 'bg-[#dcfce7] text-[#166534]',
  warning: 'bg-[#fef3c7] text-[#92400e]',
  error: 'bg-error-container text-on-error-container',
  neutral: 'bg-surface-container text-on-surface-variant',
  high: 'bg-surface-container-highest text-on-surface',
};

const DOT_COLOR_CLASSES: Record<BadgeVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  success: 'bg-[#16a34a]',
  warning: 'bg-tertiary',
  error: 'bg-error',
  neutral: 'bg-outline',
  high: 'bg-on-surface',
};

/**
 * Canonical status badge and filter chip following Tutorías Pro Living Styleguide v2.4 (Section 04).
 */
export function Badge({
  variant = 'neutral',
  pill = true,
  dot = false,
  pulseDot = false,
  onRemove,
  className = '',
  children,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-label-md text-[12px] font-semibold transition-colors ${
        pill ? 'rounded-full' : 'rounded-md'
      } ${VARIANT_CLASSES[variant]} ${className}`.trim()}
    >
      {(dot || pulseDot) && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLOR_CLASSES[variant]} ${
            pulseDot ? 'animate-pulse' : ''
          }`}
        />
      )}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Quitar filtro"
          className="text-outline hover:text-error transition-colors cursor-pointer inline-flex items-center ml-0.5"
        >
          <Icon className="text-[14px]">close</Icon>
        </button>
      )}
    </span>
  );
}
