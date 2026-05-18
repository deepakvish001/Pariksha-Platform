// Layer 5 — Issues and rotates per-session HMAC signing keys.
// Modes:
//   - "issue":  called once when the contest player mounts after Trust Gate
//   - "rotate": called every ~60s by the client to refresh attestation
//   - "revoke": admin/termination flow
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateSessionKey } from "../_shared/contest-signing.ts";

const KEY_TTL_SECONDS = 90; // 60s rotation + 30s grace

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode as "issue" | "rotate" | "revoke" | undefined;
    const sessionId = body.sessionId as string | undefined;
    const previousKeyId = body.previousKeyId as string | undefined;

    if (!mode || !sessionId) {
      return new Response(JSON.stringify({ error: "bad_request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify the caller actually owns this contest session.
    const { data: session } = await admin
      .from("contest_sessions")
      .select("id, user_id, status")
      .eq("id", sessionId)
      .maybeSingle();

    if (!session || session.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "session_forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "revoke") {
      await admin
        .from("contest_session_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .is("revoked_at", null);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.status && ["terminated", "completed", "aborted"].includes(session.status)) {
      return new Response(JSON.stringify({ error: "session_closed" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Revoke prior active keys for rotation.
    if (mode === "rotate" && previousKeyId) {
      await admin
        .from("contest_session_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", previousKeyId)
        .eq("session_id", sessionId);
    }

    const { secret, hash } = await generateSessionKey();
    const expiresAt = new Date(Date.now() + KEY_TTL_SECONDS * 1000).toISOString();

    const { data: inserted, error: insErr } = await admin
      .from("contest_session_keys")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        key_secret: secret,
        key_hash: hash,
        rotated_from: previousKeyId ?? null,
        expires_at: expiresAt,
      })
      .select("id, expires_at")
      .single();

    if (insErr || !inserted) {
      console.error("contest-session-sign insert error", insErr);
      return new Response(JSON.stringify({ error: "issue_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the raw secret to the client ONCE — never readable again.
    return new Response(
      JSON.stringify({
        keyId: inserted.id,
        secret,
        expiresAt: inserted.expires_at,
        ttlSeconds: KEY_TTL_SECONDS,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("contest-session-sign error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
