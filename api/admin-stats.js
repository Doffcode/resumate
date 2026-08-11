// Admin-only counters and a paginated user list. Same anon+bearer identity
// check as export-pdf.js/delete-account.js, then a narrow admin gate:
// caller's email must match ADMIN_EMAIL (not a secret, just config — set
// alongside SUPABASE_SERVICE_ROLE_KEY). Only after that gate passes does the
// service-role client get used, and only for reads.
import { createClient } from '@supabase/supabase-js';

const DAYS = 30;

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

  if (user.email !== adminEmail) {
    return res.status(403).json({ error: 'Forbidden: admin access only.' });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [{ data: users, error: usersError }, { data: events, error: eventsError }, { data: userList, error: listError }] =
      await Promise.all([
        admin.auth.admin.listUsers({ perPage: 1000 }),
        admin.from('admin_stats').select('event_type, created_at').gte('created_at', since),
        admin.from('resumes').select('user_id, title, updated_at').order('updated_at', { ascending: false }),
      ]);
    if (usersError) throw usersError;
    if (eventsError) throw eventsError;
    if (listError) throw listError;

    const byDay = {};
    const bucket = (iso) => iso.slice(0, 10);
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(Date.now() - i * 86400000);
      byDay[bucket(d.toISOString())] = { pdf_export: 0, ai_call: 0, resume_import: 0 };
    }
    for (const e of events || []) {
      const day = bucket(e.created_at);
      if (byDay[day] && byDay[day][e.event_type] !== undefined) byDay[day][e.event_type]++;
    }

    const resumesByUser = {};
    for (const r of userList || []) (resumesByUser[r.user_id] ||= []).push({ title: r.title, updated_at: r.updated_at });

    const usersOut = (users?.users || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        resumeCount: (resumesByUser[u.id] || []).length,
      }));

    res.status(200).json({
      totals: {
        signups: users?.users?.length || 0,
        pdf_exports_30d: (events || []).filter((e) => e.event_type === 'pdf_export').length,
        ai_calls_30d: (events || []).filter((e) => e.event_type === 'ai_call').length,
        resume_imports_30d: (events || []).filter((e) => e.event_type === 'resume_import').length,
      },
      daily: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, counts]) => ({ day, ...counts })),
      users: usersOut,
    });
  } catch (e) {
    console.error('admin-stats failed:', e.message);
    return res.status(500).json({ error: 'Failed to load admin stats.' });
  }
}
