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
  const auth = getSupabase().auth;
  const { data, error } = await auth.getSession();
  if (error) throw toAppError(error);
  if (!data.session) return null;
  const { data: verified, error: verificationError } = await auth.getUser(data.session.access_token);
  if (verificationError) throw toAppError(verificationError);
  if (!verified.user || verified.user.id !== data.session.user.id) return null;
  return { ...data.session, user: verified.user };
}

export function onAuthChange(cb: (s: Session | null) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export type { Session };
