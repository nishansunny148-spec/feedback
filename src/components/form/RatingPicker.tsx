import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../lib/cn';

export interface RatingPickerProps {
  value: number | null;
  onChange: (rating: number) => void;
  error?: string;
}

const RATINGS = [
  { value: 1, label: '1 - Poor', emoji: '😠' },
  { value: 2, label: '2 - Fair', emoji: '🙁' },
  { value: 3, label: '3 - Good', emoji: '😐' },
  { value: 4, label: '4 - Great', emoji: '🙂' },
  { value: 5, label: '5 - Excellent', emoji: '🤩' },
];

export const RatingPicker: React.FC<RatingPickerProps> = ({ value, onChange, error }) => {
  const handleKeyDown = (e: React.KeyboardEvent, currentValue: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(5, currentValue + 1);
      onChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(1, currentValue - 1);
      onChange(prev);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label id="rating-picker-label" className="text-xs font-medium text-fg-2">
          Overall rating
        </label>
        {value && <span className="text-xs font-medium text-accent-fg font-mono">{value} / 5</span>}
      </div>

      <div
        role="radiogroup"
        aria-labelledby="rating-picker-label"
        className="grid grid-cols-5 gap-2"
      >
        {RATINGS.map((item) => {
          const isSelected = value === item.value;
          return (
            <motion.button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={item.label}
              tabIndex={isSelected || (value === null && item.value === 1) ? 0 : -1}
              whileTap={{ scale: 0.94 }}
              onClick={() => onChange(item.value)}
              onKeyDown={(e) => handleKeyDown(e, item.value)}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 h-16 rounded-control border transition-all focus-ring select-none',
                isSelected
                  ? 'bg-accent/15 border-accent text-accent-fg font-semibold shadow-sm'
                  : 'bg-raised border-line/10 text-fg-2 hover:border-line/20 hover:text-fg',
              )}
            >
              <span className="text-xl" role="img" aria-hidden="true">
                {item.emoji}
              </span>
              <span className="text-xs font-mono">{item.value}</span>
            </motion.button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs text-danger font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
