import React from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IconProps {
  children: React.ReactNode;
  filled?: boolean;
  size?: IconSize;
  style?: React.CSSProperties;
  className?: string;
}

const SIZE_CLASSES: Record<IconSize, string> = {
  xs: 'text-[14px]',
  sm: 'text-[16px]',
  md: 'text-[18px]',
  lg: 'text-[20px]',
  xl: 'text-[24px]',
};

export function Icon({ children, filled = false, size, style, className = '' }: IconProps) {
  const sizeClass = size ? SIZE_CLASSES[size] : '';
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined leading-none select-none shrink-0 ${sizeClass} ${className}`.trim()}
      style={{
        ...(filled ? { fontVariationSettings: "'FILL' 1" } : {}),
        ...style,
      }}
    >
      {children}
    </span>
  );
}
