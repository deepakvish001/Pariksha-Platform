import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type QuestionStatusHistoryRow = {
  id: string;
  question_id: string;
  org_id: string;
  status: "draft" | "published";
  changed_by: string | null;
  changed_at: string;
  note: string | null;
};

export function useQuestionStatusHistory(questionId: string | undefined) {
  return useQuery({
    queryKey: ["b2b", "question-status-history", questionId],
    enabled: !!questionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_status_history")
        .select("*")
        .eq("question_id", questionId!)
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as QuestionStatusHistoryRow[];
    },
  });
}
