import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PerProblemStats {
  attempts: number;
  accepted: number;
  lastAttempt: string | null;
  solvedAt: string | null;
}

export interface CodingAttemptStats {
  solved: Set<string>;
  attempted: Set<string>;
  perProblem: Map<string, PerProblemStats>;
  loading: boolean;
}

export const useCodingAttemptStats = (): CodingAttemptStats => {
  const { user } = useAuth();
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [attempted, setAttempted] = useState<Set<string>>(new Set());
  const [perProblem, setPerProblem] = useState<Map<string, PerProblemStats>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setSolved(new Set());
      setAttempted(new Set());
      setPerProblem(new Map());
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("code_submissions")
        .select("problem_slug, verdict, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled || !data) {
        setLoading(false);
        return;
      }
      const s = new Set<string>();
      const a = new Set<string>();
      const map = new Map<string, PerProblemStats>();
      for (const row of data) {
        const slug = row.problem_slug as string;
        a.add(slug);
        const isAccepted = row.verdict === "Accepted";
        if (isAccepted) s.add(slug);
        const cur = map.get(slug) ?? {
          attempts: 0,
          accepted: 0,
          lastAttempt: null,
          solvedAt: null,
        };
        cur.attempts += 1;
        if (isAccepted) cur.accepted += 1;
        if (!cur.lastAttempt || row.created_at > cur.lastAttempt) {
          cur.lastAttempt = row.created_at as string;
        }
        if (isAccepted && (!cur.solvedAt || row.created_at < cur.solvedAt)) {
          cur.solvedAt = row.created_at as string;
        }
        map.set(slug, cur);
      }
      setSolved(s);
      setAttempted(a);
      setPerProblem(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { solved, attempted, perProblem, loading };
};
