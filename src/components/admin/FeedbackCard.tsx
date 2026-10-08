import { Mic, MessageSquare } from 'lucide-react';
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
  return (
    <Card
      variant="glass"
      onClick={onClick}
      className="p-4 flex flex-col gap-3 cursor-pointer hover:border-line/20 transition-all select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm text-fg">
            {item.client_name || 'Anonymous Client'}
          </h4>
          {item.company_name && <p className="text-xs text-fg-3">{item.company_name}</p>}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <StatusSelect value={item.status} onChange={onStatusChange} size="sm" />
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-fg-2">
        <SatisfactionBadge satisfaction={item.satisfaction} rating={item.rating} />

        {item.audio_path ? (
          <span className="flex items-center gap-1 text-fg-2 tabular">
            <Mic className="w-3.5 h-3.5 text-accent-fg" />
            {formatClock(item.audio_duration_sec)}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-fg-3">
            <MessageSquare className="w-3.5 h-3.5" /> Text note
          </span>
        )}

        <span className="ml-auto text-[11px] text-fg-3 tabular">
          {formatRelative(item.created_at)}
        </span>
      </div>

      {(item.liked || item.changes_needed) && (
        <p className="text-xs text-fg-2 line-clamp-2 bg-raised/50 p-2.5 rounded-control border border-line/5">
          {item.liked || item.changes_needed}
        </p>
      )}
    </Card>
  );
};
