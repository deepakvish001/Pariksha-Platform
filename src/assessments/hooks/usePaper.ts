import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PaperOption = { id: string; body: string; order_index: number };
export type PaperQuestionType =
  | "coding" | "mcq" | "sql" | "subjective"
  | "true_false" | "short_answer" | "matching"
  | "numerical" | "fill_blanks";
export type PaperQuestion = {
  id: string;
  type: PaperQuestionType;
  title: string;
  body_md: string | null;
  language: string | null;
  starter_code: string | null;
  points: number;
  order_index: number;
  options?: PaperOption[] | null;
  sample_tests?: { input: string; expected_output: string }[] | null;
  meta?: Record<string, unknown> | null;
};
export type PaperSection = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  questions: PaperQuestion[];
};
export type Paper = {
  attempt: {
    id: string;
    assessment_id: string;
    started_at: string;
    submitted_at: string | null;
    status: string;
    score: number | null;
  };
  assessment: {
    id: string;
    title: string;
    description: string | null;
    duration_min: number;
    proctoring_enabled: boolean;
    proctoring_config?: Record<string, unknown> | null;
  };
  sections: PaperSection[];
};

export function usePaper(attemptId?: string) {
  return useQuery({
    queryKey: ["paper", attemptId],
    enabled: !!attemptId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Paper> => {
      const { data, error } = await supabase.rpc("get_attempt_paper", { _attempt: attemptId! });
      if (error) throw error;
      return data as unknown as Paper;
    },
  });
}

export function useExistingAnswers(attemptId?: string) {
  return useQuery({
    queryKey: ["answers", attemptId],
    enabled: !!attemptId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attempt_answers")
        .select("question_id, answer")
        .eq("attempt_id", attemptId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveAnswer() {
  return useMutation({
    mutationFn: async (input: { attempt_id: string; question_id: string; answer: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("attempt_answers")
        .upsert(
          { attempt_id: input.attempt_id, question_id: input.question_id, answer: input.answer as never },
          { onConflict: "attempt_id,question_id" }
        );
      if (error) throw error;
    },
  });
}

export function useSubmitAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attemptId: string) => {
      const { data, error } = await supabase.rpc("submit_attempt", { _attempt: attemptId });
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, attemptId) => {
      qc.invalidateQueries({ queryKey: ["attempt", attemptId] });
      qc.invalidateQueries({ queryKey: ["paper", attemptId] });
    },
  });
}
