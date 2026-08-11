import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App, { isPrintRoute } from './App.jsx';
import ThemeToggle from './editor/ThemeToggle.jsx';

// Mounted as a sibling of <App/>, not inside it, so it's one component
// covering every page (Dashboard, Editor, Landing, Settings, Admin...)
// instead of being wired into each page's own topbar/nav individually.
// Never rendered on the print/golden routes: it must not appear in an
// exported PDF or shift a single pixel of the golden-reference screenshot.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {!isPrintRoute() && <ThemeToggle />}
  </StrictMode>
);
