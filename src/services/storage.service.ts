import { env } from '../lib/env';
import { getSupabase } from '../lib/supabase';
import { toAppError, appError } from './errors';

export const VOICE_BUCKET = 'voice-notes';
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
};

const MIME_ALIASES: Record<string, string> = {
  'audio/m4a': 'audio/x-m4a',
  'audio/aac-mp4': 'audio/mp4',
  'audio/mp3': 'audio/mpeg',
  'audio/x-mp3': 'audio/mpeg',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
  'audio/vnd.wave': 'audio/wav',
  'audio/opus': 'audio/ogg',
  'video/webm': 'audio/webm',
  'video/mp4': 'audio/mp4',
};

const MIME_BY_EXT: Record<string, string> = {
  webm: 'audio/webm',
  weba: 'audio/webm',
  m4a: 'audio/x-m4a',
  mp4: 'audio/mp4',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/ogg',
  wav: 'audio/wav',
};

/**
 * Maps a browser-reported type (and optional file name) onto one of the mime
 * types the bucket accepts. Returns null for unsupported formats.
 */
export function normalizeAudioMime(type: string, fileName?: string): { mime: string; ext: string } | null {
  let base = type.split(';')[0]?.trim().toLowerCase() ?? '';
  base = MIME_ALIASES[base] ?? base;
  if (!EXT_BY_MIME[base] && fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext && MIME_BY_EXT[ext]) base = MIME_BY_EXT[ext];
  }
  const ext = EXT_BY_MIME[base];
  return ext ? { mime: base, ext } : null;
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function parseStorageError(status: number, body: string): unknown {
  try {
    const json = JSON.parse(body) as { statusCode?: unknown; error?: unknown; message?: unknown };
    const code = Number(json.statusCode);
    return { status: Number.isFinite(code) && code > 0 ? code : status, message: json.message, error: json.error };
  } catch {
    return { status, message: body };
  }
}

/**
 * Uploads a voice note to the private bucket. Uses XHR against the Storage
 * REST endpoint so real upload progress can be reported.
 */
export async function uploadVoiceNote(
  blob: Blob,
  ext: string,
  mime: string,
  onProgress?: (p: number) => void,
): Promise<{ path: string; mime: string }> {
  if (blob.size > MAX_AUDIO_BYTES) throw appError('file_too_large');
  const normalized = normalizeAudioMime(mime) ?? normalizeAudioMime('', `x.${ext}`);
  if (!normalized) throw appError('unsupported_type');

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const safeExt = ext.replace(/[^a-z0-9]/gi, '').toLowerCase() || normalized.ext;
  const path = `${yyyy}/${mm}/${randomId()}.${safeExt}`;

  const { supabaseUrl, supabaseAnonKey } = env();
  let bearer = supabaseAnonKey;
  try {
    const { data } = await getSupabase().auth.getSession();
    if (data.session?.access_token) bearer = data.session.access_token;
  } catch {
    /* anon upload is fine */
  }

  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const url = `${supabaseUrl}/storage/v1/object/${VOICE_BUCKET}/${encodedPath}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = 120_000;
    xhr.setRequestHeader('Authorization', `Bearer ${bearer}`);
    xhr.setRequestHeader('apikey', supabaseAnonKey);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('Content-Type', normalized.mime);
    xhr.setRequestHeader('cache-control', 'max-age=3600');
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) onProgress(Math.min(1, event.loaded / event.total));
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        reject(toAppError(parseStorageError(xhr.status, xhr.responseText)));
      }
    };
    xhr.onerror = () => reject(appError('network'));
    xhr.ontimeout = () => reject(appError('network'));
    xhr.onabort = () => reject(appError('network'));
    xhr.send(blob);
  });

  return { path, mime: normalized.mime };
}

export async function getSignedAudioUrl(path: string, expiresInSeconds = 600): Promise<string> {
  const { data, error } = await getSupabase().storage.from(VOICE_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) throw toAppError(error ?? { status: 404 });
  return data.signedUrl;
}

export async function removeVoiceNote(path: string): Promise<void> {
  const { error } = await getSupabase().storage.from(VOICE_BUCKET).remove([path]);
  if (error) throw toAppError(error);
}
