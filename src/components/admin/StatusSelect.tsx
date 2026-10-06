import React from 'react';
import { cn } from '../../lib/cn';
import type { FeedbackStatus } from '../../types/feedback';

export interface StatusSelectProps {
  value: FeedbackStatus;
  onChange: (newStatus: FeedbackStatus) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'sm',
}) => {
  const styles: Record<FeedbackStatus, string> = {
    new: 'bg-accent/15 text-accent-fg border-accent/30',
    in_progress: 'bg-warning/15 text-warning border-warning/30',
    done: 'bg-success/15 text-success border-success/30',
  };

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as FeedbackStatus)}
      className={cn(
        'font-medium rounded-full border transition-colors cursor-pointer focus-ring select-none text-xs',
        size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5',
        styles[value],
      )}
    >
      <option value="new" className="bg-raised text-fg">
        New
      </option>
      <option value="in_progress" className="bg-raised text-fg">
        In progress
      </option>
      <option value="done" className="bg-raised text-fg">
        Done
      </option>
    </select>
  );
};
