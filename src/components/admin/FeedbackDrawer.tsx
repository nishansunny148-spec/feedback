import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Check, Copy, Star, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { copyText } from '../../lib/clipboard';
import { getSatisfactionOption, QUESTION_1_LABEL, QUESTION_2_LABEL } from '../../lib/constants';
import { formatAbsolute, formatMime, formatRelative } from '../../lib/format';
import type { Feedback, FeedbackStatus } from '../../types/feedback';
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

export const FeedbackDrawer: React.FC<FeedbackDrawerProps> = ({
  item,
  onClose,
  onStatusChange,
  onDelete,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  if (!item) return null;

  const q1Answer = item.satisfaction ? getSatisfactionOption(item.satisfaction) : null;

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
      await onDelete(item.id, item.audio_path);
      setShowConfirmDelete(false);
      onClose();
    } catch {
      /* handled in hook */
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-bg/80 backdrop-blur-sm"
        />

        {/* Sliding Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-screen max-w-xl bg-raised border-l border-line/15 p-6 shadow-2xl flex flex-col gap-6 overflow-y-auto"
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
                <span className="text-xs text-fg-3">Status:</span>
                <StatusSelect
                  value={item.status}
                  onChange={(status) => void onStatusChange(item.id, status)}
                />
              </div>

              {typeof item.rating === 'number' && (
                <div className="flex items-center gap-1 tabular text-xs text-fg-3" title="Legacy rating">
                  <Star className="w-3.5 h-3.5" />
                  {item.rating} / 5
                </div>
              )}
            </div>

            {/* Question 1 Answer */}
            <div className="flex items-start justify-between gap-3 p-4 bg-card border border-line/10 rounded-card">
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider">{QUESTION_1_LABEL}</span>
                {q1Answer ? (
                  <div className="mt-1 flex flex-col gap-0.5">
                    <span className="text-base font-bold text-fg leading-tight">{q1Answer.en}</span>
                    <span lang="gu" className="text-xs text-fg-2">
                      {q1Answer.gu}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-fg-3 mt-1">Not answered (older submission)</span>
                )}
              </div>
              <SatisfactionBadge satisfaction={item.satisfaction} rating={item.rating} />
            </div>

            {/* Question 2 Response (Tell Us More Message) OR Legacy Text Answers */}
            {item.message ? (
              <div className="flex flex-col gap-1.5 p-4 bg-card border border-line/10 rounded-card">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-accent-fg uppercase tracking-wider">
                      Question 2 / Tell Us More
                    </span>
                    <span lang="gu" className="text-xs text-fg-3 font-normal mt-0.5">
                      {QUESTION_2_LABEL}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy('message', item.message!)}
                    icon={
                      copiedKey === 'message' ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )
                    }
                    className="h-7 text-xs"
                  >
                    {copiedKey === 'message' ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-sm text-fg whitespace-pre-wrap leading-relaxed">{item.message}</p>
              </div>
            ) : (
              /* Old rows fallback: show liked and changes_needed if message is empty */
              <div className="flex flex-col gap-4">
                {item.liked && (
                  <div className="flex flex-col gap-1.5 p-4 bg-card border border-line/10 rounded-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-accent-fg uppercase tracking-wider">
                        What worked well
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy('liked', item.liked!)}
                        icon={
                          copiedKey === 'liked' ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )
                        }
                        className="h-7 text-xs"
                      >
                        {copiedKey === 'liked' ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <p className="text-sm text-fg whitespace-pre-wrap leading-relaxed">{item.liked}</p>
                  </div>
                )}

                {item.changes_needed && (
                  <div className="flex flex-col gap-1.5 p-4 bg-card border border-line/10 rounded-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-warning uppercase tracking-wider">
                        Edits / Changes needed
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy('changes', item.changes_needed!)}
                        icon={
                          copiedKey === 'changes' ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )
                        }
                        className="h-7 text-xs"
                      >
                        {copiedKey === 'changes' ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <p className="text-sm text-fg whitespace-pre-wrap leading-relaxed">
                      {item.changes_needed}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Audio Player Section */}
            {item.audio_path && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-fg-3">
                  <span className="text-fg-2 uppercase tracking-wider text-[11px] font-semibold">
                    Voice Note
                  </span>
                  <span>{formatMime(item.audio_mime)}</span>
                </div>
                <AudioPlayer
                  audioPath={item.audio_path}
                  audioMime={item.audio_mime}
                  storedDurationSec={item.audio_duration_sec}
                />
              </div>
            )}

            {/* Submission Metadata */}
            <div className="mt-auto pt-4 border-t border-line/10 flex items-center justify-between text-xs text-fg-3 tabular">
              <span className="flex items-center gap-1.5" title={formatAbsolute(item.created_at)}>
                <Calendar className="w-3.5 h-3.5 text-fg-3" />
                {formatAbsolute(item.created_at)} ({formatRelative(item.created_at)})
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
          description="This action cannot be undone. Any recorded voice note will be permanently removed from storage."
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
