// Generates a personalized study plan via Lovable AI using tool-calling for structured output.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProfileInput {
  goal: string;
  target_date: string | null;
  weekday_minutes: number;
  weekend_minutes: number;
  level: string;
  topics_known: string[];
}

interface PlatformStat {
  platform: string;
  rating: number | null;
  solved: { easy: number; medium: number; hard: number; total: number };
}

const PLAN_TOOL = {
  type: "function",
  function: {
    name: "emit_study_plan",
    description: "Emit a personalized study plan as a list of daily tasks",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "1-2 sentence plan summary for the user" },
        weak_areas: { type: "array", items: { type: "string" }, description: "Topics the user should focus on" },
        days: {
          type: "array",
          description: "Ordered list of study days. day_offset is relative to the requested START day.",
          items: {
            type: "object",
            properties: {
              day_offset: { type: "integer", description: "0 = start day, 1 = next day, ..." },
              tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    topic: { type: "string", description: "e.g. Arrays, Graphs, SQL Joins" },
                    title: { type: "string", description: "Short specific task title" },
                    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                    est_minutes: { type: "integer", minimum: 5, maximum: 240 },
                    source_type: { type: "string", enum: ["dsa", "sql", "coding", "concept", "quiz"] },
                    source_id: { type: "string", description: "Optional: a slug/topic that the app can deep-link to (e.g. 'two-sum', 'graphs', 'window-functions'). Use lowercase kebab-case when possible." },
                  },
                  required: ["topic", "title", "difficulty", "est_minutes", "source_type"],
                  additionalProperties: false,
                },
              },
            },
            required: ["day_offset", "tasks"],
            additionalProperties: false,
          },
        },
      },
      required: ["summary", "weak_areas", "days"],
      additionalProperties: false,
    },
  },
};

const SOURCE_CATALOG = `
Available source types and example source_id values the app can deep-link:

- coding (LeetCode-style problems): "two-sum", "valid-parentheses", "merge-intervals", "lru-cache", "word-ladder", "course-schedule", "longest-substring-without-repeating-characters"
- dsa (DSA topic study): "arrays", "linked-list", "stack-queue", "trees", "binary-search-trees", "graphs", "dynamic-programming", "greedy", "backtracking", "tries", "heap", "sliding-window", "two-pointers", "bit-manipulation"
- sql (SQL practice): "joins", "window-functions", "aggregations", "subqueries", "indexes", "transactions"
- quiz (rapid-fire multiple choice): "operating-systems", "dbms", "computer-networks", "oops", "system-design"
- concept (theory & roadmap reading): use a topic name as source_id (e.g. "react-hooks", "kubernetes", "postgres-indexing")

Prefer real topic slugs from this list when relevant — they will deep-link to existing app pages.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    // Require authentication to prevent AI credit drain by anonymous callers
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.4");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const profile = body.profile as ProfileInput;
    const stats = (body.platform_stats ?? []) as PlatformStat[];
    const completedTopics = (body.completed_topics ?? []) as string[];
    const partial = body.partial as { from_day_offset?: number } | undefined;
    const fromOffset = Math.max(0, partial?.from_day_offset ?? 0);

    if (!profile?.goal || !profile?.weekday_minutes || !profile?.weekend_minutes) {
      return json({ error: "Missing profile fields" }, 400);
    }

    // Input validation: cap user-controlled prompt fields to prevent AI credit abuse
    if (typeof profile.goal !== "string" || profile.goal.length > 1000) {
      return json({ error: "goal must be a string ≤1000 chars" }, 400);
    }
    if (!Array.isArray(profile.topics_known) || profile.topics_known.length > 100) {
      return json({ error: "topics_known must be an array of ≤100 items" }, 400);
    }
    for (const t of profile.topics_known) {
      if (typeof t !== "string" || t.length > 200) {
        return json({ error: "Each topics_known item must be a string ≤200 chars" }, 400);
      }
    }

    const daysToTarget = profile.target_date
      ? Math.max(1, Math.ceil((new Date(profile.target_date).getTime() - Date.now()) / 86400000))
      : 28;
    const planDays = Math.min(28 - fromOffset, daysToTarget - fromOffset);
    const effectiveDays = Math.max(1, planDays);

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() + fromOffset);

    const systemPrompt = `You are an expert DSA & placement-prep coach. Build a realistic, day-by-day study plan that adapts to the user's goal, current level, and time budget. Mix theory + practice. Front-load the user's WEAK areas (low solved counts on platforms or unfamiliar topics). Skip topics already in their "topics_known" list unless reinforcement is needed. Each day should respect the time budget (weekdays vs weekends). Use diverse source_types — don't make everything "coding". Keep task titles short and concrete. Whenever possible, fill source_id with a slug from the provided catalog so the app can deep-link the task.`;

    const userPrompt = `${partial ? `Generate the NEXT ${effectiveDays} days of the plan starting at day_offset 0 (which corresponds to the user's day ${fromOffset} from today).` : `Generate a ${effectiveDays}-day study plan starting today.`}

Goal: ${profile.goal}
Target date: ${profile.target_date ?? "no fixed date"}
Self-rated level: ${profile.level}
Weekday budget: ${profile.weekday_minutes} min/day
Weekend budget: ${profile.weekend_minutes} min/day
Topics user already knows: ${profile.topics_known.join(", ") || "none"}
Topics already completed in app: ${completedTopics.slice(0, 30).join(", ") || "none"}

Coding platform stats:
${stats.length === 0 ? "No platforms connected." : stats.map(s =>
  `- ${s.platform}: rating ${s.rating ?? "N/A"}, solved E:${s.solved.easy} M:${s.solved.medium} H:${s.solved.hard} (total ${s.solved.total})`
).join("\n")}

${SOURCE_CATALOG}

Use day_offset 0 for the start day. The start day is a ${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][startDate.getDay()]}. Match each day's total est_minutes to the appropriate budget (weekday vs weekend).`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [PLAN_TOOL],
        tool_choice: { type: "function", function: { name: "emit_study_plan" } },
      }),
    });

    if (r.status === 429) return json({ error: "Rate limit reached. Try again in a minute." }, 429);
    if (r.status === 402) return json({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }, 402);
    if (!r.ok) {
      const t = await r.text();
      console.error("AI error", r.status, t);
      return json({ error: "AI generation failed" }, 500);
    }

    const j = await r.json();
    const toolCall = j?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return json({ error: "AI returned no plan" }, 500);
    }
    const aiPlan = JSON.parse(toolCall.function.arguments);

    // Shift day_offset back to be relative to TODAY (so client can keep the existing math)
    if (fromOffset > 0 && Array.isArray(aiPlan.days)) {
      aiPlan.days = aiPlan.days.map((d: { day_offset: number }) => ({
        ...d,
        day_offset: d.day_offset + fromOffset,
      }));
    }

    return json({ plan: aiPlan }, 200);
  } catch (e) {
    console.error("generate-study-plan error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
