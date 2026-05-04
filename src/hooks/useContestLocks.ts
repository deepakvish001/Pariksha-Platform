import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns lock state for auxiliary contest materials (notes, hints, my
 * solution, run history). While a registered participant is in a live
 * contest, all four are locked and unlock as soon as the contest ends.
 * Non-participants and visitors see no lock.
 */
export function useContestLocks(contestId: string | undefined) {
  const { user } = useAuth();
  const [locked, setLocked] = useState<boolean>(!!contestId);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!contestId);

  useEffect(() => {
    if (!contestId) {
      setLocked(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: aux }, { data: contest }] = await Promise.all([
        supabase.rpc("contest_aux_unlocked" as never, { _contest_id: contestId } as never),
        supabase.from("contests").select("ends_at").eq("id", contestId).maybeSingle(),
      ]);
      if (cancelled) return;
      const unlocked = (aux as unknown as boolean) ?? true;
      setLocked(!unlocked);
      setEndsAt((contest as { ends_at?: string } | null)?.ends_at ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [contestId, user?.id]);

  return {
    loading,
    notesLocked: locked,
    solutionLocked: locked,
    hintsLocked: locked,
    historyLocked: locked,
    endsAt,
  };
}
