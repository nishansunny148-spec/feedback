import { Upload } from 'lucide-react';
import React, { useRef } from 'react';
import { MAX_AUDIO_BYTES, normalizeAudioMime } from '../../services/storage.service';
import { Button } from '../ui/Button';

export interface FileFallbackProps {
  onFileSelect: (file: File) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

export const FileFallback: React.FC<FileFallbackProps> = ({ onFileSelect, onError, disabled }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AUDIO_BYTES) {
      onError('Audio file exceeds the 10 MB limit.');
      return;
    }

    const normalized = normalizeAudioMime(file.type, file.name);
    if (!normalized) {
      onError('Unsupported audio format. Please choose an MP3, M4A, WebM, OGG or WAV file.');
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-line/15 rounded-card bg-raised/50 hover:bg-raised transition-colors text-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        // @ts-expect-error capture is supported on iOS/Android
        capture="microphone"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        id="audio-file-fallback-input"
      />

      <div className="w-12 h-12 rounded-full bg-raised flex items-center justify-center text-accent-fg border border-line/10">
        <Upload className="w-6 h-6" />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-fg">Upload voice note</h4>
        <p className="text-xs text-fg-3 mt-1">Select or record an audio file on your device (max 10 MB)</p>
      </div>

      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        icon={<Upload className="w-4 h-4" />}
      >
        Choose audio file
      </Button>
    </div>
  );
};
