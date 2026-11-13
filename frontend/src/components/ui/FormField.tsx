'use client';

import React from 'react';
import { Icon } from './Icon';

type ValidationState = 'default' | 'error' | 'success';

interface BaseFieldProps {
  label?: string;
  hint?: string;
  errorMessage?: string;
  successMessage?: string;
  icon?: string;
  validationState?: ValidationState;
  containerClassName?: string;
}

export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    BaseFieldProps {
  rightElement?: React.ReactNode;
}

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    BaseFieldProps {}

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {}

function getValidationClasses(state: ValidationState) {
  if (state === 'error') {
    return {
      label: 'text-error',
      icon: 'text-error',
      input:
        'bg-error-container/30 text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-error',
    };
  }
  if (state === 'success') {
    return {
      label: 'text-[#166534]',
      icon: 'text-[#16a34a]',
      input:
        'bg-[#dcfce7]/40 text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-[#16a34a]',
    };
  }
  return {
    label: 'text-on-surface',
    icon: 'text-outline group-focus-within:text-primary',
    input:
      'bg-surface-container text-on-surface hover:bg-surface-container-high focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary',
  };
}

export function FormInput({
  label,
  hint,
  errorMessage,
  successMessage,
  icon,
  validationState,
  rightElement,
  containerClassName = '',
  className = '',
  id,
  ...props
}: FormInputProps) {
  const effectiveState: ValidationState =
    validationState || (errorMessage ? 'error' : successMessage ? 'success' : 'default');
  const styles = getValidationClasses(effectiveState);
  const hasRightStatusIcon = effectiveState !== 'default' && !rightElement;

  return (
    <div className={`w-full ${containerClassName}`.trim()}>
      {label && (
        <label
          htmlFor={id}
          className={`block font-label-md text-[13px] font-semibold mb-1.5 ${styles.label}`}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center group">
        {icon && (
          <Icon
            className={`absolute left-3 text-[18px] pointer-events-none transition-colors ${styles.icon}`}
          >
            {icon}
          </Icon>
        )}
        <input
          id={id}
          className={`w-full ${icon ? 'pl-10' : 'pl-3.5'} ${
            rightElement || hasRightStatusIcon ? 'pr-10' : 'pr-3.5'
          } py-2.5 rounded-lg text-sm placeholder:text-outline focus:outline-none transition-all border-none ${
            styles.input
          } ${className}`.trim()}
          {...props}
        />
        {rightElement && <div className="absolute right-3 flex items-center">{rightElement}</div>}
        {hasRightStatusIcon && (
          <Icon
            className={`absolute right-3 text-[18px] pointer-events-none ${
              effectiveState === 'error' ? 'text-error' : 'text-[#16a34a]'
            }`}
          >
            {effectiveState === 'error' ? 'error' : 'check_circle'}
          </Icon>
        )}
      </div>

      {errorMessage ? (
        <span className="mt-1 text-[11px] text-error font-label-md font-medium flex items-center gap-1">
          <Icon className="text-[14px]">warning</Icon>
          <span>{errorMessage}</span>
        </span>
      ) : successMessage ? (
        <span className="mt-1 text-[11px] text-[#166534] font-label-md font-medium flex items-center gap-1">
          <Icon className="text-[14px]">check_circle</Icon>
          <span>{successMessage}</span>
        </span>
      ) : hint ? (
        <span className="block mt-1 text-[11px] text-on-surface-variant font-label-md">{hint}</span>
      ) : null}
    </div>
  );
}

export function FormSelect({
  label,
  hint,
  errorMessage,
  successMessage,
  icon,
  validationState,
  containerClassName = '',
  className = '',
  id,
  children,
  ...props
}: FormSelectProps) {
  const effectiveState: ValidationState =
    validationState || (errorMessage ? 'error' : successMessage ? 'success' : 'default');
  const styles = getValidationClasses(effectiveState);

  return (
    <div className={`w-full ${containerClassName}`.trim()}>
      {label && (
        <label
          htmlFor={id}
          className={`block font-label-md text-[13px] font-semibold mb-1.5 ${styles.label}`}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center group">
        {icon && (
          <Icon
            className={`absolute left-3 text-[18px] pointer-events-none transition-colors ${styles.icon}`}
          >
            {icon}
          </Icon>
        )}
        <select
          id={id}
          className={`w-full py-2.5 ${
            icon ? 'pl-10' : 'pl-3.5'
          } pr-10 rounded-lg text-sm appearance-none focus:outline-none cursor-pointer transition-all border-none ${
            styles.input
          } ${className}`.trim()}
          {...props}
        >
          {children}
        </select>
        <Icon className="absolute right-3 text-outline pointer-events-none text-[20px]">
          expand_more
        </Icon>
      </div>
      {errorMessage ? (
        <span className="mt-1 text-[11px] text-error font-label-md font-medium flex items-center gap-1">
          <Icon className="text-[14px]">warning</Icon>
          <span>{errorMessage}</span>
        </span>
      ) : hint ? (
        <span className="block mt-1 text-[11px] text-on-surface-variant font-label-md">{hint}</span>
      ) : null}
    </div>
  );
}

export function FormTextarea({
  label,
  hint,
  errorMessage,
  successMessage,
  validationState,
  containerClassName = '',
  className = '',
  id,
  ...props
}: FormTextareaProps) {
  const effectiveState: ValidationState =
    validationState || (errorMessage ? 'error' : successMessage ? 'success' : 'default');
  const styles = getValidationClasses(effectiveState);

  return (
    <div className={`w-full ${containerClassName}`.trim()}>
      {label && (
        <label
          htmlFor={id}
          className={`block font-label-md text-[13px] font-semibold mb-1.5 ${styles.label}`}
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full px-3.5 py-2.5 rounded-lg text-sm placeholder:text-outline focus:outline-none transition-all border-none ${styles.input} ${className}`.trim()}
        {...props}
      />
      {errorMessage ? (
        <span className="mt-1 text-[11px] text-error font-label-md font-medium flex items-center gap-1">
          <Icon className="text-[14px]">warning</Icon>
          <span>{errorMessage}</span>
        </span>
      ) : hint ? (
        <span className="block mt-1 text-[11px] text-on-surface-variant font-label-md">{hint}</span>
      ) : null}
    </div>
  );
}

