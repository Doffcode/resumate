import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization Bearer token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { resume_id, job_description_text, mode, missing_requirement } = body;

    if (!resume_id) {
      return new Response(
        JSON.stringify({ error: 'Bad Request: Missing resume_id.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server Error: Supabase service environment variables missing.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Authenticate User
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired authentication token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch Resume & Verify Ownership (403 Forbidden)
    const { data: resume, error: resumeError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', resume_id)
      .single();

    if (resumeError || !resume) {
      return new Response(
        JSON.stringify({ error: 'Not Found: Resume record does not exist.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (resume.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not own this resume.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit — both modes below call the Gemini API, whose free tier has
    // its own request caps, and until now neither had any cap of its own
    // (unlike api/parse-resume.js's identical 10/hour check, which exists for
    // exactly this reason). Counts the same 'ai_call' rows this function
    // already logs on success, so no new table.
    // Fails CLOSED: a counting error blocks the call rather than allowing it.
    const AI_RATE_LIMIT = 10;
    const AI_RATE_WINDOW_MS = 60 * 60 * 1000;
    const since = new Date(Date.now() - AI_RATE_WINDOW_MS).toISOString();
    const { count: recentAiCalls, error: rateError } = await supabaseAdmin
      .from('admin_stats')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_type', 'ai_call')
      .gte('created_at', since);
    if (rateError || (recentAiCalls ?? 0) >= AI_RATE_LIMIT) {
      return new Response(
        JSON.stringify({
          error: rateError
            ? 'Rate limit check failed. Please try again shortly.'
            : `Rate limit reached: ${AI_RATE_LIMIT} AI requests per hour. Try again later.`,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ------------------------------------------------------------------------
    // MODE A: DRAFT ONE NEW PROJECT FOR A MISSING REQUIREMENT
    // ------------------------------------------------------------------------
    if (mode === 'draft_project' && missing_requirement) {
      const draftSystemPrompt = `You are an expert ATS resume writer. 
Write ONE single project entry that demonstrates experience for the given missing requirement. 
Output ONLY valid JSON matching this exact structure:
{
  "drafted_project": {
    "title": "Clear Project Title",
    "date": "Recent / Ongoing",
    "description": "2-3 bullet points demonstrating technical mastery of this requirement with strong action verbs."
  }
}`;

      const draftUserPrompt = `MISSING REQUIREMENT TO ADDRESS:
${missing_requirement}

CANDIDATE EXISTING RESUME CONTEXT:
${JSON.stringify({ skills: resume.skills, projects: resume.projects }, null, 2)}`;

      let draftedProject = null;

      if (geminiApiKey) {
        try {
          const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: draftSystemPrompt }] },
                contents: [{ parts: [{ text: draftUserPrompt }] }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 800, responseMimeType: 'application/json' }
              })
            }
          );

          if (!aiRes.ok) {
            const errText = await aiRes.text();
            console.error('Gemini API Error:', errText);
            throw new Error(`Gemini API error: ${errText}`);
          }

          const aiData = await aiRes.json();
          const rawContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();

          let parsed = null;
          try {
            parsed = JSON.parse(cleaned);
          } catch(e) {
            parsed = null;
          }

          if (parsed) {
            draftedProject = parsed.drafted_project || parsed.project || (parsed.title ? parsed : null);
          }

          if (!draftedProject || !draftedProject.title) {
            draftedProject = {
              title: `Project: ${missing_requirement.replace(/\(.*?\)/g, '').trim()}`,
              date: 'Jan 2026 - Present',
              description: rawContent || `Designed and implemented solution addressing ${missing_requirement.replace(/\(.*?\)/g, '').trim()}.`
            };
          }
        } catch (err) {
          console.error('Draft project execution error:', err);
          draftedProject = {
            title: `Project: ${missing_requirement.replace(/\(.*?\)/g, '').trim()}`,
            date: 'Jan 2026 - Present',
            description: `Designed and implemented production solution addressing ${missing_requirement.replace(/\(.*?\)/g, '').trim()} using industry best practices.`
          };
        }
      } else {
        draftedProject = {
          title: `Project: ${missing_requirement.replace(/\(.*?\)/g, '').trim()}`,
          date: 'Jan 2026 - Present',
          description: `Designed and implemented production solution for ${missing_requirement.replace(/\(.*?\)/g, '').trim()} using industry best practices and automated CI/CD.`
        };
      }

      await supabaseAdmin.from('admin_stats').insert([{ event_type: 'ai_call', user_id: user.id }]);

      return new Response(
        JSON.stringify({ success: true, drafted_project: draftedProject }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ------------------------------------------------------------------------
    // MODE B: FULL RESUME JD MATCHING & CATEGORIZED CLASSIFICATION
    // ------------------------------------------------------------------------
    if (!job_description_text) {
      return new Response(
        JSON.stringify({ error: 'Bad Request: Missing job_description_text.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert ATS resume writer and technical recruiter. 
You will receive a candidate's resume JSON and a target Job Description (JD).
Perform three tasks:
1. For each existing project in the resume, write an enhanced, keyword-tailored version matching the JD's tech stack.
2. Identify missing JD requirements and classify them into two categories:
   a. "missing_skills": Tools, languages, frameworks, libraries, or platforms. Each item MUST be an object with "category" (e.g. "Programming Languages", "Developer Tools & Cloud", "Frameworks & Libraries", "Databases & Storage") and "name" (e.g. "Docker", "Python", "PyTorch", "PostgreSQL").
   b. "missing_experiences": Workflows, domain knowledge, or responsibilities (e.g., "building data pipelines", "multi-region cloud deployment", "A/B testing infrastructure").
3. Generate ONE single combined project suggestion covering several of the missing experience gaps at once, written in a completed-work tone ("Designed and implemented...").

Output ONLY valid JSON matching this exact structure:
{
  "rewritten_projects": [
    {
      "original_index": 0,
      "title": "Project Title",
      "date": "Project Date",
      "description": "Tailored project bullet points with JD keywords."
    }
  ],
  "missing_skills": [
    { "category": "Developer Tools & Cloud", "name": "Docker" },
    { "category": "Programming Languages", "name": "Python" }
  ],
  "missing_experiences": ["Workflow 1", "Workflow 2"],
  "combined_project_suggestion": {
    "title": "Single Combined Project Title Covering Gaps",
    "date": "Jan 2026 - Present",
    "description": "2-3 bullet points demonstrating technical completion covering the missing experience workflows."
  }
}`;

    const userPrompt = `RESUME CONTENT:
${JSON.stringify({
  personal_info: resume.personal_info,
  education: resume.education,
  internships: resume.internships,
  projects: resume.projects,
  skills: resume.skills,
  positions: resume.positions
}, null, 2)}

TARGET JOB DESCRIPTION:
${job_description_text}`;

    let parsedSuggestions = null;

    if (geminiApiKey) {
      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1500, responseMimeType: 'application/json' }
          })
        }
      );

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error('Gemini API Error:', errText);
        throw new Error(`Gemini API returned status ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const rawContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

      try {
        const cleaned = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedSuggestions = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('Failed to parse Gemini JSON response. Raw text:', rawContent);
        return new Response(
          JSON.stringify({ error: "AI response couldn't be processed, please try again." }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      parsedSuggestions = generateLocalAiSuggestions(resume, job_description_text);
    }

    const { data: suggestionRow, error: insertErr } = await supabaseAdmin
      .from('ai_suggestions')
      .insert([{
        resume_id: resume.id,
        job_description_text,
        suggestion_json: parsedSuggestions,
        status: 'pending'
      }])
      .select()
      .single();

    if (insertErr) {
      console.error('Failed to insert into ai_suggestions:', insertErr);
    }

    await supabaseAdmin
      .from('admin_stats')
      .insert([{
        event_type: 'ai_call',
        user_id: user.id
      }]);

    return new Response(
      JSON.stringify({
        success: true,
        suggestion_id: suggestionRow?.id || 'simulated-id',
        suggestions: parsedSuggestions
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Edge Function match-jd Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error: ' + err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateLocalAiSuggestions(resume, jdText) {
  const projects = resume.projects || [];
  const rewritten = projects.map((p, idx) => ({
    original_index: idx,
    title: p.title || `Project #${idx + 1}`,
    date: p.date || '2024',
    description: `${p.description || ''} Enhanced with high-scale architecture and optimized data pipelines relevant to JD.`
  }));

  return {
    rewritten_projects: rewritten,
    missing_skills: [
      { category: "Developer Tools & Cloud", name: "Docker" },
      { category: "Developer Tools & Cloud", name: "Kubernetes" },
      { category: "Developer Tools & Cloud", name: "Terraform" },
      { category: "Databases & Storage", name: "PostgreSQL" }
    ],
    missing_experiences: [
      "Building real-time distributed data pipelines",
      "Automated multi-cloud infrastructure deployment with failover"
    ],
    combined_project_suggestion: {
      title: "Real-Time Distributed Data Streaming & Multi-Cloud Engine",
      date: "Jan 2026 - Present",
      description: "Architected high-throughput distributed data streaming pipeline using Docker and Kubernetes. Provisioned multi-region cloud infrastructure via Terraform with automated failover monitoring."
    }
  };
}
