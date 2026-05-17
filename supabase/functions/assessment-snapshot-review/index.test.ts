/**
 * Authorization contract tests for assessment-snapshot-review.
 *
 * Verifies the gate: only the service-role (cron) or an org owner/admin/proctor
 * may invoke this function. Every other caller MUST get 401/403/404 and never
 * reach the snapshot processing branch.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assertEquals,
  assert,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/assessment-snapshot-review`;

// Real attempts (with org membership) used to prove a non-proctor in a *real*
// org is rejected with 403, not silently allowed.
const REAL_ATTEMPT_IDS = [
  "6abcbd03-3b8d-4100-b9bb-d467747aaa18",
  "8f1a7612-307f-407a-a514-3d1c47899085",
  "c47b899b-1c43-40ae-8476-4c6e8b1df501",
];
const UNKNOWN_ATTEMPT_ID = "00000000-0000-0000-0000-000000000000";

async function post(body: unknown, auth?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: ANON,
  };
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const res = await fetch(FN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch { /* noop */ }
  return { status: res.status, json, text };
}

/** Create a throwaway authenticated user that is NOT a member of any org. */
async function createOutsiderSession(): Promise<string> {
  const client = createClient(SUPABASE_URL, ANON, {
    auth: { persistSession: false },
  });
  const email = `proctor-test-${crypto.randomUUID()}@example.test`;
  const password = `Test-${crypto.randomUUID()}!`;
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw new Error(`signUp failed: ${error.message}`);
  const token = data.session?.access_token;
  if (!token) throw new Error("signUp returned no session (email confirmation enabled?)");
  return token;
}

Deno.test("CORS preflight allows POST", async () => {
  const res = await fetch(FN_URL, {
    method: "OPTIONS",
    headers: {
      Origin: "https://example.test",
      "Access-Control-Request-Method": "POST",
    },
  });
  await res.text();
  assert(res.status === 200 || res.status === 204);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("POST without Authorization returns 401", async () => {
  const { status, json } = await post({ attempt_id: REAL_ATTEMPT_IDS[0] });
  assertEquals(status, 401);
  assertExists(json.error);
});

Deno.test("POST with anon key (no user session) returns 401", async () => {
  // ANON key is not a user JWT — auth.getUser() yields no uid → 401.
  const { status, json } = await post({ attempt_id: REAL_ATTEMPT_IDS[0] }, ANON);
  assertEquals(status, 401);
  assertExists(json.error);
});

Deno.test("POST with garbage bearer returns 401", async () => {
  const { status } = await post({ attempt_id: REAL_ATTEMPT_IDS[0] }, "not.a.jwt");
  assertEquals(status, 401);
});

Deno.test("POST authenticated without attempt_id returns 400", async () => {
  const token = await createOutsiderSession();
  const { status, json } = await post({}, token);
  assertEquals(status, 400);
  assertEquals(json.error, "attempt_id is required");
});

Deno.test("POST authenticated with unknown attempt_id returns 404", async () => {
  const token = await createOutsiderSession();
  const { status, json } = await post({ attempt_id: UNKNOWN_ATTEMPT_ID }, token);
  assertEquals(status, 404);
  assertExists(json.error);
});

Deno.test(
  "POST authenticated non-proctor returns 403 for every real attempt/org",
  async () => {
    const token = await createOutsiderSession();
    for (const attemptId of REAL_ATTEMPT_IDS) {
      const { status, json } = await post({ attempt_id: attemptId }, token);
      assertEquals(
        status,
        403,
        `attempt ${attemptId} expected 403 got ${status} (${JSON.stringify(json)})`,
      );
      assertEquals(json.error, "Forbidden");
    }
  },
);
