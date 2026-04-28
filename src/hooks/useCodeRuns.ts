import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CodeRunRow {
  id: string;
  problem_slug: string;
  language: string;
  language_id: number;
  source_code: string;
  stdin: string;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: string | null;
  status_id: number | null;
  time_ms: number | null;
  memory_kb: number | null;
  created_at: string;
}

export const useCodeRuns = (problemSlug?: string) => {
  const { user } = useAuth();
  const [runs, setRuns] = useState<CodeRunRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRuns = useCallback(async () => {
    if (!user) {
      setRuns([]);
      return;
    }
    setLoading(true);
    let q = supabase
      .from("code_runs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (problemSlug) q = q.eq("problem_slug", problemSlug);
    const { data, error } = await q;
    if (!error && data) setRuns(data as CodeRunRow[]);
    setLoading(false);
  }, [user, problemSlug]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return { runs, loading, refetch: fetchRuns };
};
