import { getSupabase } from '../lib/supabase';
import { isSatisfaction } from '../lib/constants';
import type {
  Feedback,
  FeedbackStats,
  FeedbackStatus,
  ListFeedbackParams,
  ListFeedbackResult,
  SubmitFeedbackInput,
} from '../types/feedback';
import { appError, toAppError } from './errors';
import { removeVoiceNote } from './storage.service';

const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Columns read by the inbox list and detail drawer. */
const FEEDBACK_COLUMNS =
  'id, created_at, client_id, client_name, company_name, satisfaction, project, rating, liked, changes_needed, audio_path, audio_mime, audio_duration_sec, status';

/** Defensive row parser so the UI never sees malformed data. */
export function parseFeedback(row: Record<string, unknown>): Feedback {
  const status: FeedbackStatus = row.status === 'in_progress' || row.status === 'done' ? row.status : 'new';
  return {
    id: String(row.id ?? ''),
    created_at: str(row.created_at) ?? new Date().toISOString(),
    client_id: str(row.client_id),
    client_name: str(row.client_name),
    company_name: str(row.company_name),
    satisfaction: isSatisfaction(row.satisfaction) ? row.satisfaction : null,
    project: str(row.project),
    rating: num(row.rating),
    liked: str(row.liked),
    changes_needed: str(row.changes_needed),
    audio_path: str(row.audio_path),
    audio_mime: str(row.audio_mime),
    audio_duration_sec: num(row.audio_duration_sec),
    status,
  };
}

function rowsOf(data: unknown): Feedback[] {
  return Array.isArray(data) ? data.map((r) => parseFeedback(r as Record<string, unknown>)) : [];
}

const blankToUndefined = (v?: string) => {
  const t = v?.trim();
  return t ? t : undefined;
};

export async function submitFeedback(input: SubmitFeedbackInput): Promise<void> {
  if (input.consent !== true) throw appError('validation');
  const clientName = blankToUndefined(input.client_name);
  const companyName = blankToUndefined(input.companyName);
  if (!clientName || !companyName || !isSatisfaction(input.satisfaction)) throw appError('validation');

  const payload = {
    p_client_name: clientName,
    p_company_name: companyName,
    p_satisfaction: input.satisfaction,
    p_client_token: blankToUndefined(input.client_token),
    p_project: blankToUndefined(input.project),
    p_rating: input.rating,
    p_liked: blankToUndefined(input.liked),
    p_changes_needed: blankToUndefined(input.changes_needed),
    p_audio_path: blankToUndefined(input.audio_path),
    p_audio_mime: blankToUndefined(input.audio_mime),
    p_audio_duration_sec:
      typeof input.audio_duration_sec === 'number'
        ? Math.max(0, Math.min(600, Math.round(input.audio_duration_sec)))
        : undefined,
    p_consent: true,
  };
  if (!payload.p_audio_path && !payload.p_liked && !payload.p_changes_needed) throw appError('empty_submission');

  const { error } = await getSupabase().rpc('submit_feedback', payload);
  if (error) throw toAppError(error);
}

/** Strips characters that have meaning inside a PostgREST `or=(...)` filter. */
function sanitizeSearch(term: string): string {
  return term.replace(/[,()*%\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

export async function listFeedback(params: ListFeedbackParams): Promise<ListFeedbackResult> {
  const { status, satisfaction, search, rating, clientName, from, to, sort = 'created_at', dir = 'desc', limit, offset } =
    params;

  let query = getSupabase().from('feedback').select(FEEDBACK_COLUMNS, { count: 'exact' });
  if (status) query = query.eq('status', status);
  if (satisfaction) query = query.eq('satisfaction', satisfaction);
  if (rating) query = query.eq('rating', rating);
  if (clientName) query = query.eq('client_name', clientName);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);
  const term = search ? sanitizeSearch(search) : '';
  if (term) {
    query = query.or(
      `client_name.ilike.*${term}*,company_name.ilike.*${term}*,liked.ilike.*${term}*,changes_needed.ilike.*${term}*`,
    );
  }

  query = query.order(sort, { ascending: dir === 'asc', nullsFirst: false });
  if (sort !== 'created_at') query = query.order('created_at', { ascending: false });
  query = query.order('id', { ascending: true }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw toAppError(error);
  return { rows: rowsOf(data), total: count ?? 0 };
}

/** Lightweight aggregate for the stats bar (two narrow columns only). */
export async function getFeedbackStats(): Promise<FeedbackStats> {
  const { data, error } = await getSupabase().from('feedback').select('status, satisfaction');
  if (error) throw toAppError(error);
  const stats: FeedbackStats = {
    total: 0,
    new: 0,
    in_progress: 0,
    done: 0,
    satisfaction: { excellent: 0, satisfactory: 0, wants_improvements: 0 },
  };
  const rows: unknown = data;
  if (Array.isArray(rows)) {
    for (const raw of rows) {
      const row = raw as { status?: unknown; satisfaction?: unknown };
      stats.total += 1;
      if (row.status === 'in_progress') stats.in_progress += 1;
      else if (row.status === 'done') stats.done += 1;
      else stats.new += 1;
      if (isSatisfaction(row.satisfaction)) stats.satisfaction[row.satisfaction] += 1;
    }
  }
  return stats;
}

export async function updateStatus(id: string, status: FeedbackStatus): Promise<void> {
  const { data, error } = await getSupabase().from('feedback').update({ status }).eq('id', id).select('id');
  if (error) throw toAppError(error);
  // RLS silently filters rows; zero affected rows means no permission or gone.
  if (!Array.isArray(data) || data.length === 0) throw appError('permission');
}

export async function deleteFeedback(id: string, audioPath: string | null): Promise<void> {
  if (audioPath) {
    try {
      await removeVoiceNote(audioPath);
    } catch (err) {
      const e = toAppError(err);
      if (e.code !== 'not_found') throw e;
    }
  }
  const { data, error } = await getSupabase().from('feedback').delete().eq('id', id).select('id');
  if (error) throw toAppError(error);
  if (!Array.isArray(data) || data.length === 0) throw appError('not_found');
}

export function subscribeToFeedback(handlers: {
  onInsert(f: Feedback): void;
  onUpdate(f: Feedback): void;
}): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`feedback-inbox-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, (payload) => {
      handlers.onInsert(parseFeedback(payload.new));
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feedback' }, (payload) => {
      handlers.onUpdate(parseFeedback(payload.new));
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
