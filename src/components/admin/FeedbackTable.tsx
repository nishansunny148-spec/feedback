import { ArrowDown, ArrowUp, ChevronRight, Mic } from 'lucide-react';
import React from 'react';
import { QUESTIONS, PICKER_QUESTION_COUNT, getSatisfactionOption } from '../../lib/constants';
import { formatAbsolute, formatRelative } from '../../lib/format';
import type { Choice, Feedback, FeedbackSort, FeedbackStatus, SortDirection } from '../../types/feedback';
import { Button } from '../ui/Button';
import { StatusSelect } from './StatusSelect';
import { OpenAnswerMarkers } from './OpenAnswerMarkers';

export interface FeedbackTableProps {
  items: Feedback[];
  onSelect: (item: Feedback) => void;
  onStatusChange: (id: string, newStatus: FeedbackStatus) => void;
  sort: FeedbackSort;
  dir: SortDirection;
  onSortChange: (sort: FeedbackSort, dir: SortDirection) => void;
}

const SQUARE_STYLE: Record<Choice, string> = {
  excellent: 'bg-emerald-500 border-emerald-600',
  satisfactory: 'bg-amber-500 border-amber-600',
  wants_improvements: 'bg-red-500 border-red-600',
};

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
          <tr className="border-b border-line/10 bg-raised text-xs uppercase tracking-wider text-fg-3">
            <th scope="col" className="py-3.5 px-4 font-normal">
              Status
            </th>
            <th scope="col" className="py-3.5 px-4 font-normal">
              Client
            </th>
            <th scope="col" className="py-3.5 px-4 font-normal">
              Answers
            </th>
            <th scope="col" className="py-3.5 px-4 font-normal">
              Notes
            </th>
            <th scope="col" className="py-3.5 px-4 font-normal cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
              <div className="flex items-center gap-1">
                <span>Received</span>
                {sort === 'created_at' && (dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
              </div>
            </th>
            <th scope="col" className="py-3.5 px-4 font-normal text-right">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/5">
          {items.map((item) => {
            const hasAnswers = item.feedback_answers && item.feedback_answers.length > 0;

            // Answers compact squares per question
            let answeredCount = 0;
            const answerSquares = QUESTIONS.filter((q) => q.picker).map((q) => {
              let choice: Choice | null = null;
              if (hasAnswers) {
                const found = item.feedback_answers!.find((a) => a.question_no === q.no);
                if (found) choice = found.choice;
              } else if (q.no === 1 && item.satisfaction) {
                choice = item.satisfaction;
              } else if (q.no === 2 && item.satisfaction_q2) {
                choice = item.satisfaction_q2;
              }

              if (choice) {
                answeredCount++;
                const opt = getSatisfactionOption(choice);
                const label = `Q${q.no}: ${opt.en}`;
                return (
                  <span
                    key={q.no}
                    style={{ width: '14px', height: '14px' }}
                    className={`inline-block rounded-[3px] border ${SQUARE_STYLE[choice]} shrink-0`}
                    title={label}
                    aria-label={label}
                  />
                );
              }

              return (
                <span
                  key={q.no}
                  style={{ width: '14px', height: '14px' }}
                  className="inline-block rounded-[3px] border border-fg-3/30 bg-transparent shrink-0"
                  title={`Q${q.no}: No answer`}
                  aria-label={`Q${q.no}: No answer`}
                />
              );
            });

            // Count voice notes
            let voiceCount = 0;
            if (hasAnswers) {
              voiceCount = item.feedback_answers!.filter((a) => Boolean(a.audio_path)).length;
            } else if (item.audio_path) {
              voiceCount = 1;
            }

            // Extract first non-empty message preview
            let firstMsg: string | null = null;
            if (hasAnswers) {
              const ansWithMsg = item.feedback_answers!.find((a) => Boolean(a.message?.trim()));
              if (ansWithMsg?.message) firstMsg = ansWithMsg.message.trim();
            }
            if (!firstMsg) {
              firstMsg = item.message?.trim() || item.liked?.trim() || item.changes_needed?.trim() || null;
            }

            const truncatedPreview = firstMsg
              ? firstMsg.length > 40
                ? firstMsg.slice(0, 40) + '…'
                : firstMsg
              : null;

            return (
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
                {/* Status column */}
                <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                  <StatusSelect value={item.status} onChange={(status) => onStatusChange(item.id, status)} />
                </td>

                {/* Client column */}
                <td className="py-3.5 px-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-fg group-hover:text-accent-fg transition-colors">
                      {item.client_name || 'Anonymous Client'}
                    </span>
                    <span className="text-xs text-fg-3">{item.company_name || '—'}</span>
                  </div>
                </td>

                {/* Answers column */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1" role="group" aria-label="Question ratings">
                      {answerSquares}
                    </div>
                    <span className="text-xs text-fg-3 tabular font-medium">
                      {answeredCount}/{PICKER_QUESTION_COUNT}
                    </span>
                    <OpenAnswerMarkers answers={item.feedback_answers} />
                  </div>
                </td>

                {/* Notes column */}
                <td className="py-3.5 px-4 max-w-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {voiceCount > 0 && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent-fg tabular text-xs font-semibold shrink-0"
                        title={`${voiceCount} voice note(s)`}
                      >
                        <Mic className="w-3 h-3" />
                        {voiceCount}
                      </span>
                    )}
                    <span
                      className="text-xs text-fg-3 truncate"
                      title={firstMsg || undefined}
                    >
                      {truncatedPreview || (voiceCount > 0 ? 'Voice note' : '—')}
                    </span>
                  </div>
                </td>

                {/* Received column */}
                <td className="py-3.5 px-4">
                  <span title={formatAbsolute(item.created_at)} className="text-xs text-fg-3 tabular">
                    {formatRelative(item.created_at)}
                  </span>
                </td>

                {/* Details button column */}
                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelect(item)}
                    icon={<ChevronRight className="w-4 h-4" />}
                    aria-label="View details"
                  >
                    Details
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
