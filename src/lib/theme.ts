import { useSyncExternalStore } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export function getThemePreference(): ThemePreference {
  return 'dark';
}

export function applyTheme(_pref?: ThemePreference): void {
  document.documentElement.setAttribute('data-theme', 'dark');
}

export function setThemePreference(_pref?: ThemePreference): void {
  applyTheme('dark');
}

let initialised = false;
export function initTheme(): void {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;
  applyTheme('dark');
}

function subscribe(_cb: () => void): () => void {
  return () => {};
}

function snapshot(): ResolvedTheme {
  return 'dark';
}

/** The theme currently applied to <html>, locked to dark. */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, snapshot, () => 'dark');
}
