import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface GamificationHistoryRow {
  id: string;
  rule_key: string;
  old_value: any;
  new_value: any;
  note: string | null;
  changed_by: string | null;
  changed_at: string;
  actor_name: string | null;
}

export const useGamificationHistory = (key?: string, limit = 50) =>
  useQuery({
    queryKey: ["admin-gamification-history", key ?? "all", limit],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_gamification_history", {
        _key: key ?? null,
        _limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as GamificationHistoryRow[];
    },
  });

export const useSetGamificationRuleWithNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value, note }: { key: string; value: number; note?: string }) => {
      const { error } = await (supabase.rpc as any)("admin_set_gamification_rule", {
        _key: key,
        _value: value as any,
        _note: note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gamification-rules"] });
      qc.invalidateQueries({ queryKey: ["admin-gamification-history"] });
      toast({ title: "Rule saved" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};
