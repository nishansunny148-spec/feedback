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

export interface QuestionCardProps {
  questionNo: number;
  questionLabel: string;
  choice: Choice | undefined;
  onChoiceChange: (val: Choice) => void;
  message: string;
  onMessageChange: (val: string) => void;
  recorder: UseVoiceRecorderResult;
  isOtherQuestionRecording: boolean;
  onStartRecording: () => void;
  disabled?: boolean;
  choiceError?: string;
  uploadError?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questionNo,
  questionLabel,
  choice,
  onChoiceChange,
  message,
  onMessageChange,
  recorder,
  isOtherQuestionRecording,
  onStartRecording,
  disabled,
  choiceError,
  uploadError,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(recorder.durationSeconds || 0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const useFallback = !hasRecordingSupport() || Boolean(detectInAppBrowser());

  // Preview audio playback logic
  useEffect(() => {
    if (!recorder.blob) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const url = URL.createObjectURL(recorder.blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      } else if (recorder.durationSeconds && recorder.durationSeconds > 0) {
        setDuration(recorder.durationSeconds);
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
      audio.src = '';
      URL.revokeObjectURL(url);
    };
  }, [recorder.blob, recorder.durationSeconds]);

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
      e.target.value = '';
    }
  };

  const effectiveDuration = duration || recorder.durationSeconds || recorder.elapsedSeconds || 0;
  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;
  const isRecordingState = recorder.state === 'recording' || recorder.state === 'requesting';

  return (
    <Card
      id={`question-card-${questionNo}`}
      variant="glass"
      className="p-5 sm:p-6 flex flex-col gap-4 border border-line/15"
    >
      {/* a) "Question N" uppercase label + Gujarati question text */}
      <div className="flex flex-col gap-1 w-full">
        <span className="text-xs font-semibold text-fg-2 uppercase tracking-wider">
          Question {questionNo} <span className="text-danger">*</span>
        </span>
        <p lang="gu" className="text-base sm:text-lg text-fg font-medium leading-relaxed font-sans mt-0.5">
          {questionLabel}
        </p>
      </div>

      {/* b) 3-option picker without colored dots, stacked vertically under 480px */}
      <fieldset className="w-full flex flex-col gap-1.5" id={`field-q${questionNo}-choice`}>
        <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-2.5 w-full">
          {SATISFACTION_OPTIONS.map((opt) => {
            const selected = choice === opt.value;
            return (
              <label
                key={opt.value}
                className={cn(
                  'relative flex items-center gap-3 min-h-[52px] w-full px-4 py-2.5 rounded-control cursor-pointer select-none transition-all duration-200',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg',
                  selected
                    ? 'bg-accent/10 border border-accent shadow-sm'
                    : 'bg-raised border border-line/10 hover:border-line/30 hover:bg-card',
                  choiceError && !selected && 'border-danger/60',
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
                <span
                  aria-hidden="true"
                  className={cn(
                    'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                    selected ? 'border-accent-fg' : 'border-line/30',
                  )}
                >
                  <span
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-transform duration-200',
                      selected ? 'scale-100 bg-accent-fg' : 'scale-0',
                    )}
                  />
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-fg leading-tight whitespace-normal">{opt.en}</span>
                  <span lang="gu" className="text-xs text-fg-2">
                    {opt.gu}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {choiceError && (
          <p className="text-xs text-danger mt-1" role="alert">
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

      {/* c & d) Hint + Text box with round mic button inside at bottom-right */}
      <div className="flex flex-col gap-1.5 w-full mt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-fg-3 uppercase tracking-wider font-semibold">Additional Comments</span>
          <span className="text-[11px] text-fg-3">Typing or Voice Notes</span>
        </div>

        <div className="relative w-full rounded-card border border-line/10 bg-raised p-3.5 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all shadow-sm">
          {isRecordingState ? (
            /* Active recording view */
            <div className="w-full flex flex-col justify-between gap-3 min-h-[120px] py-1" aria-live="polite">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rec animate-pulse shrink-0" />
                  <span className="text-xs font-semibold text-rec tabular">
                    {recorder.state === 'requesting' ? 'Requesting mic…' : formatClock(recorder.elapsedSeconds)}
                  </span>
                </div>
                <span className="text-[11px] text-fg-3 tabular">Max 3:00</span>
              </div>

              <div className="w-full flex items-center justify-center">
                <Waveform analyser={recorder.analyser} audioLevel={recorder.audioLevel} height={36} barCount={24} />
              </div>

              <div className="flex items-center justify-between w-full pt-1">
                <button
                  type="button"
                  onClick={() => recorder.reset()}
                  aria-label="Cancel recording"
                  className="p-2 rounded-full text-fg-3 hover:text-danger hover:bg-danger/10 transition-colors focus-ring"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => recorder.stop()}
                  aria-label="Stop recording"
                  className="px-4 py-1.5 rounded-full bg-rec text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rec/20 hover:brightness-110 active:scale-95 transition-all focus-ring"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          ) : (
            /* Textarea + Voice Chip (if present) + Round Mic Button */
            <div className="relative w-full flex flex-col">
              {recorder.blob && recorder.state === 'recorded' && (
                <div className="flex items-center gap-2.5 p-2 bg-accent/10 border border-accent/20 rounded-control mb-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-full bg-accent text-accent-ink flex items-center justify-center shrink-0 hover:brightness-110 transition-transform active:scale-95 focus-ring shadow-sm"
                    aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5 fill-current" />
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
                    <div className="flex justify-between text-[10px] text-fg-3 tabular font-medium">
                      <span>{formatClock(currentTime)}</span>
                      <span>{formatClock(effectiveDuration)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => recorder.reset()}
                    className="w-7 h-7 rounded-full text-fg-3 hover:text-danger hover:bg-danger/10 flex items-center justify-center shrink-0 transition-colors focus-ring"
                    aria-label="Delete voice note"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <textarea
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                disabled={disabled}
                rows={3}
                maxLength={2000}
                placeholder="Type your response or tap the mic to record a voice note (optional)…"
                className="w-full bg-transparent border-0 resize-none text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:ring-0 pb-8 pr-14"
              />

              <span className="absolute bottom-0 left-0 text-[11px] text-fg-3 tabular select-none">
                {message.length}/2000
              </span>

              {!recorder.blob && (
                <button
                  type="button"
                  onClick={handleMicTap}
                  disabled={disabled || isOtherQuestionRecording}
                  aria-label={`Record a voice note for Question ${questionNo}`}
                  title={isOtherQuestionRecording ? 'Another recording is in progress' : 'Record voice note'}
                  className={cn(
                    'absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 focus-ring',
                    disabled || isOtherQuestionRecording
                      ? 'bg-raised text-fg-3 cursor-not-allowed opacity-50 border border-line/10'
                      : 'bg-accent text-accent-ink hover:brightness-110 shadow-md shadow-accent/20 hover:scale-105 active:scale-95',
                  )}
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {recorder.error && (
          <p className="text-xs text-danger flex items-center gap-1.5 mt-1" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{recorder.error}</span>
          </p>
        )}

        {uploadError && (
          <p className="text-xs text-danger font-medium flex items-center gap-1 mt-1" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{uploadError}</span>
          </p>
        )}
      </div>
    </Card>
  );
};
