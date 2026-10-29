import { MessageSquare, Mic } from 'lucide-react';
import { QUESTIONS } from '../../lib/constants';
import type { StoredAnswer } from '../../types/feedback';

export function OpenAnswerMarkers({ answers = [] }: { answers?: StoredAnswer[] }) {
  return QUESTIONS.filter((q) => !q.picker).map((q) => {
    const answer = answers.find((a) => a.question_no === q.no);
    const message = answer?.message?.trim();
    const hasAudio = Boolean(answer?.audio_path);
    const filled = Boolean(message || hasAudio);
    const label = `Q${q.no}: ${message ? message.slice(0, 60) : hasAudio ? 'Voice note' : 'No answer'}`;
    const Icon = hasAudio ? Mic : MessageSquare;
    return (
      <span key={q.no} title={label} aria-label={label} className="inline-flex text-fg-3 shrink-0">
        <Icon className={`w-3.5 h-3.5 ${filled ? 'fill-current' : 'fill-none'}`} />
      </span>
    );
  });
}
