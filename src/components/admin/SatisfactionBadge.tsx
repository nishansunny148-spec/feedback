import { Star } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/cn';
import { getSatisfactionOption, type SatisfactionTone } from '../../lib/constants';
import type { Satisfaction } from '../../types/feedback';

const TONE: Record<SatisfactionTone, string> = {
  success: 'bg-success/15 text-success border-success/25',
  warning: 'bg-warning/15 text-warning border-warning/25',
  danger: 'bg-danger/15 text-danger border-danger/25',
};

export interface SatisfactionBadgeProps {
  satisfaction: Satisfaction | null;
  /** Legacy 1–5 rating shown (muted) for old rows without a satisfaction value. */
  rating?: number | null;
  className?: string;
}

export const SatisfactionBadge: React.FC<SatisfactionBadgeProps> = ({ satisfaction, rating, className }) => {
  if (!satisfaction) {
    return (
      <span className={cn('inline-flex items-center gap-2 text-xs text-fg-3', className)}>
        <span>—</span>
        {typeof rating === 'number' && (
          <span className="inline-flex items-center gap-0.5 tabular" title="Legacy rating">
            <Star className="w-3 h-3" />
            {rating}/5
          </span>
        )}
      </span>
    );
  }

  const opt = getSatisfactionOption(satisfaction);
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full border whitespace-nowrap',
        TONE[opt.tone],
        className,
      )}
    >
      {opt.en}
    </span>
  );
};
