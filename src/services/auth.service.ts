import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { toAppError } from './errors';

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw toAppError(error);
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw toAppError(error);
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw toAppError(error);
  return data.session;
}

export function onAuthChange(cb: (s: Session | null) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export type { Session };
