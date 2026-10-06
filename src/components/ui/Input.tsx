import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = error && inputId ? `${inputId}-error` : undefined;
    const hintId = hint && inputId ? `${inputId}-hint` : undefined;
    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-fg-2">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3.5 text-fg-3 pointer-events-none">{icon}</div>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              'w-full h-11 px-3.5 bg-raised text-fg text-sm placeholder:text-fg-3 border border-line/10 rounded-control transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
              icon && 'pl-10',
              error && 'border-danger focus-visible:ring-danger',
              className,
            )}
            {...props}
          />
        </div>
        {hint && !error && (
          <p id={hintId} className="text-xs text-fg-3">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-danger font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
