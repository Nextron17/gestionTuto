'use client';

import React from 'react';
import { Icon } from './Icon';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  icon?: string;
  label?: string;
  shortcut?: string;
  onClear?: () => void;
  containerClassName?: string;
  variant?: 'default' | 'tonal' | 'lowest';
}

const VARIANT_CLASSES: Record<NonNullable<SearchInputProps['variant']>, string> = {
  default:
    'bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-lowest',
  tonal:
    'bg-surface-container-low hover:bg-surface-container focus:bg-surface-container-lowest',
  lowest:
    'bg-surface-container-lowest hover:bg-surface-container-low focus:bg-surface-container-lowest shadow-xs',
};

/**
 * Canonical search bar aligned with Tutorías Pro Living Styleguide v2.4 (Section 03).
 */
export function SearchInput({
  icon = 'search',
  label,
  shortcut,
  onClear,
  value,
  containerClassName = '',
  className = '',
  variant = 'default',
  id,
  ...props
}: SearchInputProps) {
  const hasValue = typeof value === 'string' && value.length > 0;
  const hasRightControls = Boolean(shortcut || (hasValue && onClear));

  return (
    <div className={`w-full ${containerClassName}`.trim()}>
      {label && (
        <label
          htmlFor={id}
          className="block font-label-md text-label-md font-semibold text-on-surface mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full group">
        <Icon className="absolute left-3 text-outline group-focus-within:text-primary pointer-events-none text-[20px] transition-colors">
          {icon}
        </Icon>
        <input
          id={id}
          type="text"
          value={value}
          className={`w-full pl-10 ${
            hasRightControls ? 'pr-20' : 'pr-3.5'
          } py-2.5 rounded-lg text-sm text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:outline-none transition-all border-none ${VARIANT_CLASSES[variant]} ${className}`.trim()}
          {...props}
        />
        {hasRightControls && (
          <div className="absolute right-3 flex items-center gap-1.5">
            {shortcut && (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-container-highest text-outline font-mono text-[11px] font-semibold select-none">
                {shortcut}
              </kbd>
            )}
            {hasValue && onClear && (
              <button
                type="button"
                onClick={onClear}
                aria-label="Limpiar búsqueda"
                className="text-outline hover:text-on-surface p-0.5 rounded-md hover:bg-surface-container-high transition-colors cursor-pointer flex items-center justify-center"
              >
                <Icon className="text-[16px]">close</Icon>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
