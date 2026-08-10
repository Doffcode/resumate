// Read-only view of one user's resumes for the admin drill-down. Same
// admin gate as admin-stats.js — duplicated rather than shared, since it's
// four lines and pulling it into a shared module for two call sites isn't
// worth the indirection.
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Unauthorized: missing Authorization Bearer token.' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !adminEmail) {
    return res.status(500).json({ error: 'Server misconfigured: admin env vars missing.' });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized: invalid or expired token.' });
  if (user.email !== adminEmail) return res.status(403).json({ error: 'Forbidden: admin access only.' });

  const { id } = req.query;
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: resumes, error } = await admin
    .from('resumes')
    .select('id, title, personal_info, education, projects, updated_at')
    .eq('user_id', id);
  if (error) return res.status(500).json({ error: 'Failed to load user resumes.' });

  res.status(200).json({ resumes: resumes || [] });
}
