// Shared HMAC signing/verification helpers for Layer 5 tamper-proof contest transport.
// Used by contest-session-sign (issuing keys) and by every contest-* function that
// must reject unsigned, replayed, or out-of-order client payloads.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface SignedRequestHeaders {
  sessionId: string;
  keyId: string;
  sequence: number;
  nonce: string;
  timestamp: number;
  signature: string;
}

const enc = new TextEncoder();

async function hmacSha256(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function generateSessionKey(): Promise<{ secret: string; hash: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const secret = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  const hash = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { secret, hash };
}

export function readSignedHeaders(req: Request): SignedRequestHeaders | null {
  const sessionId = req.headers.get("x-contest-session");
  const keyId = req.headers.get("x-contest-key-id");
  const sequence = req.headers.get("x-contest-seq");
  const nonce = req.headers.get("x-contest-nonce");
  const timestamp = req.headers.get("x-contest-ts");
  const signature = req.headers.get("x-contest-sig");
  if (!sessionId || !keyId || !sequence || !nonce || !timestamp || !signature) return null;
  return {
    sessionId,
    keyId,
    sequence: Number(sequence),
    nonce,
    timestamp: Number(timestamp),
    signature,
  };
}

/**
 * Verify a signed contest request. Returns { ok: true } if accepted.
 * On failure, returns { ok: false, reason } — callers should respond 401 and
 * report a `signature_invalid` violation to the violation engine.
 *
 * SECURITY: opens a service-role admin client; never expose this helper to browsers.
 */
export async function verifySignedRequest(
  req: Request,
  rawBody: string,
): Promise<{ ok: true; sessionId: string; userId: string } | { ok: false; reason: string }> {
  const headers = readSignedHeaders(req);
  if (!headers) return { ok: false, reason: "missing_signature_headers" };

  // Reject stale requests (>120s clock skew window).
  const skew = Math.abs(Date.now() - headers.timestamp);
  if (skew > 120_000) return { ok: false, reason: "clock_skew" };

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: keyRow } = await admin
    .from("contest_session_keys")
    .select("id, session_id, user_id, key_secret, expires_at, revoked_at")
    .eq("id", headers.keyId)
    .eq("session_id", headers.sessionId)
    .maybeSingle();

  if (!keyRow) return { ok: false, reason: "unknown_key" };
  if (keyRow.revoked_at) return { ok: false, reason: "key_revoked" };
  if (new Date(keyRow.expires_at).getTime() < Date.now()) return { ok: false, reason: "key_expired" };

  // Canonical payload: METHOD\nPATH\nSEQ\nNONCE\nTS\nBODY
  const url = new URL(req.url);
  const canonical = [
    req.method.toUpperCase(),
    url.pathname,
    String(headers.sequence),
    headers.nonce,
    String(headers.timestamp),
    rawBody,
  ].join("\n");

  const expected = await hmacSha256(keyRow.key_secret, canonical);
  if (expected !== headers.signature) return { ok: false, reason: "signature_mismatch" };

  // Monotonic sequence check (replay defense).
  const { data: seqRow } = await admin
    .from("contest_session_event_seq")
    .select("last_seq, last_nonce")
    .eq("session_id", headers.sessionId)
    .maybeSingle();

  if (seqRow) {
    if (headers.sequence <= seqRow.last_seq) return { ok: false, reason: "seq_replay" };
    if (seqRow.last_nonce === headers.nonce) return { ok: false, reason: "nonce_replay" };
    await admin
      .from("contest_session_event_seq")
      .update({ last_seq: headers.sequence, last_nonce: headers.nonce, updated_at: new Date().toISOString() })
      .eq("session_id", headers.sessionId);
  } else {
    await admin
      .from("contest_session_event_seq")
      .insert({ session_id: headers.sessionId, last_seq: headers.sequence, last_nonce: headers.nonce });
  }

  return { ok: true, sessionId: keyRow.session_id, userId: keyRow.user_id };
}
