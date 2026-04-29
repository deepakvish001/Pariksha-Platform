import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IncomingMsg { role: "user" | "assistant"; content: string }

interface PlanContext {
  goal?: string | null;
  level?: string | null;
  target_date?: string | null;
  weekday_minutes?: number | null;
  weekend_minutes?: number | null;
  streak_days?: number | null;
  totals?: { total: number; done: number; skipped: number; pending: number };
  today?: { date: string; total: number; done: number };
  upcoming_days?: Array<{ date: string; tasks: Array<{ id?: string; title: string; topic: string; difficulty: string; status: string; est_minutes: number }> }>;
  weak_topics?: Array<{ topic: string; total: number; done: number; pct: number }>;
  recent_completions?: Array<{ date: string; title: string; topic: string }>;
  overdue?: Array<{ id: string; title: string; topic: string; day_date: string; est_minutes: number }>;
}

const buildSystemPrompt = (ctx: PlanContext) => `You are "Coach", an embedded AI advisor inside Byteskill's My Plan dashboard.
You can SEE the user's actual study plan, today's tasks, completion stats, streak, weak topics, and overdue items.

You MUST always call the "coach_reply" tool with:
- summary_md: a SHORT markdown reply (under 120 words) that:
    1) Acknowledges streak in one short line if streak_days > 0.
    2) Names 1-2 top weak/strong topics with concrete numbers.
    3) Answers the user's question directly.
- actions: an array of 2-3 concrete next-action suggestions the user can do RIGHT NOW.
  Each action MUST reference a real task from upcoming_days or overdue (use its id and title verbatim).
  Pick "kind":
    • "start_today" — task is on today's date and pending/in_progress.
    • "reschedule_today" — task is overdue (day_date < today.date), move to today.
    • "reschedule_tomorrow" — task is in upcoming days but you recommend pulling it earlier or pushing to tomorrow.
    • "mark_done" — user clearly indicated they finished it.
  Provide a 1-line "reason" for each action grounded in the data (e.g. "Weakest topic: Arrays at 20%").

Hard rules:
- Never invent task ids or titles. Only use ids/titles present in the context.
- If there are no actionable tasks, return actions: [].
- Keep summary_md tight, scannable, no emojis except a single optional 🔥 for streak.

USER PLAN CONTEXT (JSON):
${JSON.stringify(ctx, null, 2)}
`;

const tool = {
  type: "function",
  function: {
    name: "coach_reply",
    description: "Return a short markdown reply plus 2-3 concrete next-action suggestions the user can one-click execute.",
    parameters: {
      type: "object",
      properties: {
        summary_md: { type: "string", description: "Short markdown reply, under 120 words." },
        actions: {
          type: "array",
          minItems: 0,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              task_id: { type: "string", description: "Real task id from context." },
              task_title: { type: "string", description: "Verbatim title from context." },
              kind: {
                type: "string",
                enum: ["start_today", "reschedule_today", "reschedule_tomorrow", "mark_done"],
              },
              reason: { type: "string", description: "One short sentence grounded in the data." },
            },
            required: ["task_id", "task_title", "kind", "reason"],
            additionalProperties: false,
          },
        },
      },
      required: ["summary_md", "actions"],
      additionalProperties: false,
    },
  },
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const messages: IncomingMsg[] = Array.isArray(body?.messages) ? body.messages : [];
    const context: PlanContext = body?.context && typeof body.context === "object" ? body.context : {};

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const m of messages) {
      if ((m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
        return new Response(JSON.stringify({ error: "Invalid message shape" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (m.content.length > 4000) {
        return new Response(JSON.stringify({ error: "Message too long (max 4000 chars)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const trimmed = messages.slice(-20);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: false,
        messages: [
          { role: "system", content: buildSystemPrompt(context) },
          ...trimmed,
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "coach_reply" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await resp.text();
      console.error("plan-coach gateway error", resp.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let summary_md = "";
    let actions: unknown[] = [];
    if (call?.function?.arguments) {
      try {
        const parsed = JSON.parse(call.function.arguments);
        summary_md = typeof parsed.summary_md === "string" ? parsed.summary_md : "";
        actions = Array.isArray(parsed.actions) ? parsed.actions : [];
      } catch (e) {
        console.error("plan-coach: failed to parse tool args", e);
      }
    }
    // Fallback to text content if model didn't call the tool.
    if (!summary_md) {
      summary_md = data?.choices?.[0]?.message?.content ?? "_(No response — please try again.)_";
    }

    // Validate actions against the known task ids in context to prevent hallucinated ids.
    const knownIds = new Set<string>();
    for (const d of context.upcoming_days ?? []) {
      for (const t of d.tasks) if (t.id) knownIds.add(t.id);
    }
    for (const t of context.overdue ?? []) knownIds.add(t.id);

    const cleanActions = (actions as Array<Record<string, unknown>>)
      .filter((a) => typeof a?.task_id === "string" && knownIds.has(a.task_id as string))
      .slice(0, 3);

    return new Response(JSON.stringify({ summary_md, actions: cleanActions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("plan-coach error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
