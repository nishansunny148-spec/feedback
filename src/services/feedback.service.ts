import { getSupabase } from '../lib/supabase';
import { isChoice } from '../lib/constants';
import type {
  Answer,
  Choice,
  Feedback,
  FeedbackStats,
  FeedbackStatus,
  ListFeedbackParams,
  ListFeedbackResult,
  SubmitFeedbackInput,
} from '../types/feedback';
import { appError, toAppError } from './errors';
import { removeVoiceNote } from './storage.service';

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Defensive row parser so the UI never sees malformed data. */
export function parseFeedback(row: Record<string, unknown>): Feedback {
  const status: FeedbackStatus = row.status === 'in_progress' || row.status === 'done' ? row.status : 'new';
  const rawAnswers = Array.isArray(row.feedback_answers) ? row.feedback_answers : [];
  const feedback_answers: Answer[] = rawAnswers
    .map((a: Record<string, unknown>) => ({
      id: str(a.id) ?? undefined,
      feedback_id: str(a.feedback_id) ?? undefined,
      question_no: Number(a.question_no ?? 0),
      choice: isChoice(a.choice) ? a.choice : ('excellent' as Choice),
      message: str(a.message) ?? undefined,
      audio_path: str(a.audio_path) ?? undefined,
      audio_mime: str(a.audio_mime) ?? undefined,
      audio_duration_sec: num(a.audio_duration_sec) ?? undefined,
    }))
    .sort((a, b) => a.question_no - b.question_no);

  return {
    id: String(row.id ?? ''),
    created_at: str(row.created_at) ?? new Date().toISOString(),
    client_id: str(row.client_id),
    client_name: str(row.client_name),
    company_name: str(row.company_name),
    satisfaction: isChoice(row.satisfaction) ? row.satisfaction : null,
    satisfaction_q2: isChoice(row.satisfaction_q2) ? row.satisfaction_q2 : null,
    project: str(row.project),
    rating: num(row.rating),
    message: str(row.message),
    liked: str(row.liked),
    changes_needed: str(row.changes_needed),
    audio_path: str(row.audio_path),
    audio_mime: str(row.audio_mime),
    audio_duration_sec: num(row.audio_duration_sec),
    status,
    feedback_answers,
  };
}

function rowsOf(data: unknown): Feedback[] {
  return Array.isArray(data) ? data.map((r) => parseFeedback(r as Record<string, unknown>)) : [];
}

const blankToUndefined = (v?: string | null) => {
  const t = v?.trim();
  return t ? t : undefined;
};

export async function submitFeedback(input: SubmitFeedbackInput): Promise<void> {
  if (input.consent !== true) throw appError('validation');
  const clientName = blankToUndefined(input.client_name);
  const companyName = blankToUndefined(input.companyName);
  if (!clientName || !companyName || !Array.isArray(input.answers) || input.answers.length === 0) {
    throw appError('validation');
  }

  // Ensure each answer has required fields
  const cleanAnswers = input.answers.map((a) => {
    const item: {
      question_no: number;
      choice: Choice;
      message?: string;
      audio_path?: string;
      audio_mime?: string;
      audio_duration_sec?: number;
    } = {
      question_no: Number(a.question_no),
      choice: a.choice,
    };
    const msg = blankToUndefined(a.message);
    if (msg) item.message = msg;

    const path = blankToUndefined(a.audio_path);
    if (path) item.audio_path = path;

    const mimeRaw = blankToUndefined(a.audio_mime);
    if (mimeRaw) item.audio_mime = mimeRaw.split(';')[0].trim();

    if (typeof a.audio_duration_sec === 'number' && Number.isFinite(a.audio_duration_sec)) {
      item.audio_duration_sec = Math.max(0, Math.min(600, Math.round(a.audio_duration_sec)));
    }
    return item;
  });

  const payload: Record<string, unknown> = {
    p_client_name: clientName,
    p_company_name: companyName,
    p_answers: cleanAnswers,
    p_consent: true,
  };

  const token = blankToUndefined(input.client_token);
  if (token) payload.p_client_token = token;

  const project = blankToUndefined(input.project);
  if (project) payload.p_project = project;

  const { error } = await getSupabase().rpc('submit_feedback', payload);
  if (error) throw toAppError(error);
}

/** Strips characters that have meaning inside a PostgREST `or=(...)` filter. */
function sanitizeSearch(term: string): string {
  return term.replace(/[,()*%\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

export async function listFeedback(params: ListFeedbackParams): Promise<ListFeedbackResult> {
  const { status, satisfaction, needsWork, search, rating, clientName, from, to, sort = 'created_at', dir = 'desc', limit, offset } =
    params;

  let query = getSupabase().from('feedback').select('*, feedback_answers(*)').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (satisfaction) query = query.eq('satisfaction', satisfaction);
  if (rating) query = query.eq('rating', rating);
  if (clientName) query = query.eq('client_name', clientName);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const term = search ? sanitizeSearch(search) : '';
  if (term) {
    query = query.or(
      `client_name.ilike.*${term}*,company_name.ilike.*${term}*,message.ilike.*${term}*,liked.ilike.*${term}*,changes_needed.ilike.*${term}*`,
    );
  }

  const { data, error } = await query;
  if (error) throw toAppError(error);

  let rows = rowsOf(data);

  // Client-side filtering for search term matching inside feedback_answers message
  if (term) {
    const lowerTerm = term.toLowerCase();
    rows = rows.filter((r) => {
      const matchHeader =
        r.client_name?.toLowerCase().includes(lowerTerm) ||
        r.company_name?.toLowerCase().includes(lowerTerm) ||
        r.message?.toLowerCase().includes(lowerTerm);
      if (matchHeader) return true;
      return r.feedback_answers?.some((a) => a.message?.toLowerCase().includes(lowerTerm));
    });
  }

  // Client-side filtering for needsWork (any answer is wants_improvements)
  if (needsWork) {
    rows = rows.filter((r) => {
      if (r.feedback_answers && r.feedback_answers.length > 0) {
        return r.feedback_answers.some((a) => a.choice === 'wants_improvements');
      }
      return r.satisfaction === 'wants_improvements' || r.satisfaction_q2 === 'wants_improvements';
    });
  }

  // Sort & Paginate
  if (sort === 'rating') {
    rows.sort((a, b) => {
      const rA = a.rating ?? 0;
      const rB = b.rating ?? 0;
      return dir === 'asc' ? rA - rB : rB - rA;
    });
  }

  const total = rows.length;
  const pagedRows = rows.slice(offset, offset + limit);

  return { rows: pagedRows, total };
}

/** Aggregate stats for stats bar. */
export async function getFeedbackStats(): Promise<FeedbackStats> {
  const { data, error } = await getSupabase().from('feedback').select('status, satisfaction, satisfaction_q2, feedback_answers(choice)');
  if (error) throw toAppError(error);

  const stats: FeedbackStats = {
    total: 0,
    new: 0,
    in_progress: 0,
    done: 0,
    satisfaction: { excellent: 0, satisfactory: 0, wants_improvements: 0 },
    totalAnswers: 0,
    excellentAnswers: 0,
    excellentPercentage: 0,
  };

  const rows: unknown = data;
  if (Array.isArray(rows)) {
    for (const raw of rows) {
      const row = raw as {
        status?: unknown;
        satisfaction?: unknown;
        satisfaction_q2?: unknown;
        feedback_answers?: Array<{ choice?: unknown }>;
      };
      stats.total += 1;
      if (row.status === 'in_progress') stats.in_progress += 1;
      else if (row.status === 'done') stats.done += 1;
      else stats.new += 1;

      if (Array.isArray(row.feedback_answers) && row.feedback_answers.length > 0) {
        for (const ans of row.feedback_answers) {
          if (isChoice(ans.choice)) {
            stats.totalAnswers += 1;
            stats.satisfaction[ans.choice] += 1;
            if (ans.choice === 'excellent') {
              stats.excellentAnswers += 1;
            }
          }
        }
      } else {
        // Fallback for legacy rows
        if (isChoice(row.satisfaction)) {
          stats.totalAnswers += 1;
          stats.satisfaction[row.satisfaction] += 1;
          if (row.satisfaction === 'excellent') stats.excellentAnswers += 1;
        }
        if (isChoice(row.satisfaction_q2)) {
          stats.totalAnswers += 1;
          stats.satisfaction[row.satisfaction_q2] += 1;
          if (row.satisfaction_q2 === 'excellent') stats.excellentAnswers += 1;
        }
      }
    }
  }

  stats.excellentPercentage =
    stats.totalAnswers > 0 ? Math.round((stats.excellentAnswers / stats.totalAnswers) * 100) : 0;

  return stats;
}

export async function updateStatus(id: string, status: FeedbackStatus): Promise<void> {
  const { data, error } = await getSupabase().from('feedback').update({ status }).eq('id', id).select('id');
  if (error) throw toAppError(error);
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

