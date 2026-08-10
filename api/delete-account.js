// Full account deletion: removes the actual login, not just the data.
// Verifies the caller with the same anon+bearer pattern as export-pdf.js,
// then uses the service-role client (only place in this codebase that needs
// it for this endpoint) to call auth.admin.deleteUser — the only way to
// remove a Supabase Auth user. resumes.user_id has `on delete cascade` in
// schema.sql, so every resume the user owns is removed automatically; no
// separate delete step needed.
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Unauthorized: missing Authorization Bearer token.' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'Server misconfigured: Supabase env vars missing.' });
  }

  // Identify the caller as themselves first — never trust a user id passed
  // in the request body, only the one the token itself resolves to.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized: invalid or expired token.' });

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('delete-account failed:', deleteError.message);
    return res.status(500).json({ error: 'Account deletion failed. Please try again.' });
  }

  return res.status(200).json({ ok: true });
}
