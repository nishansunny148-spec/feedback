import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertCircle, Send, UploadCloud } from 'lucide-react';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import type { UseVoiceRecorderResult } from '../../hooks/useVoiceRecorder';
import { detectInAppBrowser, hasRecordingSupport } from '../../lib/env-detect';
import { submitFeedback } from '../../services/feedback.service';
import { uploadVoiceNote } from '../../services/storage.service';
import type { Client } from '../../types/feedback';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { ConsentCheck } from './ConsentCheck';
import { FileFallback } from './FileFallback';
import { InAppBrowserNotice } from './InAppBrowserNotice';
import { RatingPicker } from './RatingPicker';
import { SuccessScreen } from './SuccessScreen';
import { VoiceRecorder } from './VoiceRecorder';

const formSchema = z.object({
  clientName: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  liked: z.string().max(1000, 'Max 1000 characters').optional(),
  changesNeeded: z.string().max(1000, 'Max 1000 characters').optional(),
  consent: z.literal(true, { errorMap: () => ({ message: 'You must agree to proceed.' }) }),
});

export type FeedbackFormValues = z.infer<typeof formSchema>;

export interface FeedbackFormProps {
  clientToken?: string | null;
  client?: Client | null;
  recorder: UseVoiceRecorderResult;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ clientToken, client, recorder }) => {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [emptySubmissionError, setEmptySubmissionError] = useState<string | null>(null);
  const [showFileFallback, setShowFileFallback] = useState<boolean>(!hasRecordingSupport());

  const inAppBrowserName = detectInAppBrowser();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset: resetForm,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: '',
      rating: undefined,
      liked: '',
      changesNeeded: '',
      consent: true,
    },
  });

  const onSubmit = async (data: FeedbackFormValues) => {
    setEmptySubmissionError(null);

    // Validation rule: submission needs EITHER a voice note OR at least one text answer
    const hasAudio = Boolean(recorder.blob);
    const hasText = Boolean(data.liked?.trim() || data.changesNeeded?.trim());

    if (!hasAudio && !hasText) {
      setEmptySubmissionError('Please record a voice note or answer at least one of the questions below.');
      return;
    }

    if (!clientToken && (!data.clientName || data.clientName.trim().length < 2)) {
      toast.error('Please enter your name (at least 2 characters).');
      return;
    }

    setSubmitting(true);
    setUploadProgress(null);

    let audioPath: string | undefined = undefined;
    let audioMime: string | undefined = undefined;

    // Step 1: Upload voice note if present
    if (recorder.blob) {
      let attempts = 0;
      const maxRetries = 3;
      let uploadSuccess = false;

      while (attempts <= maxRetries && !uploadSuccess) {
        try {
          recorder.setState('uploading');
          setUploadProgress(0.05);

          const res = await uploadVoiceNote(
            recorder.blob,
            recorder.extension,
            recorder.mimeType,
            (progress) => setUploadProgress(progress),
          );

          audioPath = res.path;
          audioMime = res.mime;
          uploadSuccess = true;
        } catch (err: unknown) {
          attempts += 1;
          if (attempts <= maxRetries) {
            const delay = Math.pow(2, attempts - 1) * 1000;
            toast.error(`Upload failed. Retrying in ${delay / 1000}s… (Attempt ${attempts}/${maxRetries})`);
            await new Promise((r) => setTimeout(r, delay));
          } else {
            recorder.setState('recorded');
            setSubmitting(false);
            setUploadProgress(null);
            const msg = err instanceof Error ? err.message : 'Audio upload failed';
            toast.error(`${msg}. Tap submit to try again.`);
            return;
          }
        }
      }
    }

    // Step 2: Submit feedback row
    try {
      await submitFeedback({
        client_token: clientToken || undefined,
        client_name: !clientToken ? data.clientName?.trim() : undefined,
        project: client?.project || undefined,
        rating: data.rating,
        liked: data.liked?.trim() || undefined,
        changes_needed: data.changesNeeded?.trim() || undefined,
        audio_path: audioPath,
        audio_mime: audioMime,
        audio_duration_sec: recorder.durationSeconds ? Math.round(recorder.durationSeconds) : undefined,
        consent: true,
      });

      setIsSuccess(true);
      recorder.reset();
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleResetForm = () => {
    setIsSuccess(false);
    recorder.reset();
    resetForm();
  };

  if (isSuccess) {
    return <SuccessScreen onReset={handleResetForm} projectName={client?.project} />;
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-1 text-center sm:text-left">
        <span className="eyebrow">
          {client?.project ? `Feedback · ${client.project}` : 'Voice & Text Feedback'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">
          {client?.name ? `Hello, ${client.name}` : 'Share your feedback'}
        </h1>
        <p className="text-xs sm:text-sm text-fg-2">
          Record a quick voice note or type your thoughts below.
        </p>
      </div>

      {/* In-app browser notice if detected */}
      {inAppBrowserName && <InAppBrowserNotice appName={inAppBrowserName} />}

      {/* Voice Recorder or File Fallback */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-fg-2">1. Voice Note</label>
        {showFileFallback ? (
          <FileFallback
            onFileSelect={(file) => void recorder.setRecordedBlob(file)}
            onError={(msg) => toast.error(msg)}
            disabled={submitting}
          />
        ) : (
          <VoiceRecorder
            recorder={recorder}
            onFileFallbackNeeded={() => setShowFileFallback(true)}
          />
        )}
      </div>

      {/* Empty Submission Error Banner */}
      {emptySubmissionError && (
        <div className="p-3 bg-warning/15 border border-warning/30 rounded-control flex items-center gap-2 text-xs text-warning">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{emptySubmissionError}</span>
        </div>
      )}

      {/* Questions */}
      <div className="flex flex-col gap-5 p-5 bg-raised/50 border border-line/10 rounded-card">
        <span className="text-xs font-semibold text-fg uppercase tracking-wider">
          2. Quick Questions
        </span>

        {/* Rating Picker */}
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <RatingPicker
              value={field.value ?? null}
              onChange={(val) => field.onChange(val)}
              error={errors.rating?.message}
            />
          )}
        />

        {/* What did you like? */}
        <Textarea
          label="What did you like?"
          placeholder="Share what worked well or what stood out…"
          maxLength={1000}
          disabled={submitting}
          error={errors.liked?.message}
          {...register('liked')}
        />

        {/* What needs to change? */}
        <Textarea
          label="What needs to change?"
          placeholder="Share any edits, fixes, or adjustments needed…"
          maxLength={1000}
          disabled={submitting}
          error={errors.changesNeeded?.message}
          {...register('changesNeeded')}
        />
      </div>

      {/* Name (Only shown if no valid client token) */}
      {!clientToken && (
        <Input
          label="Your name *"
          placeholder="e.g. Alex Morgan"
          disabled={submitting}
          error={errors.clientName?.message}
          {...register('clientName')}
        />
      )}

      {/* Consent Checkbox */}
      <Controller
        name="consent"
        control={control}
        render={({ field }) => (
          <ConsentCheck
            checked={field.value}
            onChange={(checked) => setValue('consent', checked ? true : (false as unknown as true))}
            error={errors.consent?.message}
          />
        )}
      />

      {/* Upload progress bar */}
      {uploadProgress !== null && (
        <div className="w-full flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-mono text-fg-3">
            <span className="flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 animate-bounce text-accent-fg" />
              Uploading voice note…
            </span>
            <span>{Math.round(uploadProgress * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-200"
              style={{ width: `${uploadProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit Action Block */}
      <div className="flex flex-col gap-2 mt-3 pt-2 border-t border-line/10">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          disabled={submitting || recorder.state === 'recording'}
          icon={
            <Send className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          }
          className="w-full text-sm sm:text-base font-semibold tracking-wide py-3.5 shadow-xl shadow-accent/20"
        >
          {submitting ? 'Sending your feedback…' : 'Submit Feedback'}
        </Button>
        <p className="text-[11px] text-fg-3 text-center">
          Encrypted & securely sent directly to the team
        </p>
      </div>
    </motion.form>
  );
};
