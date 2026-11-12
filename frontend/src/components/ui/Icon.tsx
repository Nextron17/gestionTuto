import React from 'react';

interface IconProps {
  children: React.ReactNode;
  filled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function Icon({ children, filled = false, style, className = '' }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`.trim()}
      style={{
        ...(filled ? { fontVariationSettings: "'FILL' 1" } : {}),
        ...style,
      }}
    >
      {children}
    </span>
  );
}

