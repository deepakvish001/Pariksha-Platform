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
  upcoming_days?: Array<{ date: string; tasks: Array<{ title: string; topic: string; difficulty: string; status: string; est_minutes: number }> }>;
  weak_topics?: Array<{ topic: string; total: number; done: number; pct: number }>;
  recent_completions?: Array<{ date: string; title: string; topic: string }>;
}

const buildSystemPrompt = (ctx: PlanContext) => `You are "Coach", an embedded AI advisor inside Byteskill's My Plan dashboard.
You can SEE the user's actual study plan, today's tasks, completion stats, streak, and weak topics.
Your job: answer questions about the plan and recommend the user's next concrete action.

Style:
- Reply in short, focused markdown. Use bullet points and bold sparingly.
- Reference SPECIFIC task titles and topics from the context when relevant.
- When suggesting a next action, name it explicitly (e.g. "Start 'Two Sum' next").
- If the user is on a streak, acknowledge it briefly and don't break momentum.
- Don't invent tasks or topics not present in the plan. If you need missing info, ask one short question.
- If completion is low and many tasks are overdue, suggest using "Catch up" or "Re-plan from tomorrow".
- Keep most replies under 120 words.

USER PLAN CONTEXT (JSON):
${JSON.stringify(ctx, null, 2)}
`;

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
        stream: true,
        messages: [
          { role: "system", content: buildSystemPrompt(context) },
          ...trimmed,
        ],
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

    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("plan-coach error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
