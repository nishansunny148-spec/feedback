import { motion } from 'framer-motion';
import { Mic, RefreshCw, Square } from 'lucide-react';
import React, { useState } from 'react';
import type { UseVoiceRecorderResult } from '../../hooks/useVoiceRecorder';
import { env } from '../../lib/env';
import { formatClock } from '../../lib/format';
import { Button } from '../ui/Button';
import { AudioPreview } from './AudioPreview';
import { Waveform } from './Waveform';

export interface VoiceRecorderProps {
  recorder: UseVoiceRecorderResult;
  onFileFallbackNeeded?: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ recorder, onFileFallbackNeeded }) => {
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const maxSeconds = env().maxRecordingSeconds;

  const {
    state,
    elapsedSeconds,
    blob,
    durationSeconds,
    analyser,
    audioLevel,
    error,
    start,
    stop,
    reset,
  } = recorder;

  const handleToggle = () => {
    if (state === 'idle' || state === 'error') {
      void start();
    } else if (state === 'recording') {
      stop();
    }
  };

  const handleResetClick = () => {
    if (state === 'recorded') {
      setShowConfirmReset(true);
    } else {
      reset();
    }
  };

  const confirmReset = () => {
    setShowConfirmReset(false);
    reset();
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {state === 'recorded' && blob ? (
        <div className="w-full flex flex-col gap-3">
          <AudioPreview blob={blob} durationSeconds={durationSeconds} onReset={handleResetClick} />

          {showConfirmReset && (
            <div className="p-3 bg-raised border border-warning/20 rounded-control flex items-center justify-between gap-2 text-xs">
              <span className="text-fg-2">Discard current recording?</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowConfirmReset(false)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={confirmReset}>
                  Discard
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-5 p-6 bg-raised border border-line/10 rounded-hero shadow-glass">
          {/* Waveform / Status Display */}
          <div className="w-full flex flex-col items-center justify-center min-h-[56px] gap-2">
            {state === 'recording' ? (
              <>
                <Waveform analyser={analyser} audioLevel={audioLevel} height={40} />
                <span className="text-xs text-rec font-medium tabular">
                  {formatClock(elapsedSeconds)} / {formatClock(maxSeconds)}
                </span>
              </>
            ) : (
              <span className="text-xs text-fg-3 font-medium">
                {state === 'requesting' ? 'Requesting microphone…' : 'Tap to start recording'}
              </span>
            )}
          </div>

          {/* Record Button */}
          <div className="relative flex items-center justify-center">
            {/* Live Audio Level Pulsing Ring */}
            {state === 'recording' && (
              <motion.div
                animate={{ scale: 1 + audioLevel * 0.4, opacity: 0.3 + audioLevel * 0.5 }}
                transition={{ duration: 0.1 }}
                className="absolute inset-0 rounded-full bg-rec"
                style={{ filter: 'blur(8px)' }}
              />
            )}

            <motion.button
              type="button"
              onClick={handleToggle}
              disabled={state === 'requesting'}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              aria-pressed={state === 'recording'}
              aria-label={
                state === 'recording'
                  ? `Stop recording (${elapsedSeconds} seconds elapsed)`
                  : 'Start voice recording'
              }
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-colors focus-ring select-none shadow-lg ${
                state === 'recording'
                  ? 'bg-rec text-white shadow-rec/30'
                  : 'bg-accent text-accent-ink hover:brightness-110 shadow-accent/20'
              }`}
            >
              {state === 'recording' ? (
                <Square className="w-8 h-8 fill-current" />
              ) : (
                <Mic className="w-9 h-9" />
              )}
            </motion.button>
          </div>

          {/* Helper text or fallback trigger */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-fg-3 tabular">
              {state === 'recording' ? 'Tap to stop' : `Max ${Math.round(maxSeconds / 60)} minutes`}
            </span>
            {onFileFallbackNeeded && state === 'idle' && (
              <button
                type="button"
                onClick={onFileFallbackNeeded}
                className="text-[11px] text-fg-3 hover:text-fg underline mt-1"
              >
                Can't record? Upload audio file instead
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="w-full p-3 bg-danger/10 border border-danger/20 rounded-control text-xs text-danger flex items-center justify-between gap-2">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={reset} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};
