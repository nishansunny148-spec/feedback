import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Send, UploadCloud } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import type { UseVoiceRecorderResult } from '../../hooks/useVoiceRecorder';
import { COMPANY_NAME_MAX, QUESTION_1_LABEL, QUESTION_2_LABEL, SATISFACTION_VALUES } from '../../lib/constants';
import { detectInAppBrowser } from '../../lib/env-detect';
import { submitFeedback } from '../../services/feedback.service';
import { uploadVoiceNote } from '../../services/storage.service';
import type { Client } from '../../types/feedback';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConsentCheck } from './ConsentCheck';
import { InAppBrowserNotice } from './InAppBrowserNotice';
import { SatisfactionPicker } from './SatisfactionPicker';
import { SuccessScreen } from './SuccessScreen';
import { TellUsMoreBox } from './TellUsMoreBox';

const formSchema = z.object({
  clientName: z.string().trim().min(2, 'Please enter your name.'),
  companyName: z
    .string()
    .trim()
    .min(1, 'Please enter your company name.')
    .max(COMPANY_NAME_MAX, `Max ${COMPANY_NAME_MAX} characters`),
  satisfaction: z.enum(SATISFACTION_VALUES, { errorMap: () => ({ message: 'Please choose an option for Question 1.' }) }),
  satisfactionQ2: z.enum(SATISFACTION_VALUES).optional(),
  message: z.string().max(2000, 'Max 2000 characters').optional(),
  consent: z.literal(true, { errorMap: () => ({ message: 'You must agree to proceed.' }) }),
});

export type FeedbackFormValues = z.infer<typeof formSchema>;

/** Top-to-bottom order of required fields, used to scroll to the first error. */
const REQUIRED_FIELD_ORDER = ['clientName', 'companyName', 'satisfaction', 'consent'] as const;

const fieldId = (name: (typeof REQUIRED_FIELD_ORDER)[number]) => `field-${name}`;

export interface FeedbackFormProps {
  clientToken?: string | null;
  client?: Client | null;
  recorder: UseVoiceRecorderResult;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ clientToken, client, recorder }) => {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [q2Error, setQ2Error] = useState<string | null>(null);

  const inAppBrowserName = detectInAppBrowser();

  // Only send the token once it resolved to a real client; an invalid ?c= is ignored.
  const resolvedToken = client && clientToken ? clientToken : undefined;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    reset: resetForm,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(formSchema),
    shouldFocusError: false,
    defaultValues: {
      clientName: '',
      companyName: client?.name.slice(0, COMPANY_NAME_MAX) ?? '',
      satisfaction: undefined,
      message: '',
      consent: true,
    },
  });

  // Prefill company from the share link (still editable). Never overwrite what the user typed.
  useEffect(() => {
    if (client?.name && !getValues('companyName')) {
      setValue('companyName', client.name.slice(0, COMPANY_NAME_MAX));
    }
  }, [client?.name, getValues, setValue]);

  const onInvalid = (formErrors: FieldErrors<FeedbackFormValues>) => {
    const first = REQUIRED_FIELD_ORDER.find((name) => formErrors[name]);
    if (!first) return;
    const el = document.getElementById(fieldId(first));
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = el instanceof HTMLInputElement ? el : el.querySelector<HTMLInputElement>('input');
    focusable?.focus({ preventScroll: true });
  };

  const onSubmit = async (data: FeedbackFormValues) => {
    setQ2Error(null);

    const hasMessage = Boolean(data.message?.trim());
    const hasAudio = Boolean(recorder.blob);

    if (!hasMessage && !hasAudio) {
      setQ2Error('Please enter a message or record a voice note for Question 2.');
      const el = document.getElementById('field-q2');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

      const rawMime = recorder.mimeType ? recorder.mimeType.split(';')[0] : 'audio/webm';

      while (attempts <= maxRetries && !uploadSuccess) {
        try {
          recorder.setState('uploading');
          setUploadProgress(0.05);

          const res = await uploadVoiceNote(
            recorder.blob,
            recorder.extension,
            rawMime,
            (progress) => setUploadProgress(progress),
          );

          audioPath = res.path;
          audioMime = res.mime.split(';')[0];
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
        client_token: resolvedToken,
        client_name: data.clientName.trim(),
        companyName: data.companyName.trim(),
        satisfaction: data.satisfaction,
        project: client?.project || undefined,
        message: data.message?.trim() || undefined,
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
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate
      className="w-full flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-1 text-center">
        {client?.project && <span className="eyebrow">{client.project}</span>}
        <h1 className="text-2xl sm:text-3xl tracking-tight text-fg font-bold">Client Feedback Form</h1>
        <p className="text-xs sm:text-sm text-fg-2">Share your thoughts and rate your experience with us.</p>
      </div>

      {/* In-app browser notice if detected */}
      {inAppBrowserName && <InAppBrowserNotice appName={inAppBrowserName} />}

      {/* 1. Name */}
      <Input
        id={fieldId('clientName')}
        label="Name *"
        placeholder="e.g. Alex Morgan"
        autoComplete="name"
        disabled={submitting}
        error={errors.clientName?.message}
        {...register('clientName')}
      />

      {/* 2. Company Name (prefilled from ?c= token, editable) */}
      <Input
        id={fieldId('companyName')}
        label="Company Name *"
        placeholder="e.g. Acme Pvt. Ltd."
        autoComplete="organization"
        maxLength={COMPANY_NAME_MAX}
        disabled={submitting}
        error={errors.companyName?.message}
        {...register('companyName')}
      />

      {/* 3. Question 1 */}
      <div id={fieldId('satisfaction')}>
        <Controller
          name="satisfaction"
          control={control}
          render={({ field }) => (
            <SatisfactionPicker
              name="satisfaction"
              label={QUESTION_1_LABEL}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={submitting}
              error={errors.satisfaction?.message}
            />
          )}
        />
      </div>

      {/* 4. Question 2 (Tell Us More box with typing + voice) */}
      <div id="field-q2" className="w-full">
        <Controller
          name="message"
          control={control}
          render={({ field }) => (
            <TellUsMoreBox
              title="Question 2"
              subLabel={QUESTION_2_LABEL}
              value={field.value || ''}
              onChange={(v) => {
                field.onChange(v);
                if (q2Error) setQ2Error(null);
              }}
              recorder={recorder}
              disabled={submitting}
              error={errors.message?.message || q2Error || undefined}
            />
          )}
        />
      </div>

      {/* 6. Consent Checkbox */}
      <div id={fieldId('consent')}>
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
      </div>

      {/* Upload progress bar */}
      {uploadProgress !== null && (
        <div className="w-full flex flex-col gap-1.5">
          <div className="flex justify-between text-xs tabular text-fg-3">
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
          className="w-full text-sm sm:text-base tracking-wide py-3.5 shadow-xl shadow-accent/20"
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
