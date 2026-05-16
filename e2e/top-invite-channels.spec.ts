import { test, expect, Page } from "@playwright/test";

/**
 * E2E for the Top Invite Channels card.
 *
 * Strategy:
 *  1. Skip if no authenticated B2B session exists in the preview (no token in
 *     localStorage or no assessments owned by the org).
 *  2. Otherwise, talk to Supabase REST as the logged-in user to seed three
 *     invites against the org's first assessment using distinct sources
 *     (`email`, `link`, `bulk_upload`).
 *  3. Reload the dashboard, switch the channel range to "All time", and assert
 *     the card shows the correct per-source totals.
 *  4. Always clean up the seeded invites in `afterEach`.
 */

const SUPABASE_URL = "https://lvnpvfxlmzbnylwkvgnq.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bnB2ZnhsbXpibnlsd2t2Z25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODQwNjUsImV4cCI6MjA4NTc2MDA2NX0.hDu56RIXWloY5MilImp8hfhfSKv6bc-f5ud9P4ErA_s";

type SeededInvite = { id: string; email: string; source: string };

async function getAccessToken(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
        try {
          const v = JSON.parse(localStorage.getItem(k) ?? "null");
          return v?.access_token ?? null;
        } catch {
          return null;
        }
      }
    }
    return null;
  });
}

async function supaFetch(
  page: Page,
  token: string,
  path: string,
  init: RequestInit = {},
) {
  return page.evaluate(
    async ({ url, init, anon, token }) => {
      const res = await fetch(url, {
        ...init,
        headers: {
          apikey: anon,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          ...((init.headers as Record<string, string>) ?? {}),
        },
      });
      const body = await res.text();
      let json: unknown = null;
      try {
        json = body ? JSON.parse(body) : null;
      } catch {
        /* non-JSON body */
      }
      return { ok: res.ok, status: res.status, body: json };
    },
    { url: `${SUPABASE_URL}/rest/v1${path}`, init, anon: ANON_KEY, token },
  );
}

async function findAssessmentId(page: Page, token: string): Promise<string | null> {
  const r = await supaFetch(page, token, `/assessments?select=id&limit=1`);
  if (!r.ok || !Array.isArray(r.body) || !r.body.length) return null;
  return (r.body as Array<{ id: string }>)[0].id;
}

async function seedInvites(
  page: Page,
  token: string,
  assessmentId: string,
): Promise<SeededInvite[]> {
  const stamp = Date.now();
  const rows = [
    { source: "email", email: `e2e-email-${stamp}@example.com` },
    { source: "link", email: `e2e-link-${stamp}@example.com` },
    { source: "bulk_upload", email: `e2e-bulk-${stamp}@example.com` },
  ].map((r) => ({ assessment_id: assessmentId, ...r }));

  const res = await supaFetch(page, token, "/assessment_invites", {
    method: "POST",
    body: JSON.stringify(rows),
  });
  expect(res.ok, `seed failed: ${JSON.stringify(res.body)}`).toBeTruthy();
  return res.body as SeededInvite[];
}

async function cleanup(
  page: Page,
  token: string,
  invites: SeededInvite[],
): Promise<void> {
  if (!invites.length) return;
  const ids = invites.map((i) => i.id).join(",");
  await supaFetch(page, token, `/assessment_invites?id=in.(${ids})`, {
    method: "DELETE",
  });
}

test.describe("Top Invite Channels — per-source totals", () => {
  let seeded: SeededInvite[] = [];
  let token: string | null = null;

  test.afterEach(async ({ page }) => {
    if (token && seeded.length) await cleanup(page, token, seeded);
    seeded = [];
  });

  test("card aggregates invites per source after seeding", async ({ page }) => {
    await page.goto("/b2b/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});

    if (!/\/(b2b|colleges|companies)\//.test(page.url()) || /onboarding/.test(page.url())) {
      test.skip(true, "No authenticated B2B session in this env");
    }

    token = await getAccessToken(page);
    if (!token) test.skip(true, "No supabase access token in localStorage");

    const assessmentId = await findAssessmentId(page, token!);
    if (!assessmentId) test.skip(true, "No assessments available for this org");

    seeded = await seedInvites(page, token!, assessmentId!);
    expect(seeded).toHaveLength(3);

    // Reload to pick up the new invites and switch to "All time" so the window
    // is independent of the seed timing.
    await page.reload();
    await expect(
      page.getByRole("heading", { name: /top invite channels/i }),
    ).toBeVisible();

    // The card's range selector — the only Select on the dashboard with these
    // labels. Open and pick "All time".
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /all time/i }).click();

    // Locate the card scope so assertions don't leak elsewhere on the page.
    const card = page
      .getByRole("heading", { name: /top invite channels/i })
      .locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]");

    // Each seeded source must appear with a count >= 1 (>= because the org may
    // already have other invites with the same source).
    for (const label of [/email invites/i, /shareable link/i, /bulk upload/i]) {
      const row = card.locator("div", { has: page.getByText(label) }).first();
      await expect(row).toBeVisible();
      // The numeric cell sits next to the label; assert at least one digit ≥ 1.
      const text = (await row.innerText()).trim();
      expect(/\b([1-9]\d*)\b/.test(text)).toBeTruthy();
    }

    // The total badge must include at least the 3 we seeded.
    const totalText = await card.getByText(/\d+\s+invites/i).first().innerText();
    const total = parseInt(totalText, 10);
    expect(total).toBeGreaterThanOrEqual(3);
  });
});
