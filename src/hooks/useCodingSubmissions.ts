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
