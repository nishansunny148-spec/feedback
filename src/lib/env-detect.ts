export type Platform = 'ios' | 'android' | 'desktop';

const IN_APP_BROWSERS: { name: string; pattern: RegExp }[] = [
  { name: 'WhatsApp', pattern: /WhatsApp/i },
  { name: 'Instagram', pattern: /Instagram/i },
  { name: 'Facebook', pattern: /FBAN|FBAV|FB_IAB|FBIOS|FB4A|FBMD/i },
  { name: 'LINE', pattern: /\bLine\//i },
  { name: 'Snapchat', pattern: /Snapchat/i },
  { name: 'LinkedIn', pattern: /LinkedInApp/i },
];

function ua(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent;
}

/** Returns the in-app browser name (e.g. "WhatsApp") or null. */
export function detectInAppBrowser(userAgent: string = ua()): string | null {
  return IN_APP_BROWSERS.find((b) => b.pattern.test(userAgent))?.name ?? null;
}

export function getPlatform(userAgent: string = ua()): Platform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  // iPadOS 13+ reports as desktop Safari.
  if (/Macintosh/i.test(userAgent) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1) {
    return 'ios';
  }
  if (/Android/i.test(userAgent)) return 'android';
  return 'desktop';
}

/** True when the browser can capture audio with getUserMedia + MediaRecorder. */
export function hasRecordingSupport(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    window.isSecureContext !== false &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof window.MediaRecorder !== 'undefined'
  );
}

export function pickRecorderMime(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return '';
  return ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

export function extensionForMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes('mp4') || m.includes('m4a') || m.includes('aac')) return 'm4a';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('wav')) return 'wav';
  return 'webm';
}

export function canHover(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
