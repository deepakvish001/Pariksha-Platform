/**
 * Anon-access guard for proctoring tables.
 *
 * Proctoring evidence (snapshots + AI findings) must only be visible to org
 * members with proctor permissions. This test confirms the public anon role
 * — which is what a recruiter/viewer hitting the API without a proctor
 * membership effectively becomes for proctoring data — cannot read any rows.
 */
import { describe, it, expect } from "vitest";
import { runProctoringRlsChecks } from "@/lib/security/proctoringRlsChecks";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://lvnpvfxlmzbnylwkvgnq.supabase.co";
const ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bnB2ZnhsbXpibnlsd2t2Z25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODQwNjUsImV4cCI6MjA4NTc2MDA2NX0.hDu56RIXWloY5MilImp8hfhfSKv6bc-f5ud9P4ErA_s";

describe("Proctoring RLS – anon-access guard", () => {
  it("blocks anon reads on snapshots and findings (assessment + contest)", async () => {
    const results = await runProctoringRlsChecks(SUPABASE_URL, ANON_KEY);
    const failed = results.filter((r) => !r.passed);
    if (failed.length > 0) {
      console.error(
        "Proctoring RLS check failures:\n" +
          failed.map((f) => `  - ${f.name}: ${f.detail}`).join("\n"),
      );
    }
    expect(failed).toEqual([]);
  }, 20_000);
});
