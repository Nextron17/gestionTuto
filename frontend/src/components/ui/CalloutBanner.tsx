import React from 'react';
import { Icon } from './Icon';

export type CalloutTone = 'info' | 'primary' | 'success' | 'warning' | 'danger';

interface CalloutBannerProps {
  title?: string;
  icon?: string;
  tone?: CalloutTone;
  className?: string;
  children: React.ReactNode;
}

const TONE_STYLES: Record<
  CalloutTone,
  { container: string; iconColor: string; titleColor: string; defaultIcon: string }
> = {
  info: {
    container: 'bg-secondary-fixed/50 text-on-secondary-fixed',
    iconColor: 'text-primary',
    titleColor: 'text-on-surface',
    defaultIcon: 'info',
  },
  primary: {
    container: 'bg-primary-fixed/50 text-on-primary-fixed',
    iconColor: 'text-primary',
    titleColor: 'text-on-primary-fixed',
    defaultIcon: 'info',
  },
  success: {
    container: 'bg-[#dcfce7]/60 text-[#166534]',
    iconColor: 'text-[#16a34a]',
    titleColor: 'text-[#166534]',
    defaultIcon: 'check_circle',
  },
  warning: {
    container: 'bg-[#fef3c7]/70 text-[#92400e]',
    iconColor: 'text-tertiary',
    titleColor: 'text-on-tertiary-fixed',
    defaultIcon: 'warning',
  },
  danger: {
    container: 'bg-error-container/40 text-on-error-container',
    iconColor: 'text-error',
    titleColor: 'text-error',
    defaultIcon: 'report',
  },
};

/**
 * Canonical Callout & Info Banner following Tutorías Pro Living Styleguide v2.4 (Section 05).
 */
export function CalloutBanner({
  title,
  icon,
  tone = 'info',
  className = '',
  children,
}: CalloutBannerProps) {
  const style = TONE_STYLES[tone];
  const resolvedIcon = icon || style.defaultIcon;

  return (
    <div
      className={`p-3.5 sm:p-space-md rounded-xl flex items-start gap-2.5 sm:gap-3 min-w-0 ${style.container} ${className}`.trim()}
    >
      <Icon className={`text-[20px] shrink-0 mt-0.5 ${style.iconColor}`}>{resolvedIcon}</Icon>
      <div className="min-w-0 flex-1 break-words">
        {title && (
          <h5 className={`font-label-md text-xs sm:text-label-md font-bold mb-0.5 ${style.titleColor}`}>
            {title}
          </h5>
        )}
        <div className="font-body-md text-[12px] text-on-surface-variant leading-relaxed break-words">
          {children}
        </div>
      </div>
    </div>
  );
}
