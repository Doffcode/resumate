import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Null until .env.local carries both values. Every caller must handle null so
// the app degrades to a clear "not connected" state instead of a broken button.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const isConnected = () => Boolean(supabase);

// Row <-> app-shape mapping lives in src/shared/rowMapping.js so it can be
// imported by both this Vite client and the plain-Node Vercel functions in
// api/, which don't share an env-var mechanism with Vite.
export { toRow, fromRow } from '../shared/rowMapping.js';
