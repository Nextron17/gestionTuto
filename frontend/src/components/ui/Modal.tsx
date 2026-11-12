'use client';

import React from 'react';
import { Icon } from './Icon';

type ModalTone = 'primary' | 'danger' | 'warning' | 'success';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  tone?: ModalTone;
  maxWidthClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const ICON_CONTAINER_CLASSES: Record<ModalTone, string> = {
  primary: 'bg-primary-fixed text-primary',
  danger: 'bg-error-container text-error',
  warning: 'bg-tertiary-fixed text-tertiary',
  success: 'bg-[#dcfce7] text-[#16a34a]',
};

const DEFAULT_ICONS: Record<ModalTone, string> = {
  primary: 'calendar_add_on',
  danger: 'warning',
  warning: 'schedule',
  success: 'check_circle',
};

/**
 * Canonical Modal & Dialog component aligned with Tutorías Pro Living Styleguide v2.4 (Section 06).
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  tone = 'primary',
  maxWidthClassName = 'max-w-lg',
  children,
  footer,
}: ModalProps) {
  if (!open) return null;

  const modalIcon = icon || DEFAULT_ICONS[tone];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/25 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative z-10 w-full ${maxWidthClassName} bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {/* Modal Header */}
        <div className="px-space-md py-3.5 bg-surface-container-low flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ICON_CONTAINER_CLASSES[tone]}`}
            >
              <Icon className="text-[18px]">{modalIcon}</Icon>
            </div>
            <div className="min-w-0">
              <h3 className="font-label-md text-label-md font-bold text-on-surface truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11px] text-on-surface-variant truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar diálogo"
            className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <Icon className="text-[18px]">close</Icon>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-space-md space-y-space-sm overflow-y-auto">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-space-md py-3 bg-surface-container-low flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

