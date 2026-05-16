import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Insight = {
  title: string;
  body: string;
  severity: "info" | "positive" | "warning";
  action?: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claims?.claims?.sub) {
      return json({ error: "Invalid token" }, 401);
    }
    const userId = claims.claims.sub as string;

    const { org_id } = (await req.json().catch(() => ({}))) as {
      org_id?: string;
    };
    if (!org_id || typeof org_id !== "string") {
      return json({ error: "org_id required" }, 400);
    }

    // Verify membership (RLS would also block, but be explicit).
    const { data: membership } = await supabase
      .from("org_members")
      .select("id")
      .eq("org_id", org_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!membership) return json({ error: "Forbidden" }, 403);

    // Aggregate stats on the server.
    const now = new Date();
    const dStart = new Date(now);
    dStart.setDate(now.getDate() - 30);
    const pStart = new Date(now);
    pStart.setDate(now.getDate() - 60);
    const dStartIso = dStart.toISOString();
    const pStartIso = pStart.toISOString();

    const { data: assessments } = await supabase
      .from("assessments")
      .select("id, title, status, created_at")
      .eq("org_id", org_id);
    const assessmentIds = (assessments ?? []).map((a: any) => a.id);

    let attemptsCurr: any[] = [];
    let attemptsPrev: any[] = [];
    let invitesCurr = 0;
    let invitesPrev = 0;
    let sourceMix: Record<string, number> = {};
    let pendingInvites = 0;

    if (assessmentIds.length) {
      const [{ data: attempts }, { data: invites }] = await Promise.all([
        supabase
          .from("assessment_attempts")
          .select("status, integrity_score, submitted_at, started_at, assessment_id")
          .in("assessment_id", assessmentIds)
          .gte("started_at", pStartIso),
        supabase
          .from("assessment_invites")
          .select("status, source, created_at")
          .in("assessment_id", assessmentIds)
          .gte("created_at", pStartIso),
      ]);
      const submitted = (attempts ?? []).filter(
        (a: any) => a.status === "submitted" && a.submitted_at,
      );
      attemptsCurr = submitted.filter((a: any) => a.submitted_at >= dStartIso);
      attemptsPrev = submitted.filter(
        (a: any) => a.submitted_at >= pStartIso && a.submitted_at < dStartIso,
      );
      invitesCurr = (invites ?? []).filter(
        (i: any) => i.created_at >= dStartIso,
      ).length;
      invitesPrev = (invites ?? []).filter(
        (i: any) => i.created_at >= pStartIso && i.created_at < dStartIso,
      ).length;
      for (const inv of invites ?? []) {
        const s = inv.source ?? "manual";
        sourceMix[s] = (sourceMix[s] ?? 0) + 1;
      }
      pendingInvites = (invites ?? []).filter(
        (i: any) => i.status === "pending",
      ).length;
    }

    const avg = (rows: any[]) =>
      rows.length
        ? Math.round(
            (rows.reduce(
              (s: number, a: any) => s + (a.integrity_score ?? 0),
              0,
            ) /
              rows.length) *
              10,
          ) / 10
        : null;

    const integrityCurr = avg(attemptsCurr);
    const integrityPrev = avg(attemptsPrev);

    const lowIntegrity = attemptsCurr.filter(
      (a: any) => (a.integrity_score ?? 100) < 70,
    ).length;

    const stats = {
      window_days: 30,
      assessments_total: assessments?.length ?? 0,
      drafts: (assessments ?? []).filter((a: any) => a.status === "draft")
        .length,
      published: (assessments ?? []).filter(
        (a: any) => a.status === "published",
      ).length,
      submissions_curr: attemptsCurr.length,
      submissions_prev: attemptsPrev.length,
      invites_curr: invitesCurr,
      invites_prev: invitesPrev,
      pending_invites: pendingInvites,
      integrity_avg_curr: integrityCurr,
      integrity_avg_prev: integrityPrev,
      low_integrity_submissions: lowIntegrity,
      invite_source_mix: sourceMix,
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Pull historical feedback so we can (a) bias the prompt away from disliked
    // recommendations and toward liked ones, and (b) re-rank the model output.
    type FeedbackRow = {
      insight_key: string;
      insight_title: string;
      up_count: number;
      down_count: number;
      net_score: number;
    };
    let feedbackRows: FeedbackRow[] = [];
    {
      const { data, error } = await supabase.rpc(
        "get_insight_feedback_signals",
        { _org_id: org_id, _days: 90 },
      );
      if (error) {
        console.error("feedback signals error", error);
      } else if (Array.isArray(data)) {
        feedbackRows = data as FeedbackRow[];
      }
    }
    const keyNet = new Map<string, number>();
    const titleNet = new Map<string, number>();
    for (const r of feedbackRows) {
      keyNet.set(r.insight_key, Number(r.net_score) || 0);
      const t = (r.insight_title ?? "").trim().toLowerCase();
      if (t) titleNet.set(t, (titleNet.get(t) ?? 0) + (Number(r.net_score) || 0));
    }
    const likedTitles = [...titleNet.entries()]
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t);
    const dislikedTitles = [...titleNet.entries()]
      .filter(([, n]) => n < 0)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
      .map(([t]) => t);

    if (!LOVABLE_API_KEY) {
      return json({ insights: rerank(fallbackInsights(stats), keyNet, titleNet) });
    }

    const feedbackHint =
      likedTitles.length || dislikedTitles.length
        ? `\n\nAdmin feedback signal (last 90 days):\n- Insights similar to these were RATED HIGHLY, prefer this style/angle: ${
            likedTitles.length ? JSON.stringify(likedTitles) : "(none)"
          }\n- Insights similar to these were RATED POORLY, avoid repeating them: ${
            dislikedTitles.length ? JSON.stringify(dislikedTitles) : "(none)"
          }`
        : "";

    const systemPrompt = `You are an assessment-platform analyst. Generate 3 short, specific, actionable insights for an admin based on the JSON stats they provide. Compare current vs previous 30-day window. Mention concrete numbers when useful. Avoid generic advice. Each insight must be a complete thought in 1-2 sentences.${feedbackHint}

Return STRICT JSON with this shape:
{
  "insights": [
    {
      "title": "<5-7 word headline>",
      "body": "<1-2 sentence specific insight with numbers>",
      "severity": "positive" | "info" | "warning",
      "action": "<short suggested next action or null>"
    }
  ]
}`;

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Stats:\n${JSON.stringify(stats, null, 2)}`,
            },
          ],
          temperature: 0.4,
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return json(
          { error: "Rate limit exceeded. Try again shortly." },
          429,
        );
      }
      if (aiResp.status === 402) {
        return json(
          { error: "AI credits exhausted. Add credits in workspace settings." },
          402,
        );
      }
      console.error("AI gateway error", aiResp.status, await aiResp.text());
      return json({ insights: rerank(fallbackInsights(stats), keyNet, titleNet) });
    }

    const payload = await aiResp.json();
    const raw = payload.choices?.[0]?.message?.content ?? "{}";
    let parsed: { insights?: Insight[] } = {};
    try {
      let s = raw.trim();
      if (s.startsWith("```")) s = s.replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
      parsed = JSON.parse(s);
    } catch (e) {
      console.error("Failed to parse insights JSON", e, raw);
    }

    const rawInsights: Insight[] =
      Array.isArray(parsed.insights) && parsed.insights.length
        ? parsed.insights.slice(0, 6).map((i) => ({
            title: String(i.title ?? "Insight").slice(0, 80),
            body: String(i.body ?? "").slice(0, 280),
            severity:
              i.severity === "positive" || i.severity === "warning"
                ? i.severity
                : "info",
            action: i.action ? String(i.action).slice(0, 120) : null,
          }))
        : fallbackInsights(stats);

    const insights = rerank(rawInsights, keyNet, titleNet).slice(0, 4);

    return json({ insights, stats });
  } catch (err) {
    console.error("dashboard-insights error", err);
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fallbackInsights(stats: any): Insight[] {
  const out: Insight[] = [];
  const subDelta = stats.submissions_curr - stats.submissions_prev;
  if (stats.submissions_curr > 0) {
    out.push({
      title:
        subDelta >= 0 ? "Submissions trending up" : "Submissions slowing",
      body: `${stats.submissions_curr} submissions in the last 30d vs ${stats.submissions_prev} previously.`,
      severity: subDelta >= 0 ? "positive" : "warning",
      action:
        subDelta < 0 ? "Send a reminder to pending invitees." : null,
    });
  } else {
    out.push({
      title: "No submissions yet",
      body: "Publish an assessment and invite candidates to start collecting submissions.",
      severity: "info",
      action: "Create your first assessment.",
    });
  }
  if (stats.pending_invites > 0) {
    out.push({
      title: "Pending invites waiting",
      body: `${stats.pending_invites} invitees haven't started yet.`,
      severity: "warning",
      action: "Send a follow-up email.",
    });
  }
  if (stats.integrity_avg_curr != null) {
    const sev =
      stats.integrity_avg_curr >= 85
        ? "positive"
        : stats.integrity_avg_curr >= 70
        ? "info"
        : "warning";
    out.push({
      title: "Integrity score",
      body: `Average integrity is ${stats.integrity_avg_curr}% across recent submissions${
        stats.low_integrity_submissions
          ? `; ${stats.low_integrity_submissions} flagged below 70%.`
          : "."
      }`,
      severity: sev,
      action:
        stats.low_integrity_submissions > 0
          ? "Review flagged attempts."
          : null,
    });
  }
  return out.slice(0, 3);
}

// djb2 hash matching the frontend's insightKey() so a re-generated insight with
// the exact same title+body matches stored feedback by key.
function insightKey(i: { title: string; body: string }): string {
  const s = `${i.title}\u0001${i.body}`;
  let h = 5381;
  for (let n = 0; n < s.length; n++) h = ((h << 5) + h + s.charCodeAt(n)) | 0;
  return `v1:${(h >>> 0).toString(36)}`;
}

// Rerank insights by historical org feedback. Exact insight_key matches weigh
// 2x; title-level matches contribute their net score. Stable sort preserves
// the model's original ordering on ties.
function rerank(
  insights: Insight[],
  keyNet: Map<string, number>,
  titleNet: Map<string, number>,
): Insight[] {
  if (!insights.length) return insights;
  const scored = insights.map((ins, idx) => {
    const k = insightKey(ins);
    const t = (ins.title ?? "").trim().toLowerCase();
    const score = 2 * (keyNet.get(k) ?? 0) + (titleNet.get(t) ?? 0);
    return { ins, idx, score };
  });
  scored.sort((a, b) =>
    b.score !== a.score ? b.score - a.score : a.idx - b.idx,
  );
  return scored.map((s) => s.ins);
}
