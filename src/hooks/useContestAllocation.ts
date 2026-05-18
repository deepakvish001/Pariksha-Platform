// Client hook for Layer 1 question allocator. Calls the edge function with
// signed transport headers when available and exposes the per-candidate
// ordering + variant assignments to the player.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signContestFunctionCall } from "@/hooks/useContestSessionSigner";

export interface AllocationProblem {
  problem_slug: string;
  points: number;
}

export interface AllocationAssignment {
  problem_slug: string;
  variant_id: string;
  variant_key: string;
}

interface AllocationState {
  loading: boolean;
  error: string | null;
  problems: AllocationProblem[];
  assignments: AllocationAssignment[];
}

const INITIAL: AllocationState = {
  loading: false,
  error: null,
  problems: [],
  assignments: [],
};

export function useContestAllocation(sessionId: string | null | undefined) {
  const [state, setState] = useState<AllocationState>(INITIAL);

  const allocate = useCallback(async () => {
    if (!sessionId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const body = { sessionId };
      const headers = await signContestFunctionCall("contest-question-allocator", body);
      const { data, error } = await supabase.functions.invoke("contest-question-allocator", {
        body,
        headers: headers ?? undefined,
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error ?? "Allocation failed");
      setState({
        loading: false,
        error: null,
        problems: data.problems ?? [],
        assignments: data.assignments ?? [],
      });
    } catch (e) {
      setState({
        loading: false,
        error: e instanceof Error ? e.message : "Allocation failed",
        problems: [],
        assignments: [],
      });
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    void allocate();
  }, [sessionId, allocate]);

  return { ...state, refresh: allocate };
}
