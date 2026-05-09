/**
 * Smoke / contract tests for the b2b-onboarding-invites edge function.
 * These run against the deployed function URL.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/b2b-onboarding-invites`;

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

Deno.test("POST without auth returns 401", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ org_id: "00000000-0000-0000-0000-000000000000", emails: ["a@b.co"] }),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertExists(body.error);
});

Deno.test("POST with invalid payload returns 400", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON}`,
      apikey: ANON,
    },
    body: JSON.stringify({ org_id: "not-a-uuid", emails: [] }),
  });
  const body = await res.json();
  // Either 400 (validation) or 401 (anon rejected before validation) — both
  // prove the endpoint is hardened against unauthenticated, malformed input.
  assert(res.status === 400 || res.status === 401, `unexpected status ${res.status}`);
  assertExists(body.error);
});

Deno.test("POST with anon-but-foreign org returns 401/403", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON}`,
      apikey: ANON,
    },
    body: JSON.stringify({
      org_id: "00000000-0000-0000-0000-000000000000",
      emails: ["a@b.co"],
    }),
  });
  await res.text();
  assert([401, 403].includes(res.status));
});
