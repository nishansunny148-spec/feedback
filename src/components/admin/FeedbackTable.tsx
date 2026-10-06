import { ArrowDown, ArrowUp, Mic, MessageSquare, Star } from 'lucide-react';
import React from 'react';
import { formatClock, formatAbsolute, formatRelative } from '../../lib/format';
import type { Feedback, FeedbackSort, FeedbackStatus, SortDirection } from '../../types/feedback';
import { StatusSelect } from './StatusSelect';

export interface FeedbackTableProps {
  items: Feedback[];
  onSelect: (item: Feedback) => void;
  onStatusChange: (id: string, newStatus: FeedbackStatus) => void;
  sort: FeedbackSort;
  dir: SortDirection;
  onSortChange: (sort: FeedbackSort, dir: SortDirection) => void;
}

export const FeedbackTable: React.FC<FeedbackTableProps> = ({
  items,
  onSelect,
  onStatusChange,
  sort,
  dir,
  onSortChange,
}) => {
  const toggleSort = (column: FeedbackSort) => {
    if (sort === column) {
      onSortChange(column, dir === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(column, 'desc');
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-card border border-line/10 bg-raised/50 shadow-glass">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-line/10 bg-raised text-xs font-mono uppercase text-fg-3">
            <th scope="col" className="py-3.5 px-4 font-medium">
              Status
            </th>
            <th scope="col" className="py-3.5 px-4 font-medium">
              Client & Project
            </th>
            <th scope="col" className="py-3.5 px-4 font-medium cursor-pointer select-none" onClick={() => toggleSort('rating')}>
              <div className="flex items-center gap-1">
                <span>Rating</span>
                {sort === 'rating' && (dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
              </div>
            </th>
            <th scope="col" className="py-3.5 px-4 font-medium">
              Voice Note
            </th>
            <th scope="col" className="py-3.5 px-4 font-medium cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
              <div className="flex items-center gap-1">
                <span>Received</span>
                {sort === 'created_at' && (dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/5">
          {items.map((item) => (
            <tr
              key={item.id}
              tabIndex={0}
              onClick={() => onSelect(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(item);
                }
              }}
              className="group hover:bg-card/70 focus-ring cursor-pointer transition-colors"
            >
              <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                <StatusSelect value={item.status} onChange={(status) => onStatusChange(item.id, status)} />
              </td>

              <td className="py-3.5 px-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-fg group-hover:text-accent-fg transition-colors">
                    {item.client_name || 'Anonymous Client'}
                  </span>
                  {item.project && <span className="text-xs text-fg-3">{item.project}</span>}
                </div>
              </td>

              <td className="py-3.5 px-4">
                {item.rating ? (
                  <span className="inline-flex items-center gap-1 font-mono font-medium text-accent-fg text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {item.rating}/5
                  </span>
                ) : (
                  <span className="text-xs text-fg-3">—</span>
                )}
              </td>

              <td className="py-3.5 px-4">
                {item.audio_path ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent-fg font-mono text-xs">
                    <Mic className="w-3.5 h-3.5" />
                    {formatClock(item.audio_duration_sec)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-fg-3">
                    <MessageSquare className="w-3.5 h-3.5" /> Text only
                  </span>
                )}
              </td>

              <td className="py-3.5 px-4">
                <span title={formatAbsolute(item.created_at)} className="text-xs text-fg-3 tabular">
                  {formatRelative(item.created_at)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
