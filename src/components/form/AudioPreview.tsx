import { Pause, Play } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { claimPlayback, releasePlayback } from '../../lib/audio';
import { formatClock } from '../../lib/format';
import { Button } from '../ui/Button';

export interface AudioPreviewProps {
  blob: Blob;
  durationSeconds?: number | null;
  onReset?: () => void;
}

export const AudioPreview: React.FC<AudioPreviewProps> = ({ blob, durationSeconds, onReset }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(durationSeconds || 0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    objectUrlRef.current = url;

    const audio = new Audio(url);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      } else if (durationSeconds && durationSeconds > 0) {
        setDuration(durationSeconds);
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
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [blob, durationSeconds]);

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

  const effectiveDuration = duration || durationSeconds || 0;
  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  return (
    <div className="w-full flex flex-col gap-3 p-4 bg-raised border border-line/10 rounded-card">
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="icon"
          onClick={togglePlay}
          className="w-10 h-10 rounded-full shrink-0"
          aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </Button>

        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min={0}
            max={effectiveDuration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}
            className="range"
            aria-label="Seek audio"
          />
          <div className="flex justify-between text-xs text-fg-3 tabular">
            <span>{formatClock(currentTime)}</span>
            <span>{formatClock(effectiveDuration)}</span>
          </div>
        </div>
      </div>

      {onReset && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-fg-3 hover:text-fg underline transition-colors"
          >
            Re-record audio
          </button>
        </div>
      )}
    </div>
  );
};
