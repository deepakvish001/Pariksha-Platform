import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const MODEL = 'google/gemini-2.5-flash';

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY missing');

    const body = await req.json();
    const { mode, role, company, difficulty, transcript } = body as {
      mode: 'turn' | 'score';
      role: string;
      company?: string;
      difficulty: 'easy' | 'medium' | 'hard';
      transcript: { speaker: 'interviewer' | 'candidate'; text: string }[];
    };

    if (!role || !mode) {
      return new Response(JSON.stringify({ error: 'role and mode are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemTurn = `You are an expert technical interviewer running a LIVE VOICE mock interview.
Role: ${role}${company ? ` at ${company}` : ''}. Difficulty: ${difficulty}.

Rules:
- Speak naturally and conversationally — this is read aloud by a TTS engine. Keep replies under 60 words.
- Ask ONE question or follow-up at a time. No bullet lists, no markdown, no code blocks.
- Mix behavioral and technical (DSA, system design, role-specific) appropriate to the role.
- Acknowledge the candidate's answer briefly, then probe deeper or move on.
- After about 6–8 exchanges total, wrap up with one final question.
- When you're truly done, end your reply with the exact token [END_INTERVIEW] on its own.`;

    const systemScore = `You are an interview coach. Given the full transcript of a mock interview for "${role}"${company ? ` at ${company}` : ''} (${difficulty} difficulty), produce a strict, fair scorecard.

Respond with ONLY valid JSON, no prose, matching:
{
  "overall": 0-100,
  "verdict": "strong_hire" | "hire" | "lean_hire" | "lean_no_hire" | "no_hire",
  "summary": "2-3 sentence overall impression",
  "rubric": [
    { "criterion": "Communication", "score": 0-10, "feedback": "..." },
    { "criterion": "Technical depth", "score": 0-10, "feedback": "..." },
    { "criterion": "Problem solving", "score": 0-10, "feedback": "..." },
    { "criterion": "Role fit", "score": 0-10, "feedback": "..." }
  ],
  "strengths": ["..."],
  "improvements": ["..."],
  "next_steps": ["..."]
}`;

    const messages: Msg[] = mode === 'score'
      ? [
          { role: 'system', content: systemScore },
          { role: 'user', content: 'Transcript:\n' + transcript.map(t => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n') },
        ]
      : [
          { role: 'system', content: systemTurn },
          ...transcript.map<Msg>(t => ({
            role: t.speaker === 'interviewer' ? 'assistant' : 'user',
            content: t.text,
          })),
        ];

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages,
        ...(mode === 'score' ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limited. Try again in a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted. Top up in Settings → Usage.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Gateway ${resp.status}: ${t}`);
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    if (mode === 'score') {
      let scorecard: unknown;
      try { scorecard = JSON.parse(raw); } catch { scorecard = { error: 'Could not parse scorecard', raw }; }
      return new Response(JSON.stringify({ scorecard }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isFinal = raw.includes('[END_INTERVIEW]');
    const reply = raw.replace('[END_INTERVIEW]', '').trim();
    return new Response(JSON.stringify({ reply, isFinal }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
