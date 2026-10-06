import { useSyncExternalStore } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'vf-theme';

export function getThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(pref: ThemePreference): void {
  const resolved = pref === 'system' ? systemTheme() : pref;
  document.documentElement.setAttribute('data-theme', resolved);
}

export function setThemePreference(pref: ThemePreference): void {
  try {
    if (pref === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* storage unavailable (private mode); theme still applies for this session */
  }
  applyTheme(pref);
}

let initialised = false;
export function initTheme(): void {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;
  applyTheme(getThemePreference());
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (getThemePreference() === 'system') applyTheme('system');
  });
}

function subscribe(cb: () => void): () => void {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

function snapshot(): ResolvedTheme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/** The theme currently applied to <html>, kept in sync with any toggle. */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, snapshot, () => 'dark');
}
