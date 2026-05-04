import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logContestLockEvent } from "@/lib/contestTelemetry";

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

export type RunsSort = "newest" | "oldest" | "best_score";

export interface PagedRunsParams {
  page: number;
  pageSize: number;
  search?: string;
  language?: string;
  /** Inclusive lower bound on created_at (YYYY-MM-DD, local). */
  dateFrom?: string;
  /** Inclusive upper bound on created_at (YYYY-MM-DD, local; end-of-day). */
  dateTo?: string;
  sort?: RunsSort;
}

import { __dateBounds } from "./useCodingSubmissions";

export const usePagedCodeRuns = ({
  page,
  pageSize,
  search,
  language,
  dateFrom,
  dateTo,
  sort = "newest",
}: PagedRunsParams) => {
  const { user } = useAuth();
  const [runs, setRuns] = useState<CodeRunRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(async () => {
    if (!user) {
      setRuns([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let q = supabase
      .from("code_runs")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    // For runs "best score" approximates as Accepted-status first, then fastest runtime.
    if (sort === "best_score") {
      q = q
        .order("status", { ascending: true, nullsFirst: false })
        .order("time_ms", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
    } else if (sort === "oldest") {
      q = q.order("created_at", { ascending: true });
    } else {
      q = q.order("created_at", { ascending: false });
    }

    q = q.range(from, to);

    if (language && language !== "all") q = q.eq("language", language);
    const fromIso = __dateBounds.startOfDayIso(dateFrom);
    const toIso = __dateBounds.endOfDayIso(dateTo);
    if (fromIso) q = q.gte("created_at", fromIso);
    if (toIso) q = q.lte("created_at", toIso);
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      q = q.or(`problem_slug.ilike.${term},source_code.ilike.${term},status.ilike.${term}`);
    }
    const { data, error, count } = await q;
    if (!error && data) {
      setRuns(data as CodeRunRow[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [user, page, pageSize, search, language, dateFrom, dateTo, sort]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return { runs, total, loading, refetch: fetchPage };
};
