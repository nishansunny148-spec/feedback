import { ChevronRight, Mic } from 'lucide-react';
import React from 'react';
import { QUESTIONS, getSatisfactionOption } from '../../lib/constants';
import { formatRelative } from '../../lib/format';
import type { Choice, Feedback, FeedbackStatus } from '../../types/feedback';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { StatusSelect } from './StatusSelect';

export interface FeedbackCardProps {
  item: Feedback;
  onClick: () => void;
  onStatusChange: (newStatus: FeedbackStatus) => void;
}

const CHOICE_BADGE_STYLE: Record<Choice, string> = {
  excellent: 'bg-success/15 text-success border-success/30',
  satisfactory: 'bg-warning/15 text-warning border-warning/30',
  wants_improvements: 'bg-danger/15 text-danger border-danger/30',
};

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ item, onClick, onStatusChange }) => {
  const hasAnswers = item.feedback_answers && item.feedback_answers.length > 0;

  // Voice note count
  let voiceCount = 0;
  if (hasAnswers) {
    voiceCount = item.feedback_answers!.filter((a) => Boolean(a.audio_path)).length;
  } else if (item.audio_path) {
    voiceCount = 1;
  }

  // Preview message
  let firstMsg: string | null = null;
  if (hasAnswers) {
    const ansWithMsg = item.feedback_answers!.find((a) => Boolean(a.message?.trim()));
    if (ansWithMsg?.message) firstMsg = ansWithMsg.message.trim();
  }
  if (!firstMsg) {
    firstMsg = item.message?.trim() || item.liked?.trim() || item.changes_needed?.trim() || null;
  }

  return (
    <Card
      variant="glass"
      onClick={onClick}
      className="p-4 flex flex-col gap-3 cursor-pointer hover:border-line/20 transition-all select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-fg">{item.client_name || 'Anonymous Client'}</h4>
          <p className="text-xs text-fg-3">{item.company_name || '—'}</p>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <StatusSelect value={item.status} onChange={onStatusChange} size="sm" />
        </div>
      </div>

      {/* Badges per question */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {QUESTIONS.map((q) => {
          let choice: Choice | null = null;
          if (hasAnswers) {
            const found = item.feedback_answers!.find((a) => a.question_no === q.no);
            if (found) choice = found.choice;
          } else if (q.no === 1 && item.satisfaction) {
            choice = item.satisfaction;
          } else if (q.no === 2 && item.satisfaction_q2) {
            choice = item.satisfaction_q2;
          }

          if (!choice) return null;
          const opt = getSatisfactionOption(choice);
          return (
            <span
              key={q.no}
              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border whitespace-nowrap ${CHOICE_BADGE_STYLE[choice]}`}
            >
              Q{q.no}: {opt.short}
            </span>
          );
        })}

        {voiceCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent-fg tabular text-[10px] font-bold ml-auto">
            <Mic className="w-3 h-3" />
            {voiceCount}
          </span>
        )}

        <span className="ml-auto text-[11px] text-fg-3 tabular">{formatRelative(item.created_at)}</span>
      </div>

      {firstMsg && (
        <p className="text-xs text-fg-2 line-clamp-2 bg-raised/50 p-2.5 rounded-control border border-line/5">
          {firstMsg}
        </p>
      )}

      <div className="flex justify-end pt-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" onClick={onClick} icon={<ChevronRight className="w-3.5 h-3.5" />}>
          Details
        </Button>
      </div>
    </Card>
  );
};
