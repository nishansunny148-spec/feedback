import { Download, Pause, Play, RefreshCw, RotateCcw, RotateCw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useSignedUrl } from '../../hooks/useSignedUrl';
import { canPlayMime, claimPlayback, releasePlayback } from '../../lib/audio';
import { formatClock } from '../../lib/format';
import { Button } from '../ui/Button';

export interface AudioPlayerProps {
  audioPath: string | null;
  audioMime: string | null;
  storedDurationSec: number | null;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioPath, audioMime, storedDurationSec }) => {
  const { url, loading: urlLoading, error: urlError, refresh } = useSignedUrl(audioPath, Boolean(audioPath));

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(storedDurationSec || 0);
  const [speed, setSpeed] = useState<number>(1);
  const [audioError, setAudioError] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isSupportedMime = canPlayMime(audioMime);

  useEffect(() => {
    if (!url || !isSupportedMime) return;

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.playbackRate = speed;

    const handleLoadedMetadata = () => {
      setAudioError(false);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      } else if (storedDurationSec && storedDurationSec > 0) {
        setDuration(storedDurationSec);
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

    const handleError = () => {
      setAudioError(true);
      setIsPlaying(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.pause();
      releasePlayback(audio);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('pause', handlePause);
      audio.src = '';
    };
  }, [url, isSupportedMime, storedDurationSec]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  if (!audioPath) {
    return <div className="text-xs text-fg-3 py-2">No voice recording available.</div>;
  }

  if (!isSupportedMime) {
    return (
      <div className="p-4 bg-raised border border-line/10 rounded-card flex flex-col gap-2">
        <p className="text-xs text-warning">Your browser cannot play this audio format directly ({audioMime}).</p>
        {url && (
          <a
            href={url}
            download="voice-note"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-accent-fg hover:underline font-medium"
          >
            <Download className="w-3.5 h-3.5" /> Download audio file
          </a>
        )}
      </div>
    );
  }

  if (urlLoading) {
    return (
      <div className="p-4 bg-raised border border-line/10 rounded-card flex items-center justify-center gap-2 text-xs text-fg-3">
        <svg className="w-4 h-4 animate-spin text-accent-fg" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading audio player…</span>
      </div>
    );
  }

  if (urlError || audioError) {
    return (
      <div className="p-4 bg-danger/10 border border-danger/20 rounded-card flex items-center justify-between gap-2 text-xs text-danger">
        <span>Could not load audio. The link may have expired.</span>
        <Button variant="ghost" size="sm" onClick={() => void refresh()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry
        </Button>
      </div>
    );
  }

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
        .catch(() => {
          setAudioError(true);
          setIsPlaying(false);
        });
    }
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Math.max(0, Math.min(duration || 1000, audio.currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cycleSpeed = () => {
    const currentIndex = SPEEDS.indexOf(speed);
    const nextIndex = (currentIndex + 1) % SPEEDS.length;
    setSpeed(SPEEDS[nextIndex]);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const effectiveDuration = duration || storedDurationSec || 0;
  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  return (
    <div className="w-full p-4 bg-raised border border-line/10 rounded-card flex flex-col gap-3">
      {/* Scrubber */}
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={effectiveDuration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}
          className="range"
          aria-label="Audio playback seek position"
        />
        <div className="flex justify-between text-xs text-fg-3 tabular">
          <span>{formatClock(currentTime)}</span>
          <span>{formatClock(effectiveDuration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(-10)}
            className="w-8 h-8 rounded-full text-fg-2 hover:text-fg"
            aria-label="Skip back 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            variant="primary"
            size="icon"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full"
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(10)}
            className="w-8 h-8 rounded-full text-fg-2 hover:text-fg"
            aria-label="Skip forward 10 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Speed Toggle */}
          <Button
            variant="secondary"
            size="sm"
            onClick={cycleSpeed}
            className="h-8 px-2.5 tabular text-xs"
            aria-label={`Playback speed ${speed}x`}
          >
            {speed}x
          </Button>

          {/* Download button */}
          {url && (
            <a
              href={url}
              download="voice-note"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-control text-fg-3 hover:text-fg hover:bg-card transition-colors"
              aria-label="Download audio file"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
