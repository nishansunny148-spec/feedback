import { AlertCircle, Mic, Pause, Play, Square, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { UseVoiceRecorderResult } from '../../hooks/useVoiceRecorder';
import { claimPlayback, releasePlayback } from '../../lib/audio';
import { cn } from '../../lib/cn';
import { detectInAppBrowser, hasRecordingSupport } from '../../lib/env-detect';
import { formatClock } from '../../lib/format';
import { Waveform } from './Waveform';

export interface TellUsMoreBoxProps {
  value: string;
  onChange: (text: string) => void;
  recorder: UseVoiceRecorderResult;
  title?: string;
  subLabel?: string;
  disabled?: boolean;
  error?: string;
}

export const TellUsMoreBox: React.FC<TellUsMoreBoxProps> = ({
  value,
  onChange,
  recorder,
  title,
  subLabel,
  disabled,
  error,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(recorder.durationSeconds || 0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const useFallback = !hasRecordingSupport() || Boolean(detectInAppBrowser());

  // Handle audio preview playback when recorder.blob exists
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
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
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
    if (disabled) return;
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
    <div className="flex flex-col gap-1.5 w-full">
      {/* Label and Hint */}
      <div className="flex flex-col gap-1 w-full mb-1">
        <div className="flex items-center justify-between">
          <label htmlFor="field-tell-us-more" className="text-xs font-semibold text-fg-2 uppercase tracking-wider">
            {title || 'Question 2'}
          </label>
          <span className="text-[11px] text-fg-3">Typing or Voice Notes</span>
        </div>
        {subLabel && (
          <p lang="gu" className="text-base sm:text-lg text-fg font-medium leading-relaxed mt-0.5">
            {subLabel}
          </p>
        )}
      </div>

      {/* Hidden File Fallback Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        tabIndex={-1}
      />

      {/* Main Container */}
      <div className="relative w-full rounded-card border border-line/10 bg-raised p-3.5 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all shadow-sm">
        {isRecordingState ? (
          /* State 1: Active Recording Bar */
          <div
            className="w-full flex flex-col justify-between gap-3 min-h-[120px] py-1"
            aria-live="polite"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rec animate-pulse shrink-0" />
                <span className="text-xs font-semibold text-rec tabular">
                  {recorder.state === 'requesting'
                    ? 'Requesting mic…'
                    : formatClock(recorder.elapsedSeconds)}
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
          /* State 2: Textarea + Voice Chip (if present) + Round Mic Button */
          <div className="relative w-full flex flex-col">
            {/* Voice Note Chip */}
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

            {/* Textarea */}
            <textarea
              id="field-tell-us-more"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              rows={4}
              maxLength={2000}
              placeholder="Type here or tap the mic to send a voice note…"
              className="w-full bg-transparent border-0 resize-none text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:ring-0 pb-8 pr-14"
            />

            {/* Counter bottom-left */}
            <span className="absolute bottom-0 left-0 text-[11px] text-fg-3 tabular select-none">
              {value.length}/2000
            </span>

            {/* Round Mic Button bottom-right (hidden while voice note exists) */}
            {!recorder.blob && (
              <button
                type="button"
                onClick={handleMicTap}
                disabled={disabled}
                aria-label="Record a voice note"
                className={cn(
                  'absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 focus-ring shadow-md',
                  disabled
                    ? 'bg-white/60 text-black/40 border-2 border-black/30 cursor-not-allowed opacity-60'
                    : 'bg-white text-black border-2 border-black hover:bg-neutral-100 shadow-black/10 hover:scale-105 active:scale-95',
                )}
              >
                <Mic className="w-5 h-5 text-black" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mic Permission or Audio Error Inline Notice */}
      {recorder.error && (
        <p className="text-xs text-danger flex items-center gap-1.5 mt-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{recorder.error}</span>
        </p>
      )}

      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
