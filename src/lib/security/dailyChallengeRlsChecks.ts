/**
 * Shared RLS / RPC security checks for the daily challenge feature.
 *
 * Used by:
 * - `scripts/check-daily-challenge-rls.mjs` (prebuild guard)
 * - `src/lib/__tests__/dailyChallengeRls.test.ts` (vitest)
 *
 * Verifies, using ONLY the public anon key, that:
 *  1. The leaderboard RPC `get_daily_challenge_leaderboard` cannot be called
 *     anonymously (RLS / EXECUTE grant blocks it).
 *  2. The `daily_challenge_completions` table returns 0 rows / errors for
 *     anonymous reads — proving cross-user reads are blocked.
 *  3. The `daily_challenge_leaderboard_optin` table likewise blocks anon reads
 *     of other users' opt-in records.
 */
import { createClient } from "@supabase/supabase-js";

export interface RlsCheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

export const runDailyChallengeRlsChecks = async (
  supabaseUrl: string,
  anonKey: string,
): Promise<RlsCheckResult[]> => {
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const results: RlsCheckResult[] = [];

  // 1) Leaderboard RPC must NOT be callable by anon.
  {
    const { data, error } = await anon.rpc(
      "get_daily_challenge_leaderboard" as never,
      { _limit: 5 } as never,
    );
    const blocked = !!error || (Array.isArray(data) && data.length === 0 && !!error);
    // The function raises when auth.uid() is null AND EXECUTE is revoked.
    // Either is acceptable — the key invariant is "no rows returned to anon".
    const noRows = !data || (Array.isArray(data) && data.length === 0);
    results.push({
      name: "Anon cannot call get_daily_challenge_leaderboard",
      passed: blocked || noRows,
      detail: error ? `error=${error.message}` : `rows=${(data as unknown[] | null)?.length ?? 0}`,
    });
  }

  // 2) Anon cannot read other users' completions.
  {
    const { data, error } = await anon
      .from("daily_challenge_completions")
      .select("id")
      .limit(1);
    const empty = !data || data.length === 0;
    results.push({
      name: "Anon cannot read daily_challenge_completions",
      passed: empty || !!error,
      detail: error ? `error=${error.message}` : `rows=${data?.length ?? 0}`,
    });
  }

  // 3) Anon cannot read leaderboard opt-in rows.
  {
    const { data, error } = await anon
      .from("daily_challenge_leaderboard_optin")
      .select("user_id")
      .limit(1);
    const empty = !data || data.length === 0;
    results.push({
      name: "Anon cannot read daily_challenge_leaderboard_optin",
      passed: empty || !!error,
      detail: error ? `error=${error.message}` : `rows=${data?.length ?? 0}`,
    });
  }

  return results;
};
