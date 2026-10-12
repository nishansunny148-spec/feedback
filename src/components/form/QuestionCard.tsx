import { AlertCircle, Mic, Pause, Play, Square, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { UseVoiceRecorderResult } from '../../hooks/useVoiceRecorder';
import { claimPlayback, releasePlayback } from '../../lib/audio';
import { cn } from '../../lib/cn';
import { SATISFACTION_OPTIONS } from '../../lib/constants';
import { detectInAppBrowser, hasRecordingSupport } from '../../lib/env-detect';
import { formatClock } from '../../lib/format';
import type { Choice } from '../../types/feedback';
import { Card } from '../ui/Card';
import { Waveform } from './Waveform';

export interface QuestionVoice {
  blob: Blob;
  url: string;
  mime: string;
  durationSec: number;
}

export interface QuestionCardProps {
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
  recorder: UseVoiceRecorderResult;
  isOtherQuestionRecording: boolean;
  onStartRecording: () => void;
  disabled?: boolean;
  choiceError?: string;
  uploadError?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
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
  recorder,
  isOtherQuestionRecording,
  onStartRecording,
  disabled,
  choiceError,
  uploadError,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(voice?.durationSec || 0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const useFallback = !hasRecordingSupport() || Boolean(detectInAppBrowser());

  const enText = questionEn || questionLabel || '';
  const guText = questionGu || questionLabel || '';

  // Auto-resize textarea when message changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Sync recorder blob into single source of truth voice
  useEffect(() => {
    if (recorder.blob && recorder.state === 'recorded') {
      if (!voice || voice.blob !== recorder.blob) {
        if (voice?.url) {
          try {
            URL.revokeObjectURL(voice.url);
          } catch {
            /* ignore */
          }
        }
        const url = URL.createObjectURL(recorder.blob);
        const effectiveSec = recorder.durationSeconds || recorder.elapsedSeconds || 1;
        const newVoice: QuestionVoice = {
          blob: recorder.blob,
          url,
          mime: recorder.mimeType || 'audio/webm',
          durationSec: effectiveSec,
        };
        onVoiceChange(newVoice);
      }
    }
  }, [
    recorder.blob,
    recorder.state,
    recorder.mimeType,
    recorder.durationSeconds,
    recorder.elapsedSeconds,
    voice,
    onVoiceChange,
  ]);

  // Reset voice note completely (C.2 requirements a through g)
  const resetVoice = (qNo: number = questionNo) => {
    // 2.a, b, c, e: recorder.reset() sets cancelled ref to true BEFORE stopping the recorder,
    // stops MediaRecorder and stream tracks so mic turns off, clears chunks,
    // and resets timer, waveform, and state to idle.
    recorder.reset();

    // 2.d: revoke object URL, pause audio, remove src, call load()
    if (voice?.url) {
      try {
        URL.revokeObjectURL(voice.url);
      } catch {
        /* ignore */
      }
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // 2.f: reset fallback file input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // 2.g: set voice to null & notify parent to clear uploaded-path/upload-status/progress
    onVoiceChange(null);
    onResetVoice(qNo);
  };

  // Preview audio playback logic driven strictly from voice
  useEffect(() => {
    if (!voice) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        audioRef.current = null;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const audio = new Audio(voice.url);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      } else if (voice.durationSec > 0) {
        setDuration(voice.durationSec);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      releasePlayback(audio);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.pause();
      releasePlayback(audio);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeAttribute('src');
      audio.load();
    };
  }, [voice]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (voice?.url) {
        try {
          URL.revokeObjectURL(voice.url);
        } catch {
          /* ignore */
        }
      }
    };
  }, [voice]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      claimPlayback(audio);
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleMicTap = () => {
    if (disabled || isOtherQuestionRecording) return;
    onStartRecording();
    if (useFallback) {
      fileInputRef.current?.click();
    } else {
      void recorder.start();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void recorder.setRecordedBlob(file);
    }
  };

  const effectiveDuration = duration || voice?.durationSec || recorder.elapsedSeconds || 0;
  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;
  const isRecordingState = recorder.state === 'recording' || recorder.state === 'requesting';

  return (
    <Card
      id={`question-card-${questionNo}`}
      variant="flat"
      style={{
        backgroundColor: '#FAFAFA',
        border: '1px solid #D9D9D9',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
      }}
      className="p-4 flex flex-col gap-[14px] rounded-card"
    >
      {/* English (Gotham Bold 700, 16px, line-height 1.4, #0A0A0A) + Gujarati (Noto Sans Gujarati, 15px, line-height 1.6, #3F3F3F) */}
      <div className="flex flex-col w-full">
        {/* English & Gujarati question block */}
        <div className="grid grid-cols-[auto_1fr] gap-x-1.5 items-baseline">
          <span className="font-bold text-[16px] leading-[1.4] text-[#0A0A0A] select-none">
            {questionNo}.
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-[16px] leading-[1.4] text-[#0A0A0A]">
              {enText}
              <span className="text-[#C62828] ml-0.5">*</span>
            </span>
            <div className="mt-[6px]" lang="gu">
              <span className="text-[15px] leading-[1.6] text-[#3F3F3F] font-['Noto_Sans_Gujarati',sans-serif]">
                {guText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-option picker sit in ONE row at every screen size */}
      <fieldset
        className="w-full flex flex-col gap-1.5"
        id={`field-q${questionNo}-choice`}
        role="radiogroup"
        aria-label={`Rating options for question ${questionNo}`}
      >
        <div className="grid grid-cols-3 gap-2 sm:gap-[10px] w-full items-stretch">
          {SATISFACTION_OPTIONS.map((opt) => {
            const selected = choice === opt.value;
            return (
              <label
                key={opt.value}
                data-selected={selected}
                data-disabled={disabled}
                style={{
                  boxSizing: 'border-box',
                  backgroundColor: '#FFFFFF',
                  border: selected ? '2px solid #0A0A0A' : '1px solid #CFCFCF',
                  padding: selected ? '11px 5px' : '12px 6px',
                  boxShadow: selected ? '0 2px 8px rgba(0, 0, 0, 0.18)' : 'none',
                }}
                className={cn(
                  'picker-option-card relative flex flex-col items-center justify-start text-center rounded-[14px] cursor-pointer select-none transition-all duration-150 w-full min-w-0',
                  'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#0A0A0A] has-[:focus-visible]:outline-offset-2',
                  !selected && 'hover:!border-[#9A9A9A]',
                  choiceError && !selected && '!border-[#C62828]',
                  disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                <input
                  type="radio"
                  name={`question_${questionNo}_choice`}
                  value={opt.value}
                  checked={selected}
                  onChange={() => onChoiceChange(opt.value)}
                  disabled={disabled}
                  className="sr-only"
                />
                {/* row 1: radio circle */}
                <span
                  aria-hidden="true"
                  style={{
                    border: '2px solid #0A0A0A',
                  }}
                  className="shrink-0 w-[20px] h-[20px] rounded-full flex items-center justify-center transition-colors mb-2"
                >
                  <span
                    style={{
                      backgroundColor: '#0A0A0A',
                    }}
                    className={cn(
                      'w-[8px] h-[8px] rounded-full transition-transform duration-200',
                      selected ? 'scale-100' : 'scale-0',
                    )}
                  />
                </span>
                {/* row 2: English label */}
                <div
                  className="w-full min-h-[2.7em] flex items-start justify-center text-center font-bold text-[#0A0A0A] leading-[1.25] tracking-normal [hyphens:none] [word-break:normal] [overflow-wrap:normal]"
                  style={{ fontSize: 'clamp(12px, 3.5vw, 12px)' }}
                >
                  <span>{opt.en}</span>
                </div>
                {/* row 3: Gujarati label */}
                <div
                  lang="gu"
                  className="w-full text-center text-[#3F3F3F] font-['Noto_Sans_Gujarati',sans-serif] leading-tight mt-1 tracking-normal"
                  style={{ fontSize: 'clamp(10px, 3vw, 13px)' }}
                >
                  <span>{opt.gu}</span>
                </div>
              </label>
            );
          })}
        </div>
        {choiceError && (
          <p className="text-xs text-[#C62828] mt-1" role="alert">
            {choiceError}
          </p>
        )}
      </fieldset>

      {/* Hidden File Input for browser fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        tabIndex={-1}
      />

      {/* Comments label + Text box with round mic button inside at bottom-right */}
      <div className="flex flex-col gap-[6px] w-full mt-1">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#3F3F3F] font-normal">Comments</span>
        </div>

        <div
          style={{ border: 'var(--control-border, 1px solid #CFCFCF)' }}
          className="control-field relative w-full rounded-card bg-white min-h-[88px] transition-all"
        >
          {isRecordingState ? (
            /* Active recording view */
            <div
              className="w-full flex flex-col justify-between gap-3 min-h-[88px] p-3.5 rounded-card bg-[#F1F1F1] border border-[#D9D9D9] text-[#0A0A0A]"
              aria-live="polite"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C62828] animate-pulse shrink-0" />
                  <span className="text-xs font-semibold text-[#0A0A0A] tabular">
                    {recorder.state === 'requesting' ? 'Requesting mic…' : formatClock(recorder.elapsedSeconds)}
                  </span>
                </div>
                <span className="text-[11px] text-[#3F3F3F] tabular">Max 3:00</span>
              </div>

              <div className="w-full flex items-center justify-center">
                <Waveform analyser={recorder.analyser} audioLevel={recorder.audioLevel} height={32} barCount={24} color="#0A0A0A" />
              </div>

              <div className="flex items-center justify-between w-full pt-1">
                <button
                  type="button"
                  onClick={() => resetVoice(questionNo)}
                  aria-label="Cancel recording"
                  className="p-2 rounded-full text-[#3F3F3F] hover:text-[#C62828] hover:bg-black/5 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => recorder.stop()}
                  aria-label="Stop recording"
                  className="px-4 py-1.5 rounded-full bg-[#C62828] text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          ) : (
            /* Textarea + Voice Chip (if present) + Round Mic Button */
            <div className="relative w-full flex flex-col">
              {voice && (
                <div className="m-2.5 mb-1 flex items-center gap-2.5 p-2 bg-[#F1F1F1] border border-[#D9D9D9] rounded-control text-[#0A0A0A]">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shrink-0 hover:opacity-90 transition-transform active:scale-95 shadow-sm"
                    aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current text-white" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5 fill-current text-white" />
                    )}
                  </button>

                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <input
                      type="range"
                      min={0}
                      max={effectiveDuration || 100}
                      step={0.1}
                      value={currentTime}
                      onChange={handleSeek}
                      style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}
                      className="range text-xs"
                      aria-label="Seek voice note"
                    />
                    <div className="flex justify-between text-[10px] text-[#3F3F3F] tabular font-medium">
                      <span>{formatClock(currentTime)}</span>
                      <span>{formatClock(effectiveDuration)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => resetVoice(questionNo)}
                    className="w-7 h-7 rounded-full text-[#3F3F3F] hover:text-[#C62828] hover:bg-black/5 flex items-center justify-center shrink-0 transition-colors"
                    aria-label="Delete voice note"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                onInput={(e) => {
                  const target = e.currentTarget;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
                disabled={disabled}
                rows={2}
                maxLength={2000}
                placeholder="Type or dictate your message..."
                style={{
                  minHeight: '88px',
                  maxHeight: '200px',
                  resize: 'none',
                  padding: '10px 52px 10px 14px',
                  colorScheme: 'light',
                  caretColor: '#0A0A0A',
                }}
                className="w-full bg-transparent border-0 text-sm text-[#0A0A0A] placeholder-[#6B6B6B] focus:outline-none focus:ring-0 overflow-y-auto"
              />

              {!voice && (
                <button
                  type="button"
                  onClick={handleMicTap}
                  disabled={disabled || isOtherQuestionRecording}
                  aria-label={`Record a voice note for Question ${questionNo}`}
                  title={isOtherQuestionRecording ? 'Another recording is in progress' : 'Record voice note'}
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    width: '34px',
                    height: '34px',
                    backgroundColor: '#0A0A0A',
                  }}
                  className={cn(
                    'rounded-full flex items-center justify-center transition-all duration-200 shrink-0 shadow-md',
                    disabled || isOtherQuestionRecording
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:opacity-90 active:scale-95',
                  )}
                >
                  <Mic className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          )}
        </div>

        {recorder.error && (
          <p className="text-xs text-[#C62828] flex items-center gap-1.5 mt-1" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{recorder.error}</span>
          </p>
        )}

        {uploadError && (
          <p className="text-xs text-[#C62828] font-medium flex items-center gap-1 mt-1" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{uploadError}</span>
          </p>
        )}
      </div>
    </Card>
  );
};
