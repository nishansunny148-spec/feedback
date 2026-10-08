import { motion } from 'framer-motion';
import { Send, UploadCloud } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { COMPANY_NAME_MAX, QUESTIONS } from '../../lib/constants';
import { detectInAppBrowser } from '../../lib/env-detect';
import { submitFeedback } from '../../services/feedback.service';
import { uploadVoiceNote } from '../../services/storage.service';
import type { Answer, Choice, Client } from '../../types/feedback';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConsentCheck } from './ConsentCheck';
import { InAppBrowserNotice } from './InAppBrowserNotice';
import { QuestionCard } from './QuestionCard';
import { SuccessScreen } from './SuccessScreen';
import { useVoiceRecorder, type UseVoiceRecorderResult } from '../../hooks/useVoiceRecorder';

export interface FeedbackFormProps {
  clientToken?: string | null;
  client?: Client | null;
  /** Legacy single recorder prop preserved for backwards compatibility if needed */
  recorder?: UseVoiceRecorderResult;
}

interface UploadedAudio {
  path: string;
  mime: string;
  durationSec?: number;
}

/** Component rendering a single QuestionCard with its own isolated useVoiceRecorder hook instance. */
const QuestionCardItem: React.FC<{
  questionNo: number;
  questionLabel: string;
  choice: Choice | undefined;
  onChoiceChange: (val: Choice) => void;
  message: string;
  onMessageChange: (val: string) => void;
  activeRecordingQuestionNo: number | null;
  setActiveRecordingQuestionNo: React.Dispatch<React.SetStateAction<number | null>>;
  onVoiceDataChange: (qNo: number, data: { blob: Blob | null; mimeType: string; extension: string; durationSeconds: number | null }) => void;
  disabled: boolean;
  choiceError?: string;
  uploadError?: string;
}> = ({
  questionNo,
  questionLabel,
  choice,
  onChoiceChange,
  message,
  onMessageChange,
  activeRecordingQuestionNo,
  setActiveRecordingQuestionNo,
  onVoiceDataChange,
  disabled,
  choiceError,
  uploadError,
}) => {
  const recorder = useVoiceRecorder();

  // Sync recorder state up to parent
  useEffect(() => {
    onVoiceDataChange(questionNo, {
      blob: recorder.blob,
      mimeType: recorder.mimeType,
      extension: recorder.extension,
      durationSeconds: recorder.durationSeconds,
    });
  }, [questionNo, recorder.blob, recorder.mimeType, recorder.extension, recorder.durationSeconds, onVoiceDataChange]);

  // Sync recording active state
  useEffect(() => {
    const isRecording = recorder.state === 'recording' || recorder.state === 'requesting';
    if (isRecording) {
      setActiveRecordingQuestionNo((current) => (current === questionNo ? current : questionNo));
    } else {
      setActiveRecordingQuestionNo((current) => (current === questionNo ? null : current));
    }
  }, [questionNo, recorder.state, setActiveRecordingQuestionNo]);

  const isOtherQuestionRecording = activeRecordingQuestionNo !== null && activeRecordingQuestionNo !== questionNo;

  return (
    <QuestionCard
      questionNo={questionNo}
      questionLabel={questionLabel}
      choice={choice}
      onChoiceChange={onChoiceChange}
      message={message}
      onMessageChange={onMessageChange}
      recorder={recorder}
      isOtherQuestionRecording={isOtherQuestionRecording}
      onStartRecording={() => setActiveRecordingQuestionNo(questionNo)}
      disabled={disabled}
      choiceError={choiceError}
      uploadError={uploadError}
    />
  );
};

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ clientToken, client }) => {
  const [clientName, setClientName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>(client?.name.slice(0, COMPANY_NAME_MAX) ?? '');
  const [choices, setChoices] = useState<Record<number, Choice | undefined>>({});
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [consent, setConsent] = useState<boolean>(true);

  // Errors state
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [companyError, setCompanyError] = useState<string | undefined>(undefined);
  const [choiceErrors, setChoiceErrors] = useState<Record<number, string>>({});
  const [consentError, setConsentError] = useState<string | undefined>(undefined);

  // Voice recording state across questions
  const [activeRecordingQuestionNo, setActiveRecordingQuestionNo] = useState<number | null>(null);
  const [voiceData, setVoiceData] = useState<Record<number, { blob: Blob | null; mimeType: string; extension: string; durationSeconds: number | null }>>({});

  // Upload & submission state
  const [uploadedAudioMap, setUploadedAudioMap] = useState<Record<number, UploadedAudio>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const inAppBrowserName = detectInAppBrowser();
  const resolvedToken = client && clientToken ? clientToken : undefined;

  // Prefill company name from share token if available
  useEffect(() => {
    if (client?.name && !companyName) {
      setCompanyName(client.name.slice(0, COMPANY_NAME_MAX));
    }
  }, [client?.name, companyName]);

  const handleVoiceDataChange = React.useCallback(
    (qNo: number, data: { blob: Blob | null; mimeType: string; extension: string; durationSeconds: number | null }) => {
      setVoiceData((prev) => ({ ...prev, [qNo]: data }));
      // Clear uploaded audio if user deleted or re-recorded
      if (!data.blob) {
        setUploadedAudioMap((prev) => {
          if (!prev[qNo]) return prev;
          const next = { ...prev };
          delete next[qNo];
          return next;
        });
        setUploadErrors((prev) => {
          if (!prev[qNo]) return prev;
          const next = { ...prev };
          delete next[qNo];
          return next;
        });
      }
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setNameError(undefined);
    setCompanyError(undefined);
    setChoiceErrors({});
    setConsentError(undefined);
    setUploadErrors({});

    let hasValidationError = false;
    let firstErrorId: string | null = null;

    if (!clientName.trim()) {
      setNameError('Please enter your name.');
      hasValidationError = true;
      if (!firstErrorId) firstErrorId = 'field-clientName';
    }

    if (!companyName.trim()) {
      setCompanyError('Please enter your company name.');
      hasValidationError = true;
      if (!firstErrorId) firstErrorId = 'field-companyName';
    }

    const newChoiceErrors: Record<number, string> = {};
    for (const q of QUESTIONS) {
      if (!choices[q.no]) {
        newChoiceErrors[q.no] = `Please choose an option for Question ${q.no}.`;
        hasValidationError = true;
        if (!firstErrorId) firstErrorId = `field-q${q.no}-choice`;
      }
    }
    setChoiceErrors(newChoiceErrors);

    if (consent !== true) {
      setConsentError('You must agree to proceed.');
      hasValidationError = true;
      if (!firstErrorId) firstErrorId = 'field-consent';
    }

    if (hasValidationError) {
      if (firstErrorId) {
        const el = document.getElementById(firstErrorId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    setUploadProgress(0.05);

    // Upload voice notes in parallel for questions that have audio
    const newUploadedMap = { ...uploadedAudioMap };
    const questionsToUpload = QUESTIONS.filter((q) => voiceData[q.no]?.blob && !newUploadedMap[q.no]);
    const newUploadErrors: Record<number, string> = {};

    if (questionsToUpload.length > 0) {
      const uploadPromises = questionsToUpload.map(async (q) => {
        const data = voiceData[q.no]!;
        const rawMime = data.mimeType ? data.mimeType.split(';')[0] : 'audio/webm';
        try {
          const res = await uploadVoiceNote(data.blob!, data.extension, rawMime, (progress) => {
            setUploadProgress(progress);
          });
          const cleanMime = res.mime.split(';')[0];
          newUploadedMap[q.no] = {
            path: res.path,
            mime: cleanMime,
            durationSec: data.durationSeconds ? Math.round(data.durationSeconds) : undefined,
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Upload failed';
          newUploadErrors[q.no] = `Voice note upload failed: ${msg}. Tap submit to retry.`;
        }
      });

      await Promise.all(uploadPromises);
    }

    setUploadedAudioMap(newUploadedMap);

    if (Object.keys(newUploadErrors).length > 0) {
      setUploadErrors(newUploadErrors);
      setSubmitting(false);
      setUploadProgress(null);
      const firstFailedNo = Object.keys(newUploadErrors)[0];
      toast.error(`Question ${firstFailedNo} voice note upload failed. Tap submit to retry.`);
      const el = document.getElementById(`question-card-${firstFailedNo}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Call RPC after all uploads succeeded
    try {
      const answers: Answer[] = QUESTIONS.map((q) => {
        const audio = newUploadedMap[q.no];
        return {
          question_no: q.no,
          choice: choices[q.no]!,
          message: messages[q.no]?.trim() || undefined,
          audio_path: audio?.path,
          audio_mime: audio?.mime,
          audio_duration_sec: audio?.durationSec,
        };
      });

      await submitFeedback({
        client_token: resolvedToken,
        client_name: clientName.trim(),
        companyName: companyName.trim(),
        project: client?.project || undefined,
        answers,
        consent: true,
      });

      setIsSuccess(true);
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
    setClientName('');
    setCompanyName(client?.name.slice(0, COMPANY_NAME_MAX) ?? '');
    setChoices({});
    setMessages({});
    setConsent(true);
    setUploadedAudioMap({});
    setUploadErrors({});
    setNameError(undefined);
    setCompanyError(undefined);
    setChoiceErrors({});
    setConsentError(undefined);
  };

  if (isSuccess) {
    return <SuccessScreen onReset={handleResetForm} projectName={client?.project} />;
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit}
      noValidate
      className="w-full flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-1 text-center">
        {client?.project && <span className="eyebrow">{client.project}</span>}
        <h1 className="text-2xl sm:text-3xl tracking-tight text-fg font-bold">Client Feedback Form</h1>
        <p className="text-xs sm:text-sm text-fg-2">Share your thoughts and rate your experience with us.</p>
      </div>

      {/* In-app browser notice */}
      {inAppBrowserName && <InAppBrowserNotice appName={inAppBrowserName} />}

      {/* 1. Name */}
      <Input
        id="field-clientName"
        label="Name *"
        placeholder="e.g. Alex Morgan"
        autoComplete="name"
        value={clientName}
        onChange={(e) => {
          setClientName(e.target.value);
          if (nameError) setNameError(undefined);
        }}
        disabled={submitting}
        error={nameError}
      />

      {/* 2. Company Name */}
      <Input
        id="field-companyName"
        label="Company Name *"
        placeholder="e.g. Acme Pvt. Ltd."
        autoComplete="organization"
        maxLength={COMPANY_NAME_MAX}
        value={companyName}
        onChange={(e) => {
          setCompanyName(e.target.value);
          if (companyError) setCompanyError(undefined);
        }}
        disabled={submitting}
        error={companyError}
      />

      {/* 3. Question Cards (Q1, Q2, Q3, etc. dynamically rendered) */}
      {QUESTIONS.map((q) => (
        <QuestionCardItem
          key={q.no}
          questionNo={q.no}
          questionLabel={q.label}
          choice={choices[q.no]}
          onChoiceChange={(val) => {
            setChoices((prev) => ({ ...prev, [q.no]: val }));
            setChoiceErrors((prev) => ({ ...prev, [q.no]: '' }));
          }}
          message={messages[q.no] || ''}
          onMessageChange={(val) => setMessages((prev) => ({ ...prev, [q.no]: val }))}
          activeRecordingQuestionNo={activeRecordingQuestionNo}
          setActiveRecordingQuestionNo={setActiveRecordingQuestionNo}
          onVoiceDataChange={handleVoiceDataChange}
          disabled={submitting}
          choiceError={choiceErrors[q.no]}
          uploadError={uploadErrors[q.no]}
        />
      ))}

      {/* Consent Checkbox */}
      <div id="field-consent">
        <ConsentCheck
          checked={consent}
          onChange={(checked) => {
            setConsent(checked);
            if (consentError) setConsentError(undefined);
          }}
          error={consentError}
        />
      </div>

      {/* Upload progress & notice */}
      {uploadProgress !== null && (
        <div className="w-full flex flex-col gap-1.5 p-3.5 bg-accent/10 border border-accent/20 rounded-card">
          <div className="flex justify-between text-xs tabular font-medium text-fg">
            <span className="flex items-center gap-1.5 text-accent-fg">
              <UploadCloud className="w-4 h-4 animate-bounce shrink-0" />
              <span>Uploading voice notes… Please do not close or leave this page.</span>
            </span>
            <span className="shrink-0">{Math.round(uploadProgress * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-200"
              style={{ width: `${Math.max(5, uploadProgress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit Action */}
      <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-line/10">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          disabled={submitting || activeRecordingQuestionNo !== null}
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
