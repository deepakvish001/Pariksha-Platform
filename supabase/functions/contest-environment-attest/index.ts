import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Trust Gate sink: receives the candidate's pre-test environment snapshot
 * (single-monitor, VM/RDP, webgl renderer, devtools, automation flags,
 * IP, side-eye paired) and returns a server-signed attestation token plus
 * a gate_passed verdict.
 *
 * The token is the SHA-256 of `${session_id}.${ts}.${SECRET}.${json}` and
 * is stored in `contest_trust_attestations.signed_token` so the violation
 * engine and admin reviewer can later verify the snapshot wasn't tampered
 * with after the fact.
 *
 * Body: { session_id, snapshot: {...probes...} }
 */

interface Snapshot {
  single_monitor?: boolean;
  vm_detected?: boolean;
  rdp_detected?: boolean;
  webgl_renderer?: string;
  devtools_open?: boolean;
  automation_flags?: string[];
  ip?: string;
  user_agent?: string;
  side_eye_paired?: boolean;
  selfie_match_score?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const { session_id, snapshot } = body ?? {};
    if (typeof session_id !== "string" || !snapshot || typeof snapshot !== "object") {
      return json({ error: "session_id and snapshot required" }, 400);
    }
    const snap = snapshot as Snapshot;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify session ownership
    const { data: session } = await admin
      .from("contest_sessions")
      .select("id, user_id, contest_id, contests:contest_id(enforcement_mode)")
      .eq("id", session_id)
      .maybeSingle();
    if (!session || session.user_id !== user.id) return json({ error: "Forbidden" }, 403);

    const mode = (session as any).contests?.enforcement_mode ?? "hard";

    // Evaluate gate (hard-mode = zero tolerance)
    const failures: string[] = [];
    if (snap.vm_detected) failures.push("vm_detected");
    if (snap.rdp_detected) failures.push("rdp_detected");
    if (snap.single_monitor === false) failures.push("second_monitor");
    if (snap.devtools_open) failures.push("devtools_open");
    if ((snap.automation_flags?.length ?? 0) > 0) failures.push("automation_detected");
    if (mode === "hard" && snap.side_eye_paired === false) failures.push("side_eye_required");
    if (mode === "hard" && typeof snap.selfie_match_score === "number" && snap.selfie_match_score < 0.7) {
      failures.push("identity_mismatch");
    }

    const gate_passed = failures.length === 0;

    // Server-side signed token (HMAC-style via SHA-256 of secret+payload)
    const ts = Date.now();
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const payload = `${session_id}.${ts}.${JSON.stringify(snap)}`;
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${secret}.${payload}`),
    );
    const signed_token = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Get client IP from request headers (best-effort)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? snap.ip ?? null;

    await admin.from("contest_trust_attestations").insert({
      session_id,
      contest_id: session.contest_id,
      user_id: user.id,
      single_monitor: snap.single_monitor ?? null,
      vm_detected: !!snap.vm_detected,
      rdp_detected: !!snap.rdp_detected,
      webgl_renderer: snap.webgl_renderer ?? null,
      devtools_open: !!snap.devtools_open,
      automation_flags: snap.automation_flags ?? [],
      ip,
      user_agent: snap.user_agent ?? req.headers.get("user-agent") ?? null,
      side_eye_paired: !!snap.side_eye_paired,
      selfie_match_score: snap.selfie_match_score ?? null,
      signed_token,
      issued_at: new Date(ts).toISOString(),
      gate_passed,
      failures,
      raw: snap as unknown as Record<string, unknown>,
    });

    // If hard-mode and gate failed, fire-and-forget into the violation engine.
    if (!gate_passed && mode === "hard") {
      await admin.from("contest_violations").insert({
        contest_id: session.contest_id,
        user_id: user.id,
        session_id,
        type: "trust_gate_failed",
        severity: "critical",
        meta: { failures, signed_token },
      });
    }

    return json({ ok: true, gate_passed, failures, signed_token, ts });
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
