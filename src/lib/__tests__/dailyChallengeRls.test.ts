import { describe, it, expect } from "vitest";
import { runDailyChallengeRlsChecks } from "@/lib/security/dailyChallengeRlsChecks";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://lvnpvfxlmzbnylwkvgnq.supabase.co";
const ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bnB2ZnhsbXpibnlsd2t2Z25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODQwNjUsImV4cCI6MjA4NTc2MDA2NX0.hDu56RIXWloY5MilImp8hfhfSKv6bc-f5ud9P4ErA_s";

describe("Daily challenge RLS / RPC anon-access guard", () => {
  it("blocks anon access to leaderboard RPC and protected tables", async () => {
    const results = await runDailyChallengeRlsChecks(SUPABASE_URL, ANON_KEY);
    const failed = results.filter((r) => !r.passed);
    if (failed.length > 0) {
      console.error("RLS check failures:\n" + failed.map((f) => `  - ${f.name}: ${f.detail}`).join("\n"));
    }
    expect(failed).toEqual([]);
  }, 20_000);
});
