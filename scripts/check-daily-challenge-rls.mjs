#!/usr/bin/env node
/**
 * Pre-build security guard for the daily challenge feature.
 * Run via `npm run check:rls` (and wired into `prebuild`).
 *
 * Verifies that the leaderboard RPC and protected tables are not
 * accessible to the anon key. Fails the build if any check fails.
 */
import { runDailyChallengeRlsChecks } from "../src/lib/security/dailyChallengeRlsChecks.ts";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ??
  "https://lvnpvfxlmzbnylwkvgnq.supabase.co";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bnB2ZnhsbXpibnlsd2t2Z25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODQwNjUsImV4cCI6MjA4NTc2MDA2NX0.hDu56RIXWloY5MilImp8hfhfSKv6bc-f5ud9P4ErA_s";

const results = await runDailyChallengeRlsChecks(SUPABASE_URL, ANON_KEY);

let allPassed = true;
for (const r of results) {
  const icon = r.passed ? "✅" : "❌";
  console.log(`${icon} ${r.name} — ${r.detail}`);
  if (!r.passed) allPassed = false;
}

if (!allPassed) {
  console.error(
    "\n❌ Daily challenge RLS/RPC anon-access checks FAILED. Build aborted.",
  );
  process.exit(1);
}
console.log("\n✅ Daily challenge RLS/RPC checks passed.");
