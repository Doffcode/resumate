import { useTheme } from '../lib/useTheme.js';
import './theme-toggle.css';

const SunIcon = (p) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
  </svg>
);
const MoonIcon = (p) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
  </svg>
);

// A single global toggle, mounted once outside <App> (see main.jsx) rather
// than wired into every page's own topbar/nav — the app has too many of
// those (Dashboard, EditorPage, Settings, Admin, Privacy, Terms, Landing)
// to duplicate it into each. Never mounted on the print/golden routes
// (main.jsx gates that): a floating button has no business appearing in an
// exported PDF or the golden-reference screenshot.
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      className="rm-theme-toggle"
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
