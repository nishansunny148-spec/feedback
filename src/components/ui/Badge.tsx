import React from 'react';
import { cn } from '../../lib/cn';
import type { FeedbackStatus } from '../../types/feedback';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'new' | 'in_progress' | 'done' | 'default' | 'accent' | 'danger';
  status?: FeedbackStatus;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ className, variant, status, children, ...props }) => {
  const activeVariant = status || variant || 'default';

  const variants = {
    new: 'bg-accent/15 text-accent-fg border-accent/20',
    in_progress: 'bg-warning/15 text-warning border-warning/20',
    done: 'bg-success/15 text-success border-success/20',
    default: 'bg-raised text-fg-2 border-line/10',
    accent: 'bg-accent text-accent-ink font-semibold',
    danger: 'bg-danger/15 text-danger border-danger/20',
  };

  const labelMap: Record<string, string> = {
    new: 'New',
    in_progress: 'In progress',
    done: 'Done',
  };

  const text = children || (status ? labelMap[status] : null);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border border-transparent whitespace-nowrap',
        variants[activeVariant],
        className,
      )}
      {...props}
    >
      {activeVariant === 'new' && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />}
      {text}
    </span>
  );
};
