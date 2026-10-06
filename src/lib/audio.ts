let current: HTMLAudioElement | null = null;

/** Ensures only one audio element in the app plays at a time. */
export function claimPlayback(el: HTMLAudioElement): void {
  if (current && current !== el && !current.paused) current.pause();
  current = el;
}

export function releasePlayback(el: HTMLAudioElement): void {
  if (current === el) current = null;
}

/** RMS level of the current analyser frame, scaled to roughly 0..1 for speech. */
export function getAudioLevel(analyser: AnalyserNode, buffer: Uint8Array): number {
  analyser.getByteTimeDomainData(buffer as Parameters<AnalyserNode['getByteTimeDomainData']>[0]);
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = (buffer[i] - 128) / 128;
    sum += v * v;
  }
  const rms = Math.sqrt(sum / buffer.length);
  return Math.min(1, rms * 3.2);
}

export function canPlayMime(mime: string | null): boolean {
  if (!mime || typeof document === 'undefined') return true;
  const probe = document.createElement('audio');
  if (probe.canPlayType(mime) !== '') return true;
  // Some browsers only answer for the canonical type.
  if (mime === 'audio/x-m4a') return probe.canPlayType('audio/mp4') !== '';
  return false;
}

/** Reads duration from a file's metadata. Resolves null when unknown (e.g. WebM). */
export function probeDuration(blob: Blob, timeoutMs = 6000): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement('audio');
    let settled = false;
    const finish = (value: number | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      audio.removeAttribute('src');
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(null), timeoutMs);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () =>
      finish(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null);
    audio.onerror = () => finish(null);
    audio.src = url;
  });
}
