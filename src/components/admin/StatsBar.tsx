import React from 'react';
import { SATISFACTION_OPTIONS, type SatisfactionTone } from '../../lib/constants';
import type { FeedbackStats } from '../../types/feedback';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

export interface StatsBarProps {
  stats: FeedbackStats | null;
  loading?: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-card" />
        ))}
      </div>
    );
  }

  const items = [
    { label: 'Total', value: stats.total, color: 'text-fg' },
    { label: 'New', value: stats.new, color: 'text-accent-fg' },
    { label: 'In progress', value: stats.in_progress, color: 'text-warning' },
    { label: 'Done', value: stats.done, color: 'text-success' },
  ];

  const toneText: Record<SatisfactionTone, string> = {
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
      {items.map((item) => (
        <Card key={item.label} variant="raised" className="p-4 flex flex-col gap-1">
          <span className="eyebrow">{item.label}</span>
          <span className={`text-2xl font-bold tracking-tight tabular ${item.color}`}>{item.value}</span>
        </Card>
      ))}

      <Card variant="raised" className="col-span-2 sm:col-span-1 p-4 flex flex-col gap-1">
        <span className="eyebrow">{SATISFACTION_OPTIONS.map((o) => o.short).join(' / ')}</span>
        <div className="flex items-baseline gap-1.5 text-2xl font-bold tracking-tight tabular">
          {SATISFACTION_OPTIONS.map((o, i) => (
            <React.Fragment key={o.value}>
              {i > 0 && <span className="text-fg-3 text-base font-normal">/</span>}
              <span className={toneText[o.tone]} title={o.en}>
                {stats.satisfaction[o.value]}
              </span>
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
};
