export type FeedbackStatus = 'new' | 'in_progress' | 'done';

export const FEEDBACK_STATUSES: readonly FeedbackStatus[] = ['new', 'in_progress', 'done'];

export const STATUS_LABEL: Record<FeedbackStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  done: 'Done',
};

export type Satisfaction = 'excellent' | 'satisfactory' | 'wants_improvements';

export interface Client {
  name: string;
  project: string | null;
}

export interface Feedback {
  id: string;
  created_at: string;
  client_id: string | null;
  client_name: string | null;
  /** Null on rows submitted before the company field existed. */
  company_name: string | null;
  /** Null on rows submitted before Question 1 existed. */
  satisfaction: Satisfaction | null;
  project: string | null;
  /** Legacy 1–5 rating, only present on old rows. */
  rating?: number | null;
  liked: string | null;
  changes_needed: string | null;
  audio_path: string | null;
  audio_mime: string | null;
  audio_duration_sec: number | null;
  status: FeedbackStatus;
}

export interface SubmitFeedbackInput {
  client_token?: string;
  client_name: string;
  companyName: string;
  satisfaction: Satisfaction;
  project?: string;
  /** Legacy, no longer collected by the form. */
  rating?: number;
  liked?: string;
  changes_needed?: string;
  audio_path?: string;
  audio_mime?: string;
  audio_duration_sec?: number;
  consent: true;
}

export type FeedbackSort = 'created_at' | 'rating';
export type SortDirection = 'asc' | 'desc';

export interface ListFeedbackParams {
  status?: FeedbackStatus;
  satisfaction?: Satisfaction;
  search?: string;
  rating?: number;
  clientName?: string;
  from?: string;
  to?: string;
  sort?: FeedbackSort;
  dir?: SortDirection;
  limit: number;
  offset: number;
}

export interface ListFeedbackResult {
  rows: Feedback[];
  total: number;
}

export interface FeedbackStats {
  total: number;
  new: number;
  in_progress: number;
  done: number;
  satisfaction: Record<Satisfaction, number>;
}

/** Admin inbox filters, mirrored in the URL query string. */
export interface FeedbackFilters {
  status?: FeedbackStatus;
  satisfaction?: Satisfaction;
  search: string;
  rating?: number;
  clientName?: string;
  /** yyyy-mm-dd (local) */
  from?: string;
  /** yyyy-mm-dd (local) */
  to?: string;
  sort: FeedbackSort;
  dir: SortDirection;
}

/** A voice note ready to upload, from the recorder or the file fallback. */
export interface VoiceNote {
  blob: Blob;
  mime: string;
  extension: string;
  durationSeconds: number | null;
  source: 'recorder' | 'file';
  fileName?: string;
}

export type AppErrorCode =
  | 'network'
  | 'invalid_credentials'
  | 'session_expired'
  | 'permission'
  | 'not_found'
  | 'validation'
  | 'empty_submission'
  | 'file_too_large'
  | 'unsupported_type'
  | 'rate_limited'
  | 'server'
  | 'unknown';

/** The only error type thrown by the service layer. `message` is user-safe. */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly retryable: boolean;

  constructor(code: AppErrorCode, message: string, retryable = false, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.retryable = retryable;
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}
