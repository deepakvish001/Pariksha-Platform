import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface AdminProblemRow {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string[];
  is_published: boolean;
  updated_at: string;
}

export interface FullProblemPayload {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string[];
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  hints: string[];
  cpu_time_limit_sec?: number;
  memory_limit_kb?: number;
  is_published: boolean;
  starter_code: Record<string, string>;
  reference_solution: Record<string, string>;
  sample_tests: { input: string; expected: string }[];
  hidden_tests: { input: string; expected: string }[];
  sql_spec?: {
    schema_sql: string;
    seed_sql: string;
    reference_query: string;
    order_matters: boolean;
    starter: string;
  } | null;
}

export const useAdminProblems = (search = "") => {
  return useQuery({
    queryKey: ["admin-problems", search],
    queryFn: async (): Promise<AdminProblemRow[]> => {
      let q = supabase
        .from("coding_problems")
        .select("slug,title,difficulty,topics,is_published,updated_at")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (search.trim()) {
        q = q.ilike("title", `%${search.trim()}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AdminProblemRow[];
    },
  });
};

export const useAdminProblem = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["admin-problem", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_full_problem", {
        _slug: slug!,
      });
      if (error) throw error;
      return data as any;
    },
  });
};

export const useSaveProblem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FullProblemPayload) => {
      const { data, error } = await supabase.rpc("admin_save_problem", {
        payload: payload as any,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-problems"] });
      qc.invalidateQueries({ queryKey: ["admin-problem", vars.slug] });
      toast({ title: "Saved", description: `Problem "${vars.slug}" saved.` });
    },
    onError: (err: any) => {
      toast({
        title: "Save failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProblem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase
        .from("coding_problems")
        .delete()
        .eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-problems"] });
      toast({ title: "Deleted", description: "Problem removed." });
    },
    onError: (err: any) => {
      toast({
        title: "Delete failed",
        description: err?.message,
        variant: "destructive",
      });
    },
  });
};

export const useTogglePublish = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, publish }: { slug: string; publish: boolean }) => {
      const { error } = await supabase
        .from("coding_problems")
        .update({ is_published: publish })
        .eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-problems"] });
    },
  });
};

export const useDuplicateProblem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string): Promise<string> => {
      const { data: full, error: getErr } = await supabase.rpc(
        "admin_get_full_problem",
        { _slug: slug },
      );
      if (getErr) throw getErr;
      const f = full as any;
      if (!f?.problem) throw new Error("Source problem not found");
      const base = f.problem.slug;
      // Find a free slug: <base>-copy, <base>-copy-2, ...
      const { data: existing } = await supabase
        .from("coding_problems")
        .select("slug")
        .ilike("slug", `${base}-copy%`);
      const taken = new Set((existing ?? []).map((r: any) => r.slug));
      let candidate = `${base}-copy`;
      let n = 2;
      while (taken.has(candidate)) candidate = `${base}-copy-${n++}`;

      const payload = {
        slug: candidate,
        title: `${f.problem.title} (Copy)`,
        difficulty: f.problem.difficulty,
        topics: f.problem.topics ?? [],
        description: f.problem.description ?? "",
        examples: f.problem.examples ?? [],
        constraints: f.problem.constraints ?? [],
        hints: f.problem.hints ?? [],
        cpu_time_limit_sec: Number(f.problem.cpu_time_limit_sec ?? 2),
        memory_limit_kb: f.problem.memory_limit_kb ?? 256000,
        is_published: false,
        starter_code: f.starter_code ?? {},
        reference_solution: f.reference_solution ?? {},
        sample_tests: f.sample_tests ?? [],
        hidden_tests: f.hidden_tests ?? [],
        sql_spec: f.sql_spec ?? null,
      };
      const { error: saveErr } = await supabase.rpc("admin_save_problem", {
        payload: payload as any,
      });
      if (saveErr) throw saveErr;
      return candidate;
    },
    onSuccess: (newSlug) => {
      qc.invalidateQueries({ queryKey: ["admin-problems"] });
      toast({
        title: "Duplicated",
        description: `Created draft "${newSlug}".`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Duplicate failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });
};

export const useAuditLog = () => {
  return useQuery({
    queryKey: ["admin-audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("id,actor_id,action,entity_type,entity_slug,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
};
