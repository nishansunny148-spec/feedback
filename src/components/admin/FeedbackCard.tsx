import { Mic } from 'lucide-react';
import React from 'react';
import { formatClock, formatRelative } from '../../lib/format';
import type { Feedback, FeedbackStatus } from '../../types/feedback';
import { Card } from '../ui/Card';
import { SatisfactionBadge } from './SatisfactionBadge';
import { StatusSelect } from './StatusSelect';

export interface FeedbackCardProps {
  item: Feedback;
  onClick: () => void;
  onStatusChange: (newStatus: FeedbackStatus) => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ item, onClick, onStatusChange }) => {
  const previewText = item.message || item.liked || item.changes_needed;

  return (
    <Card
      variant="glass"
      onClick={onClick}
      className="p-4 flex flex-col gap-3 cursor-pointer hover:border-line/20 transition-all select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-fg">
            {item.client_name || 'Anonymous Client'}
          </h4>
          <p className="text-xs text-fg-3">{item.company_name || '—'}</p>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <StatusSelect value={item.status} onChange={onStatusChange} size="sm" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <SatisfactionBadge satisfaction={item.satisfaction} rating={item.rating} />

        {item.audio_path && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent-fg tabular text-xs font-medium ml-auto">
            <Mic className="w-3 h-3" />
            {formatClock(item.audio_duration_sec)}
          </span>
        )}

        <span className="ml-auto text-[11px] text-fg-3 tabular">
          {formatRelative(item.created_at)}
        </span>
      </div>

      {previewText && (
        <p className="text-xs text-fg-2 line-clamp-2 bg-raised/50 p-2.5 rounded-control border border-line/5">
          {previewText}
        </p>
      )}
    </Card>
  );
};
