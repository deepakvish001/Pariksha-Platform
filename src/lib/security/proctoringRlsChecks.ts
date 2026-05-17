/**
 * RLS guards for proctoring evidence.
 *
 * Verifies, using ONLY the public anon key, that anonymous (and by extension
 * non-proctor) callers cannot read sensitive proctoring data:
 *
 *  1. `assessment_proctor_snapshots`  – webcam/screen frames
 *  2. `assessment_proctor_findings`   – AI-generated findings
 *  3. `contest_proctor_snapshots`     – contest webcam/screen frames
 *  4. `contest_proctor_findings`      – contest AI findings
 *
 * The corresponding server-side policies use `can_view_proctoring(org_id)`
 * which restricts SELECT to org members with role `owner | admin | proctor`.
 * Anon callers fall outside that set, so all four reads must return 0 rows
 * (or an RLS error).
 */
import { createClient } from "@supabase/supabase-js";

export interface RlsCheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const PROTECTED_TABLES = [
  "assessment_proctor_snapshots",
  "assessment_proctor_findings",
  "contest_proctor_snapshots",
  "contest_proctor_findings",
] as const;

export const runProctoringRlsChecks = async (
  supabaseUrl: string,
  anonKey: string,
): Promise<RlsCheckResult[]> => {
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const results: RlsCheckResult[] = [];

  for (const table of PROTECTED_TABLES) {
    const { data, error } = await anon
      .from(table as never)
      .select("attempt_id" as never)
      .limit(1);
    const empty = !data || (Array.isArray(data) && data.length === 0);
    results.push({
      name: `Anon cannot read ${table}`,
      passed: empty || !!error,
      detail: error
        ? `error=${error.message}`
        : `rows=${(data as unknown[] | null)?.length ?? 0}`,
    });
  }

  return results;
};
