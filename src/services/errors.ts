import { AppError, type AppErrorCode } from '../types/feedback';

/** User-facing copy for every error code. Raw backend messages never reach the UI. */
export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  network: "We couldn't reach the server. Check your connection and try again.",
  invalid_credentials: "That email and password combination didn't work.",
  session_expired: 'Your session has expired. Please sign in again.',
  permission: "You don't have permission to do that.",
  not_found: "We couldn't find that item. It may have been deleted.",
  validation: 'Some details look off. Please check the form and try again.',
  empty_submission: 'Record a voice note or answer at least one question.',
  file_too_large: 'That audio file is too large. The limit is 10 MB.',
  unsupported_type: "That audio format isn't supported. Try MP3, M4A, WebM, OGG or WAV.",
  rate_limited: 'Too many attempts. Please wait a moment and try again.',
  server: 'The server had a hiccup. Please try again in a moment.',
  unknown: 'Something went wrong. Please try again.',
};

const RETRYABLE: Record<AppErrorCode, boolean> = {
  network: true,
  invalid_credentials: false,
  session_expired: false,
  permission: false,
  not_found: false,
  validation: false,
  empty_submission: false,
  file_too_large: false,
  unsupported_type: false,
  rate_limited: true,
  server: true,
  unknown: true,
};

export function appError(code: AppErrorCode, cause?: unknown): AppError {
  return new AppError(code, ERROR_MESSAGES[code], RETRYABLE[code], cause);
}

interface ErrorShape {
  message?: unknown;
  error?: unknown;
  code?: unknown;
  status?: unknown;
  statusCode?: unknown;
  name?: unknown;
}

/** Normalises anything thrown by Supabase, fetch or XHR into an AppError. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  const e: ErrorShape = typeof err === 'object' && err !== null ? (err as ErrorShape) : {};
  const text = [e.message, e.error, typeof err === 'string' ? err : '']
    .filter((v): v is string => typeof v === 'string')
    .join(' ')
    .toLowerCase();
  const code = typeof e.code === 'string' ? e.code : '';
  const rawStatus = e.status ?? e.statusCode;
  const status = typeof rawStatus === 'number' ? rawStatus : typeof rawStatus === 'string' ? Number(rawStatus) : NaN;
  const name = typeof e.name === 'string' ? e.name : '';

  if (text.includes('invalid login credentials') || code === 'invalid_credentials') {
    return appError('invalid_credentials', err);
  }
  if (text.includes('empty submission')) return appError('empty_submission', err);
  if (text.includes('consent required') || ['23514', '22P02', '22001', '23502'].includes(code)) {
    return appError('validation', err);
  }
  if (text.includes('jwt expired') || code === 'PGRST301' || text.includes('refresh token')) {
    return appError('session_expired', err);
  }
  if (
    (typeof navigator !== 'undefined' && navigator.onLine === false) ||
    text.includes('failed to fetch') ||
    text.includes('networkerror') ||
    text.includes('load failed') ||
    text.includes('network request failed') ||
    name === 'AuthRetryableFetchError'
  ) {
    return appError('network', err);
  }
  if (status === 413 || text.includes('payload too large') || text.includes('exceeded the maximum')) {
    return appError('file_too_large', err);
  }
  if (status === 415 || text.includes('mime type') || code === 'invalid_mime_type') {
    return appError('unsupported_type', err);
  }
  if (status === 429 || text.includes('rate limit') || code === 'over_request_rate_limit') {
    return appError('rate_limited', err);
  }
  if (
    status === 401 ||
    status === 403 ||
    code === '42501' ||
    text.includes('row-level security') ||
    text.includes('permission denied') ||
    text.includes('unauthorized')
  ) {
    return appError('permission', err);
  }
  if (status === 404 || code === 'PGRST116' || text.includes('not found')) return appError('not_found', err);
  if (status >= 500) return appError('server', err);
  return appError('unknown', err);
}
