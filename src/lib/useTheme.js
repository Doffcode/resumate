import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'resumate.theme';

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const initialTheme = () => {
  const stored = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return systemPrefersDark() ? 'dark' : 'light';
};

// App-wide light/dark toggle. index.html has a tiny inline script that sets
// documentElement.dataset.theme synchronously before first paint (reading
// the same localStorage key), so there is no flash of the wrong theme while
// this hook's own effect catches up on mount.
export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Someone who has never chosen explicitly should keep following their OS
  // setting live, not get stuck on whatever it happened to be on first load.
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
