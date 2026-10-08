import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Check, Copy, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { copyText } from '../../lib/clipboard';
import { QUESTIONS, getSatisfactionOption } from '../../lib/constants';
import { formatAbsolute, formatRelative } from '../../lib/format';
import type { Answer, Choice, Feedback, FeedbackStatus } from '../../types/feedback';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { AudioPlayer } from './AudioPlayer';
import { SatisfactionBadge } from './SatisfactionBadge';
import { StatusSelect } from './StatusSelect';

export interface FeedbackDrawerProps {
  item: Feedback | null;
  onClose: () => void;
  onStatusChange: (id: string, status: FeedbackStatus) => Promise<void>;
  onDelete: (id: string, audioPath: string | null) => Promise<void>;
}

const CHOICE_BADGE_STYLE: Record<Choice, string> = {
  excellent: 'bg-success/15 text-success border-success/30',
  satisfactory: 'bg-warning/15 text-warning border-warning/30',
  wants_improvements: 'bg-danger/15 text-danger border-danger/30',
};

export const FeedbackDrawer: React.FC<FeedbackDrawerProps> = ({
  item,
  onClose,
  onStatusChange,
  onDelete,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Esc key closes drawer & Focus management
  useEffect(() => {
    if (!item) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    drawerRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [item, onClose]);

  if (!item) return null;

  const handleCopy = async (key: string, text: string) => {
    const ok = await copyText(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      await onDelete(item.id, item.audio_path || null);
      setShowConfirmDelete(false);
      onClose();
    } catch {
      /* handled in hook */
    } finally {
      setDeleting(false);
    }
  };

  const hasAnswers = item.feedback_answers && item.feedback_answers.length > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Feedback detail view">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-bg/80 backdrop-blur-sm"
        />

        {/* Sliding Panel (full screen sheet on mobile, right side drawer on desktop) */}
        <div className="fixed inset-y-0 right-0 w-full max-w-full sm:max-w-xl flex pl-0 sm:pl-10">
          <motion.div
            ref={drawerRef}
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full bg-raised border-l border-line/15 p-4 sm:p-6 shadow-2xl flex flex-col gap-6 overflow-y-auto focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-line/10">
              <div className="min-w-0">
                <span className="eyebrow">Feedback Detail</span>
                <dl className="mt-1 flex flex-col gap-0.5">
                  <dt className="sr-only">Name</dt>
                  <dd>
                    <h2 className="text-xl font-bold text-fg break-words">{item.client_name || 'Anonymous Client'}</h2>
                  </dd>
                  <dt className="sr-only">Company</dt>
                  <dd className="text-sm font-medium text-fg-2 break-words">{item.company_name || '—'}</dd>
                </dl>
                {item.project && <p className="text-xs text-fg-3 mt-0.5">{item.project}</p>}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full text-fg-3 hover:text-fg"
                  aria-label="Close detail view"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Quick Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card border border-line/10 rounded-control">
              <div className="flex items-center gap-2">
                <span className="text-xs text-fg-3 font-medium">Status:</span>
                <StatusSelect
                  value={item.status}
                  onChange={(status) => void onStatusChange(item.id, status)}
                />
              </div>

              <div className="flex items-center gap-1 text-xs text-fg-3 tabular" title={formatAbsolute(item.created_at)}>
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatAbsolute(item.created_at)}</span>
              </div>
            </div>

            {/* Question Sections */}
            {hasAnswers ? (
              /* Multi-question answers cards */
              <div className="flex flex-col gap-5">
                {QUESTIONS.map((q) => {
                  const ans: Answer | undefined = item.feedback_answers?.find((a) => a.question_no === q.no);
                  const opt = ans?.choice ? getSatisfactionOption(ans.choice) : null;
                  const hasMsg = Boolean(ans?.message?.trim());
                  const hasAudio = Boolean(ans?.audio_path);

                  return (
                    <div key={q.no} className="flex flex-col gap-3 p-4 bg-card border border-line/10 rounded-card shadow-sm">
                      {/* Question Label & Choice Badge */}
                      <div className="flex items-start justify-between gap-3 pb-2 border-b border-line/5">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider">
                            Question {q.no}
                          </span>
                          <p lang="gu" className="text-sm font-medium text-fg leading-relaxed mt-0.5">
                            {q.label}
                          </p>
                        </div>
                        {opt && (
                          <span
                            className={`shrink-0 inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border whitespace-nowrap ${CHOICE_BADGE_STYLE[ans!.choice]}`}
                          >
                            {opt.en} / {opt.gu}
                          </span>
                        )}
                      </div>

                      {/* Message Text */}
                      {hasMsg && (
                        <div className="flex flex-col gap-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs text-fg-3">
                            <span className="font-semibold uppercase tracking-wider text-[10px]">Typed Comments</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(`q_${q.no}`, ans!.message!)}
                              icon={
                                copiedKey === `q_${q.no}` ? (
                                  <Check className="w-3.5 h-3.5 text-success" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )
                              }
                              className="h-6 px-2 text-[11px]"
                            >
                              {copiedKey === `q_${q.no}` ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                          <p className="text-sm text-fg whitespace-pre-wrap leading-relaxed select-text bg-raised/50 p-3 rounded-control border border-line/5">
                            {ans!.message}
                          </p>
                        </div>
                      )}

                      {/* Audio Player */}
                      {hasAudio && (
                        <div className="flex flex-col gap-1.5 pt-1">
                          <span className="text-[10px] font-semibold text-fg-3 uppercase tracking-wider">
                            Voice Note
                          </span>
                          <AudioPlayer
                            audioPath={ans!.audio_path || null}
                            audioMime={ans!.audio_mime || null}
                            storedDurationSec={ans!.audio_duration_sec || null}
                          />
                        </div>
                      )}

                      {/* Fallback if no message & no audio */}
                      {!hasMsg && !hasAudio && (
                        <p className="text-xs text-fg-3 italic py-1">No additional comments</p>
                      )}

                      {/* Dev-only debug line */}
                      <div className="text-[10px] text-fg-3 font-mono border-t border-line/10 pt-2 mt-1 flex flex-wrap gap-2">
                        <span>audio_path: {ans?.audio_path || 'null'}</span>
                        <span>|</span>
                        <span>audio_mime: {ans?.audio_mime || 'null'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Legacy rows fallback */
              <div className="flex flex-col gap-4">
                {/* Question 1 Legacy Card */}
                <div className="flex items-start justify-between gap-3 p-4 bg-card border border-line/10 rounded-card">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider">Question 1</span>
                    <p lang="gu" className="text-sm font-medium text-fg leading-relaxed mt-0.5">
                      {QUESTIONS[0]?.label}
                    </p>
                  </div>
                  <SatisfactionBadge satisfaction={item.satisfaction || null} rating={item.rating || null} />
                </div>

                {/* Question 2 / Message Legacy Card */}
                {item.message ? (
                  <div className="flex flex-col gap-1.5 p-4 bg-card border border-line/10 rounded-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-accent-fg uppercase tracking-wider">
                        Question 2 / Comments
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy('legacy_message', item.message!)}
                        icon={
                          copiedKey === 'legacy_message' ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )
                        }
                        className="h-7 text-xs"
                      >
                        {copiedKey === 'legacy_message' ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <p className="text-sm text-fg whitespace-pre-wrap leading-relaxed select-text">{item.message}</p>
                  </div>
                ) : (
                  (item.liked || item.changes_needed) && (
                    <div className="flex flex-col gap-3">
                      {item.liked && (
                        <div className="p-4 bg-card border border-line/10 rounded-card flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-accent-fg uppercase tracking-wider">Liked</span>
                          <p className="text-sm text-fg whitespace-pre-wrap select-text">{item.liked}</p>
                        </div>
                      )}
                      {item.changes_needed && (
                        <div className="p-4 bg-card border border-line/10 rounded-card flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-warning uppercase tracking-wider">Changes needed</span>
                          <p className="text-sm text-fg whitespace-pre-wrap select-text">{item.changes_needed}</p>
                        </div>
                      )}
                    </div>
                  )
                )}

                {/* Legacy Voice Note Player */}
                {item.audio_path && (
                  <div className="flex flex-col gap-2 p-4 bg-card border border-line/10 rounded-card">
                    <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider">Voice Note</span>
                    <AudioPlayer
                      audioPath={item.audio_path}
                      audioMime={item.audio_mime || null}
                      storedDurationSec={item.audio_duration_sec || null}
                    />
                    <div className="text-[10px] text-fg-3 font-mono border-t border-line/10 pt-2 mt-1 flex flex-wrap gap-2">
                      <span>audio_path: {item.audio_path}</span>
                      <span>|</span>
                      <span>audio_mime: {item.audio_mime || 'null'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delete Footer */}
            <div className="mt-auto pt-4 border-t border-line/10 flex items-center justify-between text-xs text-fg-3">
              <span title={formatAbsolute(item.created_at)}>
                Received {formatRelative(item.created_at)}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmDelete(true)}
                icon={<Trash2 className="w-3.5 h-3.5 text-danger" />}
                className="text-danger hover:bg-danger/10"
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={showConfirmDelete}
          onOpenChange={setShowConfirmDelete}
          title="Delete feedback entry?"
          description="This action cannot be undone. Any recorded voice notes will be permanently removed."
        >
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" size="md" onClick={() => setShowConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={deleting}
              onClick={handleDeleteConfirmed}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </Button>
          </div>
        </Dialog>
      </div>
    </AnimatePresence>
  );
};
