import { motion } from 'framer-motion';
import { Send, UploadCloud } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { COMPANY_NAME_MAX, LOGO_ALT, LOGO_SRC, QUESTIONS } from '../../lib/constants';
import { detectInAppBrowser, extensionForMime } from '../../lib/env-detect';
import { submitFeedback } from '../../services/feedback.service';
import { uploadVoiceNote } from '../../services/storage.service';
import type { Answer, Choice, Client } from '../../types/feedback';
import { Input } from '../ui/Input';
import { ConsentCheck } from './ConsentCheck';
import { InAppBrowserNotice } from './InAppBrowserNotice';
import { QuestionCard, type QuestionVoice } from './QuestionCard';
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
  questionEn: string;
  questionGu: string;
  questionLabel?: string;
  choice: Choice | undefined;
  onChoiceChange: (val: Choice) => void;
  message: string;
  onMessageChange: (val: string) => void;
  voice: QuestionVoice | null;
  onVoiceChange: (voice: QuestionVoice | null) => void;
  onResetVoice: (questionNo: number) => void;
  activeRecordingQuestionNo: number | null;
  setActiveRecordingQuestionNo: React.Dispatch<React.SetStateAction<number | null>>;
  disabled: boolean;
  choiceError?: string;
  uploadError?: string;
}> = ({
  questionNo,
  questionEn,
  questionGu,
  questionLabel,
  choice,
  onChoiceChange,
  message,
  onMessageChange,
  voice,
  onVoiceChange,
  onResetVoice,
  activeRecordingQuestionNo,
  setActiveRecordingQuestionNo,
  disabled,
  choiceError,
  uploadError,
}) => {
  const recorder = useVoiceRecorder();

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
      questionEn={questionEn}
      questionGu={questionGu}
      questionLabel={questionLabel}
      choice={choice}
      onChoiceChange={onChoiceChange}
      message={message}
      onMessageChange={onMessageChange}
      voice={voice}
      onVoiceChange={onVoiceChange}
      onResetVoice={(qNo) => {
        onResetVoice(qNo);
        setActiveRecordingQuestionNo((current) => (current === qNo ? null : current));
      }}
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
  const [showSummaryError, setShowSummaryError] = useState<boolean>(false);
  const [consentError, setConsentError] = useState<string | undefined>(undefined);

  // Voice recording state across questions (single source of truth per question)
  const [activeRecordingQuestionNo, setActiveRecordingQuestionNo] = useState<number | null>(null);
  const [voices, setVoices] = useState<Record<number, QuestionVoice | null>>({});

  // Upload & submission state
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

  const handleResetVoice = React.useCallback((qNo: number) => {
    setVoices((prev) => {
      const existing = prev[qNo];
      if (existing?.url) {
        try {
          URL.revokeObjectURL(existing.url);
        } catch {
          /* ignore */
        }
      }
      if (!prev[qNo]) return prev;
      return { ...prev, [qNo]: null };
    });
    setUploadErrors((prev) => {
      if (!prev[qNo]) return prev;
      const next = { ...prev };
      delete next[qNo];
      return next;
    });
  }, []);

  const handleVoiceChange = React.useCallback((qNo: number, voice: QuestionVoice | null) => {
    setVoices((prev) => ({ ...prev, [qNo]: voice }));
    if (!voice) {
      setUploadErrors((prev) => {
        if (!prev[qNo]) return prev;
        const next = { ...prev };
        delete next[qNo];
        return next;
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setNameError(undefined);
    setCompanyError(undefined);
    setChoiceErrors({});
    setShowSummaryError(false);
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
    let missingPickerCount = 0;
    for (const q of QUESTIONS) {
      if (!choices[q.no]) {
        newChoiceErrors[q.no] = `Please choose an option for Question ${q.no}.`;
        hasValidationError = true;
        missingPickerCount++;
        if (!firstErrorId) firstErrorId = `field-q${q.no}-choice`;
      }
    }
    setChoiceErrors(newChoiceErrors);

    if (missingPickerCount > 0) {
      setShowSummaryError(true);
    }

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

    // Filter questions that actually have a valid voice note (voice !== null && voice.blob.size > 0 && voice.durationSec > 0)
    const questionsToUpload = QUESTIONS.filter((q) => {
      const v = voices[q.no];
      return Boolean(v && v.blob && v.blob.size > 0 && v.durationSec > 0);
    });

    const uploadedThisSubmit: Record<number, UploadedAudio> = {};
    const newUploadErrors: Record<number, string> = {};

    if (questionsToUpload.length > 0) {
      // Concurrency limit of up to 3 in parallel
      const queue = [...questionsToUpload];
      let completedCount = 0;
      const totalCount = questionsToUpload.length;

      const runWorker = async () => {
        while (queue.length > 0) {
          const q = queue.shift();
          if (!q) break;
          const v = voices[q.no]!;
          const rawMime = v.mime ? v.mime.split(';')[0] : 'audio/webm';
          const ext = extensionForMime(rawMime);
          try {
            const res = await uploadVoiceNote(v.blob, ext, rawMime, (progress) => {
              const overall = (completedCount + progress) / totalCount;
              setUploadProgress(overall);
            });
            const cleanMime = res.mime.split(';')[0];
            uploadedThisSubmit[q.no] = {
              path: res.path,
              mime: cleanMime,
              durationSec: Math.round(v.durationSec),
            };
            completedCount++;
            setUploadProgress(completedCount / totalCount);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            newUploadErrors[q.no] = `Voice note upload failed: ${msg}. Tap submit to retry.`;
          }
        }
      };

      const concurrency = Math.min(3, questionsToUpload.length);
      const workers = Array.from({ length: concurrency }, () => runWorker());
      await Promise.all(workers);
    }

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

    // Dev-only console.debug before the RPC call showing, per question, whether audio is included and its blob size
    if (import.meta.env.DEV) {
      console.debug(
        'Submission audio payload summary per question:',
        QUESTIONS.map((q) => {
          const v = voices[q.no];
          const hasAudio = Boolean(
            v && v.blob && v.blob.size > 0 && v.durationSec > 0 && uploadedThisSubmit[q.no]?.path
          );
          return {
            questionNo: q.no,
            hasAudio,
            blobSize: v?.blob ? v.blob.size : 0,
            audioPath: uploadedThisSubmit[q.no]?.path,
          };
        })
      );
    }

    // Call RPC after all uploads succeeded
    try {
      const answers: Answer[] = QUESTIONS.map((q) => {
        const v = voices[q.no];
        const hasValidVoice = Boolean(v && v.blob && v.blob.size > 0 && v.durationSec > 0);
        const uploaded = hasValidVoice ? uploadedThisSubmit[q.no] : undefined;

        const item: Answer = {
          question_no: q.no,
          choice: choices[q.no]!,
        };

        const msg = messages[q.no]?.trim();
        if (msg) item.message = msg;

        // Audio fields included only for answers that have a successfully uploaded file
        if (uploaded && uploaded.path) {
          item.audio_path = uploaded.path;
          item.audio_mime = uploaded.mime;
          item.audio_duration_sec = uploaded.durationSec;
        }

        return item;
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
    Object.values(voices).forEach((v) => {
      if (v?.url) {
        try {
          URL.revokeObjectURL(v.url);
        } catch {
          /* ignore */
        }
      }
    });
    setIsSuccess(false);
    setClientName('');
    setCompanyName(client?.name.slice(0, COMPANY_NAME_MAX) ?? '');
    setChoices({});
    setMessages({});
    setVoices({});
    setConsent(true);
    setUploadErrors({});
    setNameError(undefined);
    setCompanyError(undefined);
    setChoiceErrors({});
    setShowSummaryError(false);
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
      <header className="w-full text-left">
        {/* 1. Logo Row */}
        <div className="w-full mt-[15px] sm:mt-[27px]">
          <div
            role="img"
            aria-label={LOGO_ALT}
            style={{
              backgroundColor: '#000000',
              maskImage: `url(${LOGO_SRC})`,
              WebkitMaskImage: `url(${LOGO_SRC})`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'right center',
              WebkitMaskPosition: 'right center',
              width: 'clamp(170px, 48%, 260px)',
              aspectRatio: '749 / 76',
              display: 'block',
              marginLeft: 'auto',
              marginRight: 0,
              padding: 0,
              opacity: 1,
            }}
            className="select-none p-0 border-0 outline-none shadow-none"
          />
        </div>

        {/* 2. Title Block */}
        <div style={{ marginTop: 'clamp(40px, 10vw, 72px)' }} className="text-left">
          {client?.project && <span className="eyebrow block mb-1 text-left text-[#3F3F3F]">{client.project}</span>}
          <h1
            style={{
              fontFamily: 'Gotham, system-ui, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(19px, 3.9vw, 24px)',
              lineHeight: 1.1,
              color: '#0A0A0A',
            }}
            className="tracking-tight text-[#0A0A0A]"
          >
            Better Together
          </h1>
          <p
            style={{
              fontFamily: 'Gotham, system-ui, sans-serif',
              fontWeight: 400,
              fontSize: 'clamp(17px, 3.7vw, 23px)',
              lineHeight: 1.2,
              color: '#3F3F3F',
              marginTop: '4px',
              maxWidth: '80%',
            }}
          >
            Your honest {QUESTIONS.length} Inputs helps us grow &amp; serve your brand better.
          </p>
        </div>
      </header>

      {/* In-app browser notice */}
      {inAppBrowserName && <InAppBrowserNotice appName={inAppBrowserName} />}

      {/* 1. Name */}
      <Input
        id="field-clientName"
        label={
          <span>
            Name <span className="text-[#C62828]">*</span>
          </span>
        }
        labelClassName="block text-[16px] font-normal text-[#0A0A0A] mb-[10px] text-left p-0 m-0"
        containerClassName="gap-0"
        className="control-field h-[52px] rounded-[14px] bg-white text-[#0A0A0A] placeholder-[#6B6B6B] transition-all"
        style={{ border: 'var(--control-border, 1px solid #CFCFCF)' }}
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
        label={
          <span>
            Company Name <span className="text-[#C62828]">*</span>
          </span>
        }
        labelClassName="block text-[16px] font-normal text-[#0A0A0A] mb-[10px] text-left p-0 m-0"
        containerClassName="gap-0"
        className="control-field h-[52px] rounded-[14px] bg-white text-[#0A0A0A] placeholder-[#6B6B6B] transition-all"
        style={{ border: 'var(--control-border, 1px solid #CFCFCF)' }}
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

      {/* 3. Question Cards */}
      {QUESTIONS.map((q) => (
        <QuestionCardItem
          key={q.no}
          questionNo={q.no}
          questionEn={q.en}
          questionGu={q.gu}
          questionLabel={q.label}
          choice={choices[q.no]}
          onChoiceChange={(val) => {
            setChoices((prev) => {
              const next = { ...prev, [q.no]: val };
              if (QUESTIONS.every((item) => Boolean(next[item.no]))) {
                setShowSummaryError(false);
              }
              return next;
            });
            setChoiceErrors((prev) => ({ ...prev, [q.no]: '' }));
          }}
          message={messages[q.no] || ''}
          onMessageChange={(val) => setMessages((prev) => ({ ...prev, [q.no]: val }))}
          voice={voices[q.no] ?? null}
          onVoiceChange={(v) => handleVoiceChange(q.no, v)}
          onResetVoice={handleResetVoice}
          activeRecordingQuestionNo={activeRecordingQuestionNo}
          setActiveRecordingQuestionNo={setActiveRecordingQuestionNo}
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
        <div className="w-full flex flex-col gap-1.5 p-3.5 bg-[#F1F1F1] border border-[#D9D9D9] rounded-card text-[#0A0A0A]">
          <div className="flex justify-between text-xs tabular font-medium text-[#0A0A0A]">
            <span className="flex items-center gap-1.5 text-[#0A0A0A]">
              <UploadCloud className="w-4 h-4 animate-bounce shrink-0 text-[#0A0A0A]" />
              <span>Uploading voice notes… Please do not close or leave this page.</span>
            </span>
            <span className="shrink-0">{Math.round(uploadProgress * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#D9D9D9] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0A0A0A] transition-all duration-200"
              style={{ width: `${Math.max(5, uploadProgress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit Action */}
      <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-[#D9D9D9]">
        {showSummaryError && (
          <p className="text-xs text-[#C62828] font-medium text-center" role="alert">
            Please answer all {QUESTIONS.length} questions
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || activeRecordingQuestionNo !== null}
          className="submit-feedback-btn w-full text-sm sm:text-base font-bold tracking-wide py-3.5 rounded-control flex items-center justify-center gap-2 select-none"
        >
          {submitting ? (
            <span>Sending your feedback…</span>
          ) : (
            <>
              <span>Submit Feedback</span>
              <Send className="w-4 h-4 text-white transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          )}
        </button>
        <p className="text-[11px] text-[#3F3F3F] text-center">
          Encrypted &amp; securely sent directly to the team
        </p>
      </div>
    </motion.form>
  );
};
