// Read a single published coding problem from the DB-backed CMS.
// Falls back to nothing — callers should use the static helper as a fallback.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CodingProblem, LangId, TestCase } from "@/data/codingProblemsData";

const STALE_MS = 5 * 60 * 1000;

const toDifficulty = (d: string): CodingProblem["difficulty"] => {
  const v = (d || "").toLowerCase();
  if (v === "easy") return "Easy";
  if (v === "hard") return "Hard";
  return "Medium";
};

export const useDbCodingProblem = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["coding-problem-db", slug],
    enabled: !!slug,
    staleTime: STALE_MS,
    queryFn: async (): Promise<CodingProblem | null> => {
      const { data: row } = await supabase
        .from("coding_problems")
        .select(
          "slug,title,difficulty,topics,description,examples,constraints,hints,cpu_time_limit_sec,memory_limit_kb,is_published",
        )
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (!row) return null;

      const [starter, refSol, sample, sql] = await Promise.all([
        supabase.from("coding_problem_starter_code").select("lang_id,code").eq("problem_slug", slug!),
        supabase.from("coding_problem_reference_solutions").select("lang_id,code").eq("problem_slug", slug!),
        supabase.from("coding_problem_tests").select("input,expected,ord").eq("problem_slug", slug!).eq("kind", "sample").order("ord", { ascending: true }),
        supabase.from("coding_problem_sql_specs").select("*").eq("problem_slug", slug!).maybeSingle(),
      ]);

      const starterCode: Partial<Record<LangId, string>> = {};
      (starter.data ?? []).forEach((r: any) => (starterCode[r.lang_id as LangId] = r.code));
      const referenceSolution: Partial<Record<LangId, string>> = {};
      (refSol.data ?? []).forEach((r: any) => (referenceSolution[r.lang_id as LangId] = r.code));
      const sampleTests: TestCase[] = (sample.data ?? []).map((t: any) => ({
        input: t.input ?? "",
        expected: t.expected ?? "",
      }));

      return {
        slug: row.slug,
        title: row.title,
        difficulty: toDifficulty(row.difficulty),
        topics: row.topics ?? [],
        description: row.description ?? "",
        examples: Array.isArray(row.examples) ? (row.examples as any) : [],
        constraints: row.constraints ?? [],
        hints: row.hints ?? [],
        starterCode,
        referenceSolution,
        sampleTests,
        hiddenTests: [],
        cpuTimeLimitSec: Number(row.cpu_time_limit_sec ?? 2),
        memoryLimitKb: row.memory_limit_kb ?? undefined,
        sql: sql.data
          ? {
              schema: sql.data.schema_sql ?? "",
              seed: sql.data.seed_sql ?? "",
              referenceQuery: sql.data.reference_query ?? "",
              orderMatters: !!sql.data.order_matters,
              starter: sql.data.starter ?? "",
            }
          : undefined,
      };
    },
  });
};
