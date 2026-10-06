const pad = (n: number) => String(n).padStart(2, '0');

/** 42 → "00:42", 185 → "03:05" */
export function formatClock(totalSeconds: number | null | undefined): string {
  const s = Math.max(0, Math.floor(Number.isFinite(totalSeconds ?? NaN) ? (totalSeconds as number) : 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** 42 → "42 seconds", 125 → "2 minutes 5 seconds" (for screen readers) */
export function formatSpokenDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (m > 0) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  if (sec > 0 || m === 0) parts.push(`${sec} second${sec === 1 ? '' : 's'}`);
  return parts.join(' ');
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** i;
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

const rtf = typeof Intl !== 'undefined' ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }) : null;

export function formatRelative(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diff = (then - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return 'just now';
  const table: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [604800, 'day'],
    [2629800, 'week'],
    [31557600, 'month'],
    [Infinity, 'year'],
  ];
  const divisors: Record<Intl.RelativeTimeFormatUnit, number> = {
    second: 1,
    seconds: 1,
    minute: 60,
    minutes: 60,
    hour: 3600,
    hours: 3600,
    day: 86400,
    days: 86400,
    week: 604800,
    weeks: 604800,
    month: 2629800,
    months: 2629800,
    quarter: 7889400,
    quarters: 7889400,
    year: 31557600,
    years: 31557600,
  };
  for (const [limit, unit] of table) {
    if (abs < limit) {
      const value = Math.round(diff / divisors[unit]);
      return rtf ? rtf.format(value, unit) : `${Math.abs(value)} ${unit}s ago`;
    }
  }
  return '';
}

const absFmt =
  typeof Intl !== 'undefined'
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

export function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return absFmt ? absFmt.format(d) : d.toISOString();
}

export function formatMime(mime: string | null): string {
  if (!mime) return 'Unknown';
  const map: Record<string, string> = {
    'audio/webm': 'WebM · Opus',
    'audio/mp4': 'M4A · AAC',
    'audio/x-m4a': 'M4A · AAC',
    'audio/mpeg': 'MP3',
    'audio/ogg': 'OGG',
    'audio/wav': 'WAV',
  };
  return map[mime] ?? mime;
}
