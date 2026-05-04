import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves (and lazily assigns) the variant a participant should solve for
 * a given (contest, problem) pair. Calls the deterministic
 * `assign_contest_variant` RPC server-side which is idempotent — a user
 * always gets the same variant on retry.
 */
export function useContestProblemVariant(contestId: string | undefined, problemSlug: string | undefined) {
  return useQuery({
    queryKey: ["contest-variant", contestId, problemSlug],
    enabled: !!contestId && !!problemSlug,
    queryFn: async () => {
      // First check if there are any variants configured at all.
      const { count, error: cntErr } = await supabase
        .from("contest_problem_variants")
        .select("id", { head: true, count: "exact" })
        .eq("contest_id", contestId!)
        .eq("problem_slug", problemSlug!);
      if (cntErr) throw cntErr;
      if (!count) return null;

      // Assign (or reuse) the user's variant.
      const { data: assignment, error: aErr } = await supabase.rpc("assign_contest_variant", {
        _contest_id: contestId!,
        _problem_slug: problemSlug!,
      });
      if (aErr) throw aErr;

      // assignment is a contest_user_variants row; load the variant content.
      const variantId = (assignment as { variant_id?: string } | null)?.variant_id;
      if (!variantId) return null;

      const { data: variant, error: vErr } = await supabase
        .from("contest_problem_variants")
        .select("id, variant_key, title, statement_md, weight")
        .eq("id", variantId)
        .single();
      if (vErr) throw vErr;
      return variant;
    },
    staleTime: Infinity,
    retry: 1,
  });
}
