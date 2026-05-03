import { test, expect, request } from "@playwright/test";

/**
 * RLS smoke test — private/draft problems attached to a live contest must NOT
 * be readable by:
 *   1. Anonymous (public) users.
 *   2. Authenticated users who are NOT registered for the contest.
 *
 * They MUST be readable by registered contestants while the contest is live —
 * that branch requires seeded test data + service-role access, so it is
 * exercised in the contestant E2E flow when CONTESTANT_STORAGE_STATE is set.
 *
 * This file uses the Supabase REST endpoint directly so it works as a true
 * black-box check of the RLS policies, independent of any UI state.
 */

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lvnpvfxlmzbnylwkvgnq.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  "";

test.describe("RLS — private contest problems", () => {
  test.skip(!SUPABASE_ANON_KEY, "Requires anon key to query the REST endpoint");

  test("anonymous users cannot read unpublished problems", async () => {
    const api = await request.newContext({
      baseURL: SUPABASE_URL,
      extraHTTPHeaders: { apikey: SUPABASE_ANON_KEY },
    });

    const res = await api.get(
      "/rest/v1/coding_problems?select=slug,is_published&is_published=eq.false&limit=50",
    );
    expect(res.status()).toBe(200);
    const rows = (await res.json()) as Array<{ slug: string; is_published: boolean }>;

    // Anonymous: RLS should filter out every draft. Empty array, never a leak.
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.every((r) => r.is_published === true)).toBe(true);
    expect(rows.find((r) => r.is_published === false)).toBeUndefined();
  });

  test("anonymous users cannot read draft starter code, sample tests, or sql specs", async () => {
    const api = await request.newContext({
      baseURL: SUPABASE_URL,
      extraHTTPHeaders: { apikey: SUPABASE_ANON_KEY },
    });

    // For each child table, fetch rows and confirm none of them belong to a
    // draft problem (the RLS policy joins to coding_problems.is_published).
    const [starter, tests, specs] = await Promise.all([
      api.get("/rest/v1/coding_problem_starter_code?select=problem_slug&limit=200"),
      api.get("/rest/v1/coding_problem_tests?select=problem_slug,kind&limit=200"),
      api.get("/rest/v1/coding_problem_sql_specs?select=problem_slug&limit=200"),
    ]);

    expect(starter.status()).toBe(200);
    expect(tests.status()).toBe(200);
    expect(specs.status()).toBe(200);

    const starterRows = (await starter.json()) as Array<{ problem_slug: string }>;
    const testRows = (await tests.json()) as Array<{ problem_slug: string; kind: string }>;
    const specRows = (await specs.json()) as Array<{ problem_slug: string }>;

    const allSlugs = Array.from(
      new Set([
        ...starterRows.map((r) => r.problem_slug),
        ...testRows.map((r) => r.problem_slug),
        ...specRows.map((r) => r.problem_slug),
      ]),
    );

    if (allSlugs.length === 0) return; // nothing seeded — vacuously safe

    const inList = `(${allSlugs.map((s) => `"${s}"`).join(",")})`;
    const probRes = await api.get(
      `/rest/v1/coding_problems?select=slug,is_published&slug=in.${inList}`,
    );
    expect(probRes.status()).toBe(200);
    const probs = (await probRes.json()) as Array<{ slug: string; is_published: boolean }>;
    const draftSlugs = new Set(probs.filter((p) => !p.is_published).map((p) => p.slug));

    // Sample tests are the only kind exposed publicly. Hidden tests + any row
    // that resolves to a draft problem must be invisible to anon.
    expect(testRows.every((r) => r.kind === "sample")).toBe(true);
    expect(starterRows.every((r) => !draftSlugs.has(r.problem_slug))).toBe(true);
    expect(specRows.every((r) => !draftSlugs.has(r.problem_slug))).toBe(true);
  });

  test("authenticated-but-unregistered users cannot read draft contest problems", async () => {
    const storage = process.env.LEARNER_STORAGE_STATE;
    test.skip(!storage, "Requires LEARNER_STORAGE_STATE for an authed non-contestant");

    // Re-use the page's session token by reading it from storageState.
    const fs = await import("node:fs/promises");
    const raw = JSON.parse(await fs.readFile(storage!, "utf-8"));
    const origin = (raw.origins ?? []).find((o: any) => o.origin?.includes("supabase"));
    const tokenItem = origin?.localStorage?.find((k: any) => /auth-token/i.test(k.name));
    const token = tokenItem ? JSON.parse(tokenItem.value)?.access_token : null;
    test.skip(!token, "Could not extract auth token from storage state");

    const api = await request.newContext({
      baseURL: SUPABASE_URL,
      extraHTTPHeaders: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    const res = await api.get(
      "/rest/v1/coding_problems?select=slug,is_published&is_published=eq.false&limit=50",
    );
    expect(res.status()).toBe(200);
    const rows = (await res.json()) as Array<{ slug: string; is_published: boolean }>;
    // Non-registered learner: they may see draft problems ONLY if they're
    // registered for a live contest that includes those problems. Here we
    // require the env to flag the user as unregistered.
    if (process.env.LEARNER_IS_UNREGISTERED === "true") {
      expect(rows.length).toBe(0);
    }
  });

  test("registered contestants only see drafts attached to their live contest", async () => {
    const storage = process.env.CONTESTANT_STORAGE_STATE;
    test.skip(!storage, "Requires CONTESTANT_STORAGE_STATE for a registered contestant");

    const liveContestId = process.env.CONTESTANT_LIVE_CONTEST_ID;
    test.skip(!liveContestId, "Requires CONTESTANT_LIVE_CONTEST_ID for the live contest the user is registered in");

    // Pull the auth token from the contestant's storage state.
    const fs = await import("node:fs/promises");
    const raw = JSON.parse(await fs.readFile(storage!, "utf-8"));
    const origin = (raw.origins ?? []).find((o: any) => o.origin?.includes("supabase"));
    const tokenItem = origin?.localStorage?.find((k: any) => /auth-token/i.test(k.name));
    const token = tokenItem ? JSON.parse(tokenItem.value)?.access_token : null;
    test.skip(!token, "Could not extract auth token from storage state");

    const api = await request.newContext({
      baseURL: SUPABASE_URL,
      extraHTTPHeaders: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    // 1) Slugs attached to the live contest the contestant is registered in.
    const liveAttached = await api.get(
      `/rest/v1/contest_problems?select=problem_slug&contest_id=eq.${liveContestId}`,
    );
    expect(liveAttached.status()).toBe(200);
    const liveSlugs = ((await liveAttached.json()) as Array<{ problem_slug: string }>).map((r) => r.problem_slug);

    // 2) All draft problem slugs the contestant can currently SELECT.
    const draftRes = await api.get(
      "/rest/v1/coding_problems?select=slug,is_published&is_published=eq.false&limit=200",
    );
    expect(draftRes.status()).toBe(200);
    const visibleDraftSlugs = ((await draftRes.json()) as Array<{ slug: string; is_published: boolean }>)
      .map((r) => r.slug);

    // Every visible draft must belong to the live contest the user is registered in.
    const allowedSet = new Set(liveSlugs);
    const leakedDrafts = visibleDraftSlugs.filter((s) => !allowedSet.has(s));
    expect(leakedDrafts, `Drafts leaked to contestant: ${leakedDrafts.join(", ")}`).toEqual([]);

    // 3) Negative check — a draft from a *different* contest must not be readable.
    const otherContestId = process.env.OTHER_DRAFT_CONTEST_ID;
    if (otherContestId) {
      const otherAttached = await api.get(
        `/rest/v1/contest_problems?select=problem_slug&contest_id=eq.${otherContestId}`,
      );
      expect(otherAttached.status()).toBe(200);
      const otherSlugs = ((await otherAttached.json()) as Array<{ problem_slug: string }>)
        .map((r) => r.problem_slug)
        .filter((s) => !allowedSet.has(s));

      if (otherSlugs.length > 0) {
        const inList = `(${otherSlugs.map((s) => `"${s}"`).join(",")})`;
        const probe = await api.get(
          `/rest/v1/coding_problems?select=slug,is_published&slug=in.${inList}`,
        );
        expect(probe.status()).toBe(200);
        const visible = (await probe.json()) as Array<{ slug: string; is_published: boolean }>;
        // Any visible row from the other contest must already be Public.
        const leaked = visible.filter((r) => !r.is_published);
        expect(leaked, `Other-contest drafts leaked: ${leaked.map((r) => r.slug).join(", ")}`).toEqual([]);

        // Starter code + sample tests for those other-contest drafts must also be hidden.
        const [starter, tests, specs] = await Promise.all([
          api.get(`/rest/v1/coding_problem_starter_code?select=problem_slug&problem_slug=in.${inList}`),
          api.get(`/rest/v1/coding_problem_tests?select=problem_slug,kind&problem_slug=in.${inList}`),
          api.get(`/rest/v1/coding_problem_sql_specs?select=problem_slug&problem_slug=in.${inList}`),
        ]);
        const draftOnly = new Set(leaked.map((r) => r.slug));
        // If the other-contest slug is still a draft, no child rows should leak.
        for (const r of (await starter.json()) as Array<{ problem_slug: string }>) {
          expect(draftOnly.has(r.problem_slug)).toBe(false);
        }
        for (const r of (await tests.json()) as Array<{ problem_slug: string; kind: string }>) {
          expect(draftOnly.has(r.problem_slug)).toBe(false);
        }
        for (const r of (await specs.json()) as Array<{ problem_slug: string }>) {
          expect(draftOnly.has(r.problem_slug)).toBe(false);
        }
      }
    }
  });
});
