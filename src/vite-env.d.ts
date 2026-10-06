/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_MAX_RECORDING_SECONDS?: string;
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  webkitAudioContext?: typeof AudioContext;
}
