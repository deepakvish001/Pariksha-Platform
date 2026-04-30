import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface AuthEvent {
  id: string;
  created_at: string;
  action: string;
  ip_address: string;
  payload: any;
}

export const useRecentAuthEvents = (limit = 50) =>
  useQuery({
    queryKey: ["admin-auth-events", limit],
    queryFn: async (): Promise<AuthEvent[]> => {
      const { data, error } = await supabase.rpc("admin_recent_auth_events", { _limit: limit });
      if (error) throw error;
      return (data ?? []) as AuthEvent[];
    },
  });

export const useGrantAchievement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, achievement_id }: { user_id: string; achievement_id: string }) => {
      const { error } = await supabase.rpc("admin_grant_achievement", {
        _user_id: user_id,
        _achievement_id: achievement_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-achievements"] });
      toast({ title: "Achievement granted" });
    },
    onError: (e: any) =>
      toast({ title: "Grant failed", description: e?.message, variant: "destructive" }),
  });
};

export const useRecomputeAchievements = () =>
  useMutation({
    mutationFn: async (user_id: string) => {
      const { data, error } = await supabase.rpc("admin_recompute_achievements", {
        _user_id: user_id,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => toast({ title: "Recomputed", description: `Current: ${count}` }),
    onError: (e: any) =>
      toast({ title: "Recompute failed", description: e?.message, variant: "destructive" }),
  });
