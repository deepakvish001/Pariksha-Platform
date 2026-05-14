import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SCHEMA: Record<string, string> = {
  mcq: `Each item must be:
{ "type": "mcq", "title": "<short title>", "body_md": "<markdown question>", "points": <int 2-10>,
  "options": [ { "body": "<option text>", "is_correct": <bool> }, ... 4 items, exactly one correct ] }`,
  coding: `Each item must be:
{ "type": "coding", "title": "<short title>", "body_md": "<markdown problem statement with input/output format>",
  "points": <int 10-30>, "language": "<javascript|python|java|cpp>",
  "test_cases": [ { "input": "<stdin>", "expected_output": "<stdout>", "is_hidden": <bool> }, ... 3-5 items ] }`,
  sql: `Each item must be:
{ "type": "sql", "title": "<short title>", "body_md": "<markdown problem with schema and example data>",
  "points": <int 10-25>, "language": "postgres",
  "test_cases": [ { "input": "<seed sql>", "expected_output": "<expected result rows>", "is_hidden": <bool> }, ... 2-4 items ] }`,
  subjective: `Each item must be:
{ "type": "subjective", "title": "<short title>", "body_md": "<open-ended question prompt in markdown>", "points": <int 5-20> }`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authentication to prevent AI credit drain by anonymous callers
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.4");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topic, type = "mcq", count = 5, difficulty = "medium" } = await req.json();
    if (!topic || typeof topic !== "string") {
      return new Response(JSON.stringify({ error: "topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const safeCount = Math.max(1, Math.min(10, Number(count) || 5));
    const schema = SCHEMA[type as string];
    if (!schema) {
      return new Response(JSON.stringify({ error: "invalid type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const system = `You generate technical assessment questions for a hiring/exam platform.
Return ONLY a JSON array (no prose, no markdown fences) of exactly ${safeCount} ${type} questions.
Difficulty: ${difficulty}.
${schema}
Strict rules:
- Output a single JSON array. No surrounding object. No commentary.
- Each title is concise (under 80 chars).
- body_md uses GitHub-flavored markdown.
- For coding/sql: expected_output must match what stdout would print exactly.`;

    const user = `Generate ${safeCount} ${difficulty} ${type} questions about: ${topic}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.7,
      }),
    });

    if (!r.ok) {
      if (r.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (r.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const err = await r.text();
      console.error("AI gateway error:", r.status, err);
      throw new Error("AI generation failed");
    }

    const data = await r.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";

    let parsed: any;
    try {
      const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const raw = fence ? fence[1].trim() : text.trim();
      parsed = JSON.parse(raw);
    } catch {
      const s = text.indexOf("[");
      const e = text.lastIndexOf("]");
      if (s !== -1 && e !== -1) parsed = JSON.parse(text.substring(s, e + 1));
      else throw new Error("Could not parse AI response as JSON");
    }
    if (!Array.isArray(parsed)) throw new Error("AI response is not an array");

    return new Response(JSON.stringify({ questions: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("parikshaa-generate-questions error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
