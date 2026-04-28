import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CodeSubmissionRow {
  id: string;
  problem_slug: string;
  language: string;
  language_id: number;
  source_code: string;
  verdict: string;
  runtime_ms: number | null;
  memory_kb: number | null;
  passed_tests: number;
  total_tests: number;
  failing_case: any;
  stderr: string | null;
  created_at: string;
}

export const useCodingSubmissions = (problemSlug?: string) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<CodeSubmissionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    if (!user) {
      setSubmissions([]);
      return;
    }
    setLoading(true);
    let q = supabase
      .from("code_submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (problemSlug) q = q.eq("problem_slug", problemSlug);
    const { data, error } = await q;
    if (!error && data) setSubmissions(data as CodeSubmissionRow[]);
    setLoading(false);
  }, [user, problemSlug]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { submissions, loading, refetch: fetchSubmissions };
};

export interface PagedSubmissionsParams {
  page: number;
  pageSize: number;
  search?: string;
  verdict?: string;
  language?: string;
}

export const usePagedCodingSubmissions = ({
  page,
  pageSize,
  search,
  verdict,
  language,
}: PagedSubmissionsParams) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<CodeSubmissionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(async () => {
    if (!user) {
      setSubmissions([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let q = supabase
      .from("code_submissions")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (verdict && verdict !== "all") q = q.eq("verdict", verdict);
    if (language && language !== "all") q = q.eq("language", language);
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      q = q.or(`problem_slug.ilike.${term},source_code.ilike.${term}`);
    }
    const { data, error, count } = await q;
    if (!error && data) {
      setSubmissions(data as CodeSubmissionRow[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [user, page, pageSize, search, verdict, language]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return { submissions, total, loading, refetch: fetchPage };
};

export const useUserSolvedSlugs = () => {
  const { user } = useAuth();
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [attempted, setAttempted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setSolved(new Set());
      setAttempted(new Set());
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("code_submissions")
        .select("problem_slug, verdict")
        .eq("user_id", user.id);
      if (data) {
        const s = new Set<string>();
        const a = new Set<string>();
        for (const row of data) {
          a.add(row.problem_slug);
          if (row.verdict === "Accepted") s.add(row.problem_slug);
        }
        setSolved(s);
        setAttempted(a);
      }
    })();
  }, [user]);

  return { solved, attempted };
};
