import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type QuestionType =
  | "coding"
  | "mcq"
  | "sql"
  | "subjective"
  | "true_false"
  | "matching"
  | "short_answer"
  | "numerical"
  | "fill_blanks";

export type QuestionTier = "free" | "premium";

export type Question = {
  id: string;
  org_id: string | null;
  type: QuestionType;
  title: string;
  body_md: string | null;
  language: string | null;
  starter_code: string | null;
  points: number;
  meta: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
  tier: QuestionTier;
  is_global: boolean;
};

export type McqOption = {
  id: string;
  question_id: string;
  body: string;
  is_correct: boolean;
  order_index: number;
};

export type TestCase = {
  id: string;
  question_id: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
  weight: number;
  order_index: number;
};

export function useQuestions(orgId?: string, type?: QuestionType) {
  return useQuery({
    queryKey: ["b2b", "questions", orgId, type ?? "all"],
    enabled: !!orgId,
    queryFn: async (): Promise<Question[]> => {
      let q = supabase.from("questions").select("*").eq("org_id", orgId!).order("created_at", { ascending: false });
      if (type) q = q.eq("type", type);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Question[];
    },
  });
}

export function useQuestion(id?: string) {
  return useQuery({
    queryKey: ["b2b", "question", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Question | null;
    },
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      org_id: string;
      type: QuestionType;
      title: string;
      body_md?: string;
      language?: string;
      starter_code?: string;
      points?: number;
      meta?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("questions")
        .insert({
          org_id: input.org_id,
          type: input.type,
          title: input.title,
          body_md: input.body_md ?? null,
          language: input.language ?? null,
          starter_code: input.starter_code ?? null,
          points: input.points ?? 10,
          meta: (input.meta ?? {}) as never,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as Question;
    },
    onSuccess: (q) => {
      qc.invalidateQueries({ queryKey: ["b2b", "questions", q.org_id] });
    },
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Question> }) => {
      const { data, error } = await supabase
        .from("questions")
        .update(patch as never)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Question;
    },
    onSuccess: (q) => {
      qc.invalidateQueries({ queryKey: ["b2b", "question", q.id] });
      qc.invalidateQueries({ queryKey: ["b2b", "questions", q.org_id] });
    },
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, org_id }: { id: string; org_id: string }) => {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
      return { id, org_id };
    },
    onSuccess: ({ org_id }) => qc.invalidateQueries({ queryKey: ["b2b", "questions", org_id] }),
  });
}

// MCQ options
export function useMcqOptions(questionId?: string) {
  return useQuery({
    queryKey: ["b2b", "mcq-options", questionId],
    enabled: !!questionId,
    queryFn: async (): Promise<McqOption[]> => {
      const { data, error } = await supabase
        .from("mcq_options")
        .select("*")
        .eq("question_id", questionId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as McqOption[];
    },
  });
}

export function useUpsertMcqOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<McqOption> & { question_id: string; body: string }) => {
      if (input.id) {
        const { data, error } = await supabase
          .from("mcq_options")
          .update({ body: input.body, is_correct: input.is_correct, order_index: input.order_index })
          .eq("id", input.id)
          .select("*")
          .single();
        if (error) throw error;
        return data as McqOption;
      }
      const { data, error } = await supabase
        .from("mcq_options")
        .insert({
          question_id: input.question_id,
          body: input.body,
          is_correct: input.is_correct ?? false,
          order_index: input.order_index ?? 0,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as McqOption;
    },
    onSuccess: (o) => qc.invalidateQueries({ queryKey: ["b2b", "mcq-options", o.question_id] }),
  });
}

export function useDeleteMcqOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, question_id }: { id: string; question_id: string }) => {
      const { error } = await supabase.from("mcq_options").delete().eq("id", id);
      if (error) throw error;
      return { id, question_id };
    },
    onSuccess: ({ question_id }) => qc.invalidateQueries({ queryKey: ["b2b", "mcq-options", question_id] }),
  });
}

// Test cases
export function useTestCases(questionId?: string) {
  return useQuery({
    queryKey: ["b2b", "test-cases", questionId],
    enabled: !!questionId,
    queryFn: async (): Promise<TestCase[]> => {
      const { data, error } = await supabase
        .from("question_test_cases")
        .select("*")
        .eq("question_id", questionId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TestCase[];
    },
  });
}

export function useUpsertTestCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<TestCase> & { question_id: string }) => {
      if (input.id) {
        const { data, error } = await supabase
          .from("question_test_cases")
          .update({
            input: input.input,
            expected_output: input.expected_output,
            is_hidden: input.is_hidden,
            weight: input.weight,
            order_index: input.order_index,
          })
          .eq("id", input.id)
          .select("*")
          .single();
        if (error) throw error;
        return data as TestCase;
      }
      const { data, error } = await supabase
        .from("question_test_cases")
        .insert({
          question_id: input.question_id,
          input: input.input ?? "",
          expected_output: input.expected_output ?? "",
          is_hidden: input.is_hidden ?? true,
          weight: input.weight ?? 1,
          order_index: input.order_index ?? 0,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as TestCase;
    },
    onSuccess: (t) => qc.invalidateQueries({ queryKey: ["b2b", "test-cases", t.question_id] }),
  });
}

export function useDeleteTestCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, question_id }: { id: string; question_id: string }) => {
      const { error } = await supabase.from("question_test_cases").delete().eq("id", id);
      if (error) throw error;
      return { id, question_id };
    },
    onSuccess: ({ question_id }) => qc.invalidateQueries({ queryKey: ["b2b", "test-cases", question_id] }),
  });
}
