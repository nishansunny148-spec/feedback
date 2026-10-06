export interface AppEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  turnstileSiteKey: string | null;
  maxRecordingSeconds: number;
  appName: string;
}

export type EnvStatus = { ok: true; env: AppEnv } | { ok: false; problems: string[] };

function clean(value: string | undefined): string {
  // Strip inline comments that some editors leave in .env files.
  return (value ?? '').replace(/\s+#.*$/, '').trim();
}

function decodeJwtRole(token: string): string | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

function readEnv(): EnvStatus {
  const problems: string[] = [];
  const supabaseUrl = clean(import.meta.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
  const supabaseAnonKey =
    clean(import.meta.env.VITE_SUPABASE_ANON_KEY) || clean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const turnstile = clean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const maxRaw = clean(import.meta.env.VITE_MAX_RECORDING_SECONDS);
  const appName = clean(import.meta.env.VITE_APP_NAME) || 'Voice Feedback';

  if (!supabaseUrl) {
    problems.push('VITE_SUPABASE_URL is missing.');
  } else if (!/^https?:\/\/[^\s]+$/i.test(supabaseUrl)) {
    problems.push('VITE_SUPABASE_URL must be a full http(s) URL, e.g. https://xyz.supabase.co');
  }

  if (!supabaseAnonKey) {
    problems.push('VITE_SUPABASE_ANON_KEY is missing.');
  } else if (supabaseAnonKey.startsWith('sb_secret_') || decodeJwtRole(supabaseAnonKey) === 'service_role') {
    // Hard stop: a privileged key must never be bundled into a public site.
    problems.push(
      'VITE_SUPABASE_ANON_KEY is a service-role / secret key. Use the public "anon" (publishable) key instead, and rotate the secret key if it was exposed.',
    );
  }

  const maxRecordingSeconds = maxRaw ? Number(maxRaw) : 180;
  if (!Number.isFinite(maxRecordingSeconds) || maxRecordingSeconds < 5 || maxRecordingSeconds > 600) {
    problems.push('VITE_MAX_RECORDING_SECONDS must be a number between 5 and 600.');
  }

  if (problems.length > 0) return { ok: false, problems };

  return {
    ok: true,
    env: {
      supabaseUrl,
      supabaseAnonKey,
      turnstileSiteKey: turnstile || null,
      maxRecordingSeconds: Math.round(maxRecordingSeconds),
      appName,
    },
  };
}

export const envStatus: EnvStatus = readEnv();

/** Typed env access. Throws if required variables are missing or invalid. */
export function env(): AppEnv {
  if (!envStatus.ok) {
    throw new Error(`Invalid environment configuration:\n${envStatus.problems.join('\n')}`);
  }
  return envStatus.env;
}
