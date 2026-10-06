import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let client: SupabaseClient | null = null;

/**
 * The single Supabase client for the app. Created lazily so a missing env
 * renders the configuration screen instead of crashing at import time.
 * Only files in `src/services` may import this.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const { supabaseUrl, supabaseAnonKey } = env();
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'vf-auth',
      },
    });
  }
  return client;
}
