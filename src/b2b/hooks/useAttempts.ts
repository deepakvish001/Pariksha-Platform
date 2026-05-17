import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isUuid } from "@/lib/routing/slug";

export type AttemptRow = {
  id: string;
  slug: string | null;
  assessment_id: string;
  user_id: string;
  invite_id: string | null;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  integrity_score: number;
  status: "in_progress" | "submitted" | "auto_submitted" | "abandoned";
  invite?: { email: string; name: string | null; external_id: string | null } | null;
};

export function useAttempts(assessmentId?: string) {
  return useQuery({
    queryKey: ["b2b", "attempts", assessmentId],
    enabled: !!assessmentId,
    queryFn: async (): Promise<AttemptRow[]> => {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("*, invite:assessment_invites(email,name,external_id)")
        .eq("assessment_id", assessmentId!)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AttemptRow[];
    },
  });
}

export type AttemptDetail = {
  attempt: AttemptRow;
  assessment: { id: string; slug: string | null; title: string; duration_min: number };
  answers: Array<{
    id: string;
    question_id: string;
    answer: Record<string, unknown>;
    auto_score: number | null;
    manual_score: number | null;
    question: {
      id: string;
      type: "coding" | "mcq" | "sql" | "subjective" | "true_false" | "short_answer" | "matching";
      title: string;
      body_md: string | null;
      language: string | null;
      points: number;
      meta: Record<string, unknown> | null;
      mcq_options?: { id: string; body: string; is_correct: boolean; order_index: number }[];
      question_test_cases?: { input: string; expected_output: string; is_hidden: boolean; order_index: number }[];
    };
  }>;
};

/** Accepts either the attempt UUID or its slug (unique within its assessment). */
export function useAttemptDetail(attemptIdOrSlug?: string, assessmentId?: string) {
  return useQuery({
    queryKey: ["b2b", "attempt-detail", attemptIdOrSlug, assessmentId ?? null],
    enabled: !!attemptIdOrSlug,
    queryFn: async (): Promise<AttemptDetail> => {
      const key = attemptIdOrSlug!;
      let q = supabase
        .from("assessment_attempts")
        .select(
          "*, invite:assessment_invites(email,name,external_id), assessment:assessments(id,slug,title,duration_min)",
        );
      if (isUuid(key)) {
        q = q.eq("id", key);
      } else {
        q = q.eq("slug", key);
        if (assessmentId) q = q.eq("assessment_id", assessmentId);
      }
      const { data: attempt, error: e1 } = await q.maybeSingle();
      if (e1) throw e1;
      if (!attempt) throw new Error("Attempt not found");

      const { data: answers, error: e2 } = await supabase
        .from("attempt_answers")
        .select(
          "id, question_id, answer, auto_score, manual_score, question:questions(id,type,title,body_md,language,points,meta, mcq_options(id,body,is_correct,order_index), question_test_cases(input,expected_output,is_hidden,order_index))"
        )
        .eq("attempt_id", (attempt as any).id);
      if (e2) throw e2;

      const a: any = attempt;
      return {
        attempt: a,
        assessment: a.assessment,
        answers: (answers ?? []) as any,
      };
    },
  });
}

export function useAttemptEvents(attemptId?: string) {
  return useQuery({
    queryKey: ["b2b", "attempt-events", attemptId],
    enabled: !!attemptId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attempt_events")
        .select("id, kind, payload, created_at")
        .eq("attempt_id", attemptId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGradeAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; manual_score: number | null; attempt_id: string }) => {
      const { error } = await supabase
        .from("attempt_answers")
        .update({ manual_score: input.manual_score })
        .eq("id", input.id);
      if (error) throw error;
      return input;
    },
    onSuccess: ({ attempt_id }) => {
      qc.invalidateQueries({ queryKey: ["b2b", "attempt-detail", attempt_id] });
    },
  });
}

export function useFinalizeAttemptScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { attempt_id: string; total: number }) => {
      const { error } = await supabase
        .from("assessment_attempts")
        .update({ score: input.total })
        .eq("id", input.attempt_id);
      if (error) throw error;
    },
    onSuccess: (_v, { attempt_id }) => {
      qc.invalidateQueries({ queryKey: ["b2b", "attempt-detail", attempt_id] });
      qc.invalidateQueries({ queryKey: ["b2b", "attempts"] });
    },
  });
}
