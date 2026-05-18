// Layer 1 — Per-candidate question randomization.
//
// Deterministically assigns a variant of every contest_problem to the calling
// session, persisting the choice into contest_user_variants. Idempotent: the
// same (session,user,problem) always resolves to the same variant on reconnect
// because the shuffle is seeded by sha256(sessionId + problem_slug + secret).
//
// Also returns a per-candidate problem display order so two candidates rarely
// see the same questions in the same sequence.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { verifySignedRequest, readSignedHeaders } from "../_shared/contest-signing.ts";

const enc = new TextEncoder();

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Deterministic int in [0, n) from a hex seed.
function seedIndex(hex: string, n: number): number {
  if (n <= 1) return 0;
  // Use the first 12 hex chars as a 48-bit unsigned int.
  const slice = hex.slice(0, 12);
  const val = parseInt(slice, 16);
  return val % n;
}

// Deterministic Fisher-Yates shuffle seeded by a hex digest.
function seededShuffle<T>(items: T[], seedHex: string): T[] {
  const out = [...items];
  const cursor = { v: 0 };
  const nextByte = () => {
    const ch = seedHex.slice(cursor.v % seedHex.length, (cursor.v % seedHex.length) + 2);
    cursor.v += 2;
    return parseInt(ch, 16);
  };
  for (let i = out.length - 1; i > 0; i--) {
    // Combine 2 bytes for a wider sample, then mod (i+1).
    const r = ((nextByte() << 8) | nextByte()) % (i + 1);
    [out[i], out[r]] = [out[r], out[i]];
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SECRET = Deno.env.get("CONTEST_ALLOCATOR_SECRET") ?? "byteskill-allocator";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const rawBody = await req.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const sessionId: string | undefined = body?.sessionId;
    if (!sessionId || typeof sessionId !== "string") {
      return json({ error: "sessionId required" }, 400);
    }

    // Layer 5 — verify signed transport when present. Allocator runs only
    // from the live proctored player, so we require a valid signature.
    if (readSignedHeaders(req)) {
      const verify = await verifySignedRequest(req, rawBody);
      if (!verify.ok) {
        return json({ error: `Invalid signature: ${verify.reason}` }, 401);
      }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Validate session ownership + active state.
    const { data: session, error: sErr } = await admin
      .from("contest_sessions")
      .select("id, contest_id, user_id, is_active, terminated_at")
      .eq("id", sessionId)
      .maybeSingle();
    if (sErr || !session) return json({ error: "session not found" }, 404);
    if (session.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (!session.is_active || session.terminated_at) {
      return json({ error: "session not active" }, 410);
    }

    // Load contest problems + every variant.
    const { data: problems } = await admin
      .from("contest_problems")
      .select("problem_slug, order_index, points")
      .eq("contest_id", session.contest_id)
      .order("order_index", { ascending: true });

    if (!problems || problems.length === 0) {
      return json({ ok: true, problems: [], assignments: [] });
    }

    const { data: variants } = await admin
      .from("contest_problem_variants")
      .select("id, problem_slug, variant_key, weight")
      .eq("contest_id", session.contest_id);

    const byProblem = new Map<string, typeof variants>();
    for (const v of variants ?? []) {
      const list = byProblem.get(v.problem_slug) ?? [];
      list.push(v);
      byProblem.set(v.problem_slug, list);
    }

    // Deterministic per-session problem ordering.
    const orderSeed = await sha256Hex(`${sessionId}|order|${SECRET}`);
    const orderedProblems = seededShuffle(problems, orderSeed);

    // For each problem with variants, ensure an assignment exists.
    const assignments: Array<{ problem_slug: string; variant_id: string; variant_key: string }> = [];
    for (const p of orderedProblems) {
      const pool = byProblem.get(p.problem_slug) ?? [];
      if (pool.length === 0) continue;

      // Idempotent: if user already has an assignment, reuse it.
      const { data: existing } = await admin
        .from("contest_user_variants")
        .select("variant_id, variant_key")
        .eq("contest_id", session.contest_id)
        .eq("user_id", session.user_id)
        .eq("problem_slug", p.problem_slug)
        .maybeSingle();

      if (existing) {
        assignments.push({
          problem_slug: p.problem_slug,
          variant_id: existing.variant_id,
          variant_key: existing.variant_key,
        });
        continue;
      }

      // Deterministic pick from the pool.
      const seed = await sha256Hex(`${sessionId}|${p.problem_slug}|${SECRET}`);
      const sortedPool = [...pool].sort((a, b) => a.variant_key.localeCompare(b.variant_key));
      const pick = sortedPool[seedIndex(seed, sortedPool.length)];

      await admin
        .from("contest_user_variants")
        .upsert({
          contest_id: session.contest_id,
          user_id: session.user_id,
          problem_slug: p.problem_slug,
          variant_id: pick.id,
          variant_key: pick.variant_key,
        }, { onConflict: "contest_id,user_id,problem_slug" });

      assignments.push({
        problem_slug: p.problem_slug,
        variant_id: pick.id,
        variant_key: pick.variant_key,
      });
    }

    return json({
      ok: true,
      sessionId,
      contestId: session.contest_id,
      problems: orderedProblems.map((p) => ({
        problem_slug: p.problem_slug,
        points: p.points,
      })),
      assignments,
    });
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
