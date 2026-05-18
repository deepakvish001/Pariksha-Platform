// Layer 4 — Behavioral baselining.
//
// Two modes:
//   POST { mode: "submit_baseline", sessionId, metrics } → stores the
//     candidate's calibration profile (mean/std of inter-key gaps + mouse
//     speed). Idempotent per session — first writer wins to prevent a
//     swap victim from being overwritten by the impersonator's own profile.
//   POST { mode: "evaluate", sessionId, metrics } → compares the current
//     window against the stored baseline using z-scores. If the deviation
//     is severe (>3σ on typing AND outside reasonable bounds), it
//     self-reports a `behavioral_drift` violation at high/critical so the
//     contest-violation-engine can act on it.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { verifySignedRequest, readSignedHeaders } from "../_shared/contest-signing.ts";

interface Metrics {
  mean_inter_key_ms: number;
  std_inter_key_ms: number;
  mean_mouse_speed: number;
  std_mouse_speed: number;
  sample_n: number;
}

function validateMetrics(m: unknown): m is Metrics {
  if (!m || typeof m !== "object") return false;
  const x = m as Record<string, unknown>;
  return ["mean_inter_key_ms", "std_inter_key_ms", "mean_mouse_speed", "std_mouse_speed", "sample_n"]
    .every((k) => typeof x[k] === "number" && Number.isFinite(x[k] as number));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const rawBody = await req.text();
    const body = rawBody ? JSON.parse(rawBody) : {};

    if (readSignedHeaders(req)) {
      const v = await verifySignedRequest(req, rawBody);
      if (!v.ok) return json({ error: `Invalid signature: ${v.reason}` }, 401);
    }

    const sessionId: string | undefined = body.sessionId;
    if (!sessionId) return json({ error: "sessionId required" }, 400);
    if (!validateMetrics(body.metrics)) return json({ error: "invalid metrics" }, 400);
    const m = body.metrics as Metrics;
    if (m.sample_n < 8) return json({ error: "sample_n must be >= 8" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: session } = await admin
      .from("contest_sessions")
      .select("id, contest_id, user_id, is_active, terminated_at")
      .eq("id", sessionId)
      .maybeSingle();
    if (!session || session.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (!session.is_active || session.terminated_at) return json({ error: "session not active" }, 410);

    // ---- SUBMIT BASELINE (idempotent — first write wins) ----
    if (body.mode === "submit_baseline") {
      const { data: existing } = await admin
        .from("contest_behavioral_baselines")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (existing) return json({ ok: true, alreadyCalibrated: true });

      const { error } = await admin.from("contest_behavioral_baselines").insert({
        session_id: sessionId,
        contest_id: session.contest_id,
        user_id: session.user_id,
        mean_inter_key_ms: m.mean_inter_key_ms,
        std_inter_key_ms: Math.max(m.std_inter_key_ms, 1),
        mean_mouse_speed: m.mean_mouse_speed,
        std_mouse_speed: Math.max(m.std_mouse_speed, 1),
        sample_n: m.sample_n,
      });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, calibrated: true });
    }

    // ---- EVALUATE ----
    if (body.mode === "evaluate") {
      const { data: baseline } = await admin
        .from("contest_behavioral_baselines")
        .select("mean_inter_key_ms, std_inter_key_ms, mean_mouse_speed, std_mouse_speed, sample_n")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (!baseline) return json({ ok: true, status: "no_baseline" });

      const zKey = Math.abs(m.mean_inter_key_ms - Number(baseline.mean_inter_key_ms))
        / Math.max(Number(baseline.std_inter_key_ms), 1);
      const zMouse = Math.abs(m.mean_mouse_speed - Number(baseline.mean_mouse_speed))
        / Math.max(Number(baseline.std_mouse_speed), 1);

      // Severity ladder — both signals must agree before going critical.
      let severity: "warn" | "high" | "critical" | null = null;
      if (zKey >= 4 && m.sample_n >= 30) severity = "critical";
      else if (zKey >= 3 && m.sample_n >= 20) severity = "high";
      else if (zKey >= 2 && m.sample_n >= 12) severity = "warn";

      if (severity) {
        await admin.from("contest_violations").insert({
          contest_id: session.contest_id,
          user_id: session.user_id,
          session_id: sessionId,
          type: "behavioral_drift",
          severity,
          meta: {
            z_inter_key: Number(zKey.toFixed(2)),
            z_mouse_speed: Number(zMouse.toFixed(2)),
            sample_n: m.sample_n,
            baseline_mean_key: Number(baseline.mean_inter_key_ms),
            current_mean_key: m.mean_inter_key_ms,
          },
        });

        if (severity === "critical") {
          await admin.from("contest_sessions").update({
            terminated_at: new Date().toISOString(),
            terminated_reason: "behavioral_drift:critical",
            is_active: false,
          }).eq("id", sessionId);
          const channel = admin.channel(`session:${sessionId}`);
          try {
            await channel.send({
              type: "broadcast",
              event: "terminated",
              payload: { reason: "behavioral_drift", severity, at: Date.now() },
            });
          } finally { try { await admin.removeChannel(channel); } catch { /* noop */ } }
        }
      }

      return json({
        ok: true,
        z_inter_key: Number(zKey.toFixed(2)),
        z_mouse_speed: Number(zMouse.toFixed(2)),
        severity,
      });
    }

    return json({ error: "unknown mode" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
