import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'proxima-theme';
const CHANGE_EVENT = 'proxima:theme-change';
export const SHOW_THEME_SHORTCUT = 'proxima:show-theme-shortcut';
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

function savedTheme() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function applyTheme() {
  const saved = savedTheme();
  document.documentElement.classList.toggle('dark', saved ? saved === 'dark' : systemTheme.matches);
}
applyTheme();
systemTheme.addEventListener('change', () => {
  if (!savedTheme()) { applyTheme(); window.dispatchEvent(new Event(CHANGE_EVENT)); }
});
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY || event.key === null) { applyTheme(); window.dispatchEvent(new Event(CHANGE_EVENT)); }
});

function subscribe(listener) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}
const snapshot = () => document.documentElement.classList.contains('dark');

export default function useTheme() {
  const isDark = useSyncExternalStore(subscribe, snapshot);
  const toggleTheme = () => {
    const next = !snapshot();
    try { localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light'); } catch { /* The session still supports theming when storage is unavailable. */ }
    document.documentElement.classList.toggle('dark', next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };
  return { isDark, toggleTheme };
}
