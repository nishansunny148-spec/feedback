import { getSupabase } from '../lib/supabase';
import type { Client } from '../types/feedback';
import { toAppError } from './errors';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{6,128}$/;

interface ClientRow {
  name?: unknown;
  project?: unknown;
}

function toClient(row: ClientRow): Client | null {
  if (typeof row.name !== 'string' || !row.name) return null;
  return { name: row.name, project: typeof row.project === 'string' && row.project ? row.project : null };
}

/** Resolves a share-link token to its client. Unknown / inactive tokens resolve to null. */
export async function getClientByToken(token: string): Promise<Client | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const { data, error } = await getSupabase().rpc('get_client_by_token', { p_token: token });
  if (error) throw toAppError(error);
  const rows: unknown = data;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return toClient(rows[0] as ClientRow);
}

/** Admin only: client list for the inbox filter. */
export async function listClients(): Promise<Client[]> {
  const { data, error } = await getSupabase().from('clients').select('name, project').order('name');
  if (error) throw toAppError(error);
  const rows: unknown = data;
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => toClient(r as ClientRow)).filter((c): c is Client => c !== null);
}
