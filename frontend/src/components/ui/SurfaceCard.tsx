import React from 'react';

export type CardTone = 'lowest' | 'low' | 'container' | 'high';

interface SurfaceCardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article';
  tone?: CardTone;
  interactive?: boolean;
}

const TONE_CLASSES: Record<CardTone, string> = {
  lowest: 'bg-surface-container-lowest shadow-sm',
  low: 'bg-surface-container-low',
  container: 'bg-surface-container',
  high: 'bg-surface-container-high',
};

/**
 * Canonical tonal card container following Tutorías Pro Living Styleguide v2.4 (Section 01 & 05).
 */
export function SurfaceCard({
  as: Component = 'div',
  tone = 'lowest',
  interactive = false,
  className = '',
  children,
  ...props
}: SurfaceCardProps) {
  return (
    <Component
      className={`rounded-xl transition-all ${TONE_CLASSES[tone]} ${
        interactive ? 'hover:shadow-md group' : ''
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}
