// Turns the plain text of an uploaded resume into Resumate's data shape.
//
// Identity check mirrors api/export-pdf.js exactly: anon key + the caller's
// own bearer token, then getUser(). The service-role client is used only for
// admin_stats (logging + rate limiting) — never to read or write user data.
//
// Rate limiting reuses the admin_stats table that match-jd already writes
// 'ai_call' rows to, counting 'resume_import' events in the last hour. No new
// table and no migration needed.
import { createClient } from '@supabase/supabase-js';

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_CHARS = 20000; // generous for a resume; caps token spend on junk input

const err = (res, status, message) => res.status(status).json({ error: message });

// Only content fields. footer / pageBreaks / sectionVisibility /
// layoutSettings are app config and must come from defaultResume via
// migrate() on the client — never from model output.
const SYSTEM_PROMPT = `You extract structured data from resume text.

Return ONLY valid JSON matching this exact structure. Use empty arrays/strings
for anything genuinely absent — never invent content that is not in the text.

{
  "personalInfo": { "name": "", "degree": "", "gender": "", "dob": "", "email": "", "contact": "" },
  "education": [ { "year": "", "degree": "", "institution": "", "grade": "" } ],
  "educationNote": "",
  "internships": [ { "title": "", "date": "", "description": "" } ],
  "projects": [ { "title": "", "date": "", "description": "" } ],
  "skills": [ { "label": "", "value": "" } ],
  "areas": [ { "text": "" } ],
  "positions": [ { "title": "", "date": "", "description": "" } ],
  "extracurriculars": { "sport": [ { "text": "" } ], "social": [ { "text": "" } ] }
}

Rules:
- "dob" as DD/MM/YYYY if determinable, else "".
- "grade" is CGPA or percentage exactly as written, but strip any leading zero
  (07.52 becomes 7.52).
- "date" for projects/internships/positions is a range like "Jan 2026 - Mar 2026".
- "skills" groups related items: label is the category ("Programming Languages"),
  value is a comma-separated list.
- Descriptions: keep the candidate's own wording, condensed to 2-3 lines.
  Start with a capital letter.
- Anything that does not fit these sections is dropped rather than forced in.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return err(res, 405, 'Method not allowed.');

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return err(res, 401, 'Unauthorized: missing Authorization Bearer token.');

  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || text.trim().length < 50) {
    return err(res, 400, 'Bad request: no usable resume text supplied.');
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!supabaseUrl || !anonKey) return err(res, 500, 'Server misconfigured: Supabase env vars missing.');
  if (!geminiApiKey) return err(res, 500, 'Server misconfigured: GEMINI_API_KEY missing.');

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return err(res, 401, 'Unauthorized: invalid or expired token.');

  const serviceClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

  // Fails CLOSED — this is the cost control for a paid API.
  if (serviceClient) {
    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const { count, error: countError } = await serviceClient
      .from('admin_stats')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_type', 'resume_import')
      .gte('created_at', since);
    if (!countError && count >= RATE_LIMIT) {
      return err(res, 429, `Rate limit reached: ${RATE_LIMIT} imports per hour. Try again later.`);
    }
  }

  try {
    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: text.slice(0, MAX_CHARS) }] }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
      }
    );

    if (!aiRes.ok) {
      console.error('parse-resume: Gemini returned', aiRes.status);
      return err(res, 502, 'The parsing service is unavailable right now. Please try again.');
    }

    const body = await aiRes.json();
    const raw = body?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim());
    } catch {
      console.error('parse-resume: unparseable model output:', raw.slice(0, 400));
      return err(res, 422, "Couldn't understand that resume's layout. You can still start from a blank resume.");
    }

    if (serviceClient) {
      const { error: logError } = await serviceClient
        .from('admin_stats')
        .insert({ event_type: 'resume_import', user_id: user.id });
      if (logError) console.error('admin_stats insert failed:', logError.message);
    }

    return res.status(200).json({ parsed });
  } catch (e) {
    console.error('parse-resume failed:', e.message);
    return err(res, 500, 'Parsing failed. Please try again.');
  }
}
