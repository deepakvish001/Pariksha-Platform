import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PRS {
  user_id: string;
  score: number;
  dsa_score: number;
  srs_score: number;
  contest_score: number;
  resume_score: number;
  consistency_score: number;
  level: string;
  breakdown: any;
  computed_at: string;
}

export function usePlacementReadiness(userId: string | undefined | null) {
  return useQuery({
    queryKey: ["prs", userId],
    enabled: !!userId,
    queryFn: async (): Promise<PRS | null> => {
      const { data, error } = await supabase
        .from("placement_readiness_scores" as any)
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error && (error as any).code !== "PGRST116") throw error;
      return (data as any) ?? null;
    },
  });
}

export function useRecomputePRS() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("compute-prs", { body: {} });
      if (error) throw error;
      return data?.prs as PRS;
    },
    onSuccess: (prs) => {
      qc.invalidateQueries({ queryKey: ["prs", prs?.user_id] });
      toast.success("Placement Readiness Score updated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to compute PRS"),
  });
}
