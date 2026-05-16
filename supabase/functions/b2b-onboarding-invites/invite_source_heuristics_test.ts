/**
 * Unit + integration tests for the assessment_invites.source heuristic backfill.
 *
 * Calls the public.test_invite_source_heuristics() RPC, which:
 *   - runs the pure inference helper against fixture inputs (unit)
 *   - seeds real assessment_invites rows with source = NULL, runs the
 *     backfill, asserts results, and rolls everything back via a
 *     self-aborting subtransaction (integration)
 *
 * Particular focus per the task: verify bulk_upload vs manual heuristics.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SERVICE_ROLE_KEY") ??
  "";

if (!SERVICE_KEY) {
  console.warn(
    "[invite_source_heuristics_test] SUPABASE_SERVICE_ROLE_KEY not set — " +
      "skipping. The RPC requires an authenticated session.",
  );
}

type TestCase = {
  kind: "unit" | "integration";
  label: string;
  expected?: string;
  actual?: string;
  pass: boolean;
};
type Report = {
  passed: number;
  failed: number;
  unit: TestCase[];
  integration: TestCase[];
};

async function runReport(): Promise<Report> {
  const client = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await client.rpc("test_invite_source_heuristics");
  if (error) throw new Error(`RPC failed: ${error.message}`);
  return data as Report;
}

Deno.test({
  name: "invite source heuristic: all unit + integration cases pass",
  ignore: !SERVICE_KEY,
  fn: async () => {
    const report = await runReport();
    const failures = [...report.unit, ...report.integration].filter(
      (c) => !c.pass,
    );
    if (failures.length) {
      console.error("Failing cases:", JSON.stringify(failures, null, 2));
    }
    assertEquals(report.failed, 0, "no heuristic cases should fail");
    assert(report.passed > 0, "at least one case should run");
  },
});

Deno.test({
  name: "invite source heuristic: bulk_upload vs manual specifically",
  ignore: !SERVICE_KEY,
  fn: async () => {
    const report = await runReport();
    const all = [...report.unit, ...report.integration];

    // bulk_upload must be assigned whenever external_id is present (and not
    // an api_/api: prefix), regardless of name/email.
    const bulkCases = all.filter((c) =>
      c.expected === "bulk_upload" && c.label.includes("bulk_upload"),
    );
    assert(bulkCases.length >= 3, "expected several bulk_upload cases");
    for (const c of bulkCases) {
      assertEquals(c.actual, "bulk_upload", `bulk_upload case "${c.label}"`);
    }

    // manual must only fire when name is present AND email is NULL AND no
    // external_id — exercised in the unit test (integration table forbids
    // NULL email).
    const manual = all.find((c) => c.expected === "manual");
    assert(manual, "expected a manual heuristic case");
    assertEquals(manual!.actual, "manual");
  },
});
