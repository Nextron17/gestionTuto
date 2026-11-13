import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/**
 * Standardized responsive page header with Inter headline typography, optional eyebrow, and right-side actions.
 */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
      <div className="space-y-1 min-w-0">
        {eyebrow && (
          <span className="block font-label-md text-[11px] sm:text-[12px] uppercase tracking-wider text-outline font-semibold">
            {eyebrow}
          </span>
        )}
        <h1 className="font-headline-lg text-xl sm:text-2xl lg:text-[2rem] lg:leading-[2.5rem] font-semibold tracking-tight text-on-surface break-words">
          {title}
        </h1>
        {description && (
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
