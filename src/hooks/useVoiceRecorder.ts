import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getAudioLevel, probeDuration } from '../lib/audio';
import { env } from '../lib/env';
import { extensionForMime, pickRecorderMime } from '../lib/env-detect';

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'recorded' | 'uploading' | 'done' | 'error';

export interface UseVoiceRecorderResult {
  state: RecorderState;
  elapsedSeconds: number;
  blob: Blob | null;
  mimeType: string;
  extension: string;
  durationSeconds: number | null;
  analyser: AnalyserNode | null;
  audioLevel: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
  setRecordedBlob: (file: File | Blob, sourceMime?: string) => Promise<void>;
  setState: (state: RecorderState) => void;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [extension, setExtension] = useState<string>('webm');
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const maxSeconds = env().maxRecordingSeconds;

  const cleanupAudioNodes = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);
    setAnalyser(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopTimer();
    cleanupAudioNodes();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setBlob(null);
    setMimeType('');
    setExtension('webm');
    setDurationSeconds(null);
    setElapsedSeconds(0);
    setError(null);
    setState('idle');
  }, [cleanupAudioNodes, stopTimer]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    stopTimer();
  }, [stopTimer]);

  const start = useCallback(async () => {
    reset();
    setError(null);
    setState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const selectedMime = pickRecorderMime();
      const options = selectedMime ? { mimeType: selectedMime } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      const actualMime = recorder.mimeType || selectedMime || 'audio/webm';
      const ext = extensionForMime(actualMime);
      setMimeType(actualMime);
      setExtension(ext);

      // Web Audio setup for live visualizer
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const node = ctx.createAnalyser();
          node.fftSize = 256;
          node.smoothingTimeConstant = 0.8;
          source.connect(node);
          setAnalyser(node);

          const buffer = new Uint8Array(node.frequencyBinCount);
          const updateLevel = () => {
            if (recorder.state === 'recording') {
              setAudioLevel(getAudioLevel(node, buffer));
              animFrameRef.current = requestAnimationFrame(updateLevel);
            }
          };
          animFrameRef.current = requestAnimationFrame(updateLevel);
        }
      } catch {
        /* visualizer fallback if audio context fails */
      }

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stopTimer();
        const durationSec = Math.max(0, (Date.now() - startTimeRef.current) / 1000);
        cleanupAudioNodes();

        if (durationSec < 1) {
          toast.error('Recording too short (under 1 second). Please try again.');
          reset();
          return;
        }

        const finalBlob = new Blob(chunksRef.current, { type: actualMime });
        setBlob(finalBlob);
        setElapsedSeconds(Math.round(durationSec));

        const probed = await probeDuration(finalBlob);
        setDurationSeconds(probed ?? Math.round(durationSec));
        setState('recorded');
      };

      recorder.onerror = () => {
        cleanupAudioNodes();
        stopTimer();
        setError('An error occurred while recording audio.');
        setState('error');
      };

      startTimeRef.current = Date.now();
      recorder.start(1000); // 1s chunks
      setState('recording');

      // Countdown timer & auto-stop
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);

        const remaining = maxSeconds - elapsed;
        if (remaining === 15) {
          toast.warning('15 seconds remaining in voice recording');
        }

        if (elapsed >= maxSeconds) {
          stop();
          toast.info(`Maximum recording time reached (${maxSeconds}s).`);
        }
      }, 250);
    } catch (err: unknown) {
      cleanupAudioNodes();
      stopTimer();
      let msg = 'Could not access your microphone. Please check permissions.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Microphone access denied. Please enable mic permissions in your browser settings to record.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No microphone found on your device.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          msg = 'Your microphone is currently being used by another application.';
        }
      }
      setError(msg);
      setState('error');
    }
  }, [cleanupAudioNodes, maxSeconds, reset, stop, stopTimer]);

  // Support file fallback blob
  const setRecordedBlob = useCallback(async (file: File | Blob, sourceMime?: string) => {
    reset();
    const type = sourceMime || file.type || 'audio/webm';
    const ext = extensionForMime(type);
    setMimeType(type);
    setExtension(ext);
    setBlob(file);

    const probed = await probeDuration(file);
    setDurationSeconds(probed);
    setElapsedSeconds(probed ? Math.round(probed) : 0);
    setState('recorded');
  }, [reset]);

  // Stop recording on page visibility hidden to save progress
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state === 'recording') {
        stop();
        toast.info('Recording stopped because the page was hidden.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state, stop]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      cleanupAudioNodes();
    };
  }, [cleanupAudioNodes, stopTimer]);

  return {
    state,
    elapsedSeconds,
    blob,
    mimeType,
    extension,
    durationSeconds,
    analyser,
    audioLevel,
    error,
    start,
    stop,
    reset,
    setRecordedBlob,
    setState,
  };
}
