import React from 'react';
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
    {
      label: 'Avg Rating',
      value: stats.averageRating !== null ? `${stats.averageRating.toFixed(1)} ★` : 'N/A',
      color: 'text-accent-fg font-mono',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
      {items.map((item) => (
        <Card key={item.label} variant="raised" className="p-4 flex flex-col gap-1">
          <span className="eyebrow">{item.label}</span>
          <span className={`text-2xl font-bold tracking-tight ${item.color}`}>{item.value}</span>
        </Card>
      ))}
    </div>
  );
};
