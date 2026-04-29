// Read published coding problems from the DB-backed CMS.
// Additive helper: existing consumers can opt-in to load problems from DB
// without breaking the static `CODING_PROBLEMS` array fallback.
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

const buildProblem = (
  row: any,
  starter: any[],
  refSol: any[],
  sample: any[],
  sql: any | null,
): CodingProblem => {
  const starterCode: Partial<Record<LangId, string>> = {};
  starter.forEach((r) => (starterCode[r.lang_id as LangId] = r.code));
  const referenceSolution: Partial<Record<LangId, string>> = {};
  refSol.forEach((r) => (referenceSolution[r.lang_id as LangId] = r.code));
  const sampleTests: TestCase[] = sample.map((t) => ({
    input: t.input ?? "",
    expected: t.expected ?? "",
  }));
  return {
    slug: row.slug,
    title: row.title,
    difficulty: toDifficulty(row.difficulty),
    topics: row.topics ?? [],
    description: row.description ?? "",
    examples: Array.isArray(row.examples) ? row.examples : [],
    constraints: row.constraints ?? [],
    hints: row.hints ?? [],
    starterCode,
    referenceSolution,
    sampleTests,
    hiddenTests: [], // Hidden tests are admin-only; never exposed to clients.
    cpuTimeLimitSec: Number(row.cpu_time_limit_sec ?? 2),
    memoryLimitKb: row.memory_limit_kb ?? undefined,
    sql: sql
      ? {
          schema: sql.schema_sql ?? "",
          seed: sql.seed_sql ?? "",
          referenceQuery: sql.reference_query ?? "",
          orderMatters: !!sql.order_matters,
          starter: sql.starter ?? "",
        }
      : undefined,
  };
};

export const useDbCodingProblems = () => {
  return useQuery({
    queryKey: ["coding-problems-db"],
    staleTime: STALE_MS,
    queryFn: async (): Promise<CodingProblem[]> => {
      const { data: rows, error } = await supabase
        .from("coding_problems")
        .select(
          "slug,title,difficulty,topics,description,examples,constraints,hints,cpu_time_limit_sec,memory_limit_kb,is_published",
        )
        .eq("is_published", true)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const slugs = (rows ?? []).map((r) => r.slug);
      if (slugs.length === 0) return [];

      const [starter, refSol, sample, sql] = await Promise.all([
        supabase.from("coding_problem_starter_code").select("problem_slug,lang_id,code").in("problem_slug", slugs),
        supabase.from("coding_problem_reference_solutions").select("problem_slug,lang_id,code").in("problem_slug", slugs),
        supabase.from("coding_problem_tests").select("problem_slug,input,expected,ord,kind").eq("kind", "sample").in("problem_slug", slugs).order("ord", { ascending: true }),
        supabase.from("coding_problem_sql_specs").select("*").in("problem_slug", slugs),
      ]);

      const byStarter = new Map<string, any[]>();
      (starter.data ?? []).forEach((r: any) => {
        const arr = byStarter.get(r.problem_slug) ?? [];
        arr.push(r);
        byStarter.set(r.problem_slug, arr);
      });
      const byRef = new Map<string, any[]>();
      (refSol.data ?? []).forEach((r: any) => {
        const arr = byRef.get(r.problem_slug) ?? [];
        arr.push(r);
        byRef.set(r.problem_slug, arr);
      });
      const bySample = new Map<string, any[]>();
      (sample.data ?? []).forEach((r: any) => {
        const arr = bySample.get(r.problem_slug) ?? [];
        arr.push(r);
        bySample.set(r.problem_slug, arr);
      });
      const bySql = new Map<string, any>();
      (sql.data ?? []).forEach((r: any) => bySql.set(r.problem_slug, r));

      return (rows ?? []).map((r) =>
        buildProblem(
          r,
          byStarter.get(r.slug) ?? [],
          byRef.get(r.slug) ?? [],
          bySample.get(r.slug) ?? [],
          bySql.get(r.slug) ?? null,
        ),
      );
    },
  });
};
