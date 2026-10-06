import { ChevronDown } from 'lucide-react';
import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, hint, id, disabled, ...props }, ref) => {
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
          <select
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              'w-full h-11 pl-3.5 pr-9 bg-raised text-fg text-sm border border-line/10 rounded-control transition-colors focus-ring appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-danger focus-visible:ring-danger',
              className,
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-raised text-fg">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 w-4 h-4 text-fg-3 pointer-events-none" />
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

Select.displayName = 'Select';
