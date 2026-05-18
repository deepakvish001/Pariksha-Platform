import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { verifySignedRequest, readSignedHeaders } from "../_shared/contest-signing.ts";

/**
 * Single sink for all proctoring violation events.
 *
 * Body: { session_id, category, severity, evidence_ref?, meta? }
 *
 * - severity: 'info' | 'warn' | 'high' | 'critical'
 * - Looks up the contest's enforcement_mode and decides:
 *     hard       → critical = terminate immediately; high += 25 risk; warn += 5
 *     graduated  → 3 critical OR risk >= 100 → terminate; else escalate banner
 *     standard   → log + warn only, never terminate
 *     open       → log only
 * - On terminate: stamps contest_sessions.terminated_at + reason, broadcasts a
 *   Realtime kill-signal on `session:<id>` and creates a pending integrity verdict.
 * - Every action is mirrored into contest_violations for the existing UI feeds.
 */

const VALID_SEVERITY = new Set(["info", "warn", "high", "critical"]);
const CRITICAL_AUTO_TERMINATE = new Set([
  "identity_mismatch",
  "second_person",
  "second_monitor",
  "vm_detected",
  "rdp_detected",
  "devtools_open",
  "side_eye_disconnected_grace_expired",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const rawBody = await req.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const { session_id, category, severity, evidence_ref, meta } = body ?? {};

    // Layer 5 — verify HMAC signature when present. Soft-fail (log) for now
    // so a missing/bad signature gets recorded as its own violation but does
    // not block the engine from processing legitimate unsigned legacy calls.
    let signatureStatus: "valid" | "missing" | "invalid" = "missing";
    let signatureReason: string | null = null;
    if (readSignedHeaders(req)) {
      const verify = await verifySignedRequest(req, rawBody);
      if (verify.ok) {
        signatureStatus = "valid";
      } else {
        signatureStatus = "invalid";
        signatureReason = verify.reason;
      }
    }

    if (typeof session_id !== "string" || typeof category !== "string" || typeof severity !== "string") {
      return json({ error: "session_id, category, severity required" }, 400);
    }
    if (!VALID_SEVERITY.has(severity)) {
      return json({ error: "invalid severity" }, 400);
    }
    if (category.length > 64 || category.length < 2) {
      return json({ error: "invalid category" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch session + contest enforcement mode
    const { data: session, error: sErr } = await admin
      .from("contest_sessions")
      .select("id, contest_id, user_id, terminated_at, risk_score, contests:contest_id(enforcement_mode)")
      .eq("id", session_id)
      .maybeSingle();

    if (sErr || !session) return json({ error: "session not found" }, 404);
    // Only the session owner OR an admin may report events for it.
    if (session.user_id !== user.id) {
      const { data: roleRow } = await admin.from("user_roles")
        .select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!roleRow) return json({ error: "Forbidden" }, 403);
    }

    if (session.terminated_at) {
      return json({ ok: true, status: "already_terminated" });
    }

    const mode = (session as any).contests?.enforcement_mode ?? "hard";

    // Score delta
    const delta = severity === "critical" ? 100 : severity === "high" ? 25 : severity === "warn" ? 5 : 0;
    const newScore = Number(session.risk_score ?? 0) + delta;

    // Decide action
    let action: "logged" | "warn" | "terminate" = "logged";
    if (mode === "hard") {
      if (severity === "critical" && CRITICAL_AUTO_TERMINATE.has(category)) action = "terminate";
      else if (severity === "high" || severity === "warn") action = "warn";
    } else if (mode === "graduated") {
      if (newScore >= 100) action = "terminate";
      else if (severity === "warn" || severity === "high" || severity === "critical") action = "warn";
    } else if (mode === "standard") {
      if (severity === "warn" || severity === "high" || severity === "critical") action = "warn";
    }

    // Persist event into contest_violations (existing typed log)
    await admin.from("contest_violations").insert({
      contest_id: session.contest_id,
      user_id: session.user_id,
      session_id: session.id,
      type: category,
      severity,
      meta: {
        ...(meta ?? {}),
        evidence_ref: evidence_ref ?? null,
        action,
        score: newScore,
        signature: signatureStatus,
        signature_reason: signatureReason,
      },
    });

    // Layer 5 — if signature was invalid (tampered/replayed), record a
    // separate critical signature_invalid violation alongside the reported one.
    if (signatureStatus === "invalid") {
      await admin.from("contest_violations").insert({
        contest_id: session.contest_id,
        user_id: session.user_id,
        session_id: session.id,
        type: "signature_invalid",
        severity: "critical",
        meta: { reason: signatureReason, original_category: category },
      });
    }

    // Update running risk score
    await admin.from("contest_sessions").update({ risk_score: newScore }).eq("id", session.id);

    if (action === "terminate") {
      await admin.from("contest_sessions").update({
        terminated_at: new Date().toISOString(),
        terminated_reason: `${category}:${severity}`,
        is_active: false,
      }).eq("id", session.id);

      // Create pending verdict for the admin queue
      const publicToken = crypto.randomUUID().replace(/-/g, "");
      await admin.from("contest_integrity_verdicts").upsert({
        session_id: session.id,
        contest_id: session.contest_id,
        user_id: session.user_id,
        verdict: "pending",
        public_token: publicToken,
        reason: `Auto-terminated: ${category} (${severity})`,
      }, { onConflict: "session_id" });

      // Broadcast kill-signal so the player can render the lockout immediately
      const channel = admin.channel(`session:${session.id}`);
      await channel.send({
        type: "broadcast",
        event: "terminated",
        payload: { reason: category, severity, at: Date.now() },
      });
      try { await admin.removeChannel(channel); } catch { /* noop */ }
    }

    return json({ ok: true, action, risk_score: newScore, mode });
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
