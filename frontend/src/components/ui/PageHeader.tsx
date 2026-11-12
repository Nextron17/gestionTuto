import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/**
 * Standardized page header with Inter headline typography, optional eyebrow, and right-side actions.
 */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        {eyebrow && (
          <span className="block font-label-md text-[12px] uppercase tracking-wider text-outline font-semibold">
            {eyebrow}
          </span>
        )}
        <h1 className="font-headline-lg text-2xl sm:text-[2rem] sm:leading-[2.5rem] font-semibold tracking-tight text-on-surface">
          {title}
        </h1>
        {description && (
          <p className="font-body-md text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
