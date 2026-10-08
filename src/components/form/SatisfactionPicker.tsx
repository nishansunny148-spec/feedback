import React from 'react';
import { cn } from '../../lib/cn';
import { QUESTION_1_LABEL, SATISFACTION_OPTIONS, type SatisfactionTone } from '../../lib/constants';
import type { Satisfaction } from '../../types/feedback';

export interface SatisfactionPickerProps {
  value: Satisfaction | undefined;
  onChange: (value: Satisfaction) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
}

const DOT: Record<SatisfactionTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

/** Question 1: single-choice radio cards (native radios for keyboard + screen reader support). */
export const SatisfactionPicker: React.FC<SatisfactionPickerProps> = ({ value, onChange, onBlur, error, disabled }) => {
  const errorId = error ? 'field-satisfaction-error' : undefined;

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={errorId} aria-invalid={Boolean(error)}>
      <legend className="text-xs text-fg-2 mb-2">
        {QUESTION_1_LABEL} <span aria-hidden="true">*</span>
      </legend>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {SATISFACTION_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                'relative flex items-center gap-3 min-h-[56px] w-full px-4 py-3 rounded-control border cursor-pointer select-none transition-all duration-200',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg',
                selected
                  ? 'bg-accent/10 border-accent shadow-sm'
                  : 'bg-raised border-line/10 hover:border-line/30 hover:bg-card',
                error && !selected && 'border-danger/60',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              <input
                type="radio"
                name="satisfaction"
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                onBlur={onBlur}
                disabled={disabled}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  selected ? 'border-accent-fg' : 'border-line/30',
                )}
              >
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-transform duration-200',
                    selected ? 'scale-100 bg-accent-fg' : 'scale-0',
                  )}
                />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-fg leading-tight">{opt.en}</span>
                <span lang="gu" className="text-xs text-fg-2">
                  {opt.gu}
                </span>
              </span>
              <span aria-hidden="true" className={cn('ml-auto shrink-0 w-2 h-2 rounded-full', DOT[opt.tone])} />
            </label>
          );
        })}
      </div>

      {error && (
        <p id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
};
