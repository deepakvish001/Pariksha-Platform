import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// ───────── User detail (drawer)
export interface AdminUserDetail {
  profile: any;
  roles: string[];
  achievements: { achievement_id: string; earned_at: string }[];
  xp_recent: { id: string; amount: number; source: string; description: string | null; created_at: string }[];
  recent_submissions: { id: string; problem_slug: string; verdict: string; language: string; created_at: string }[];
  audit_actions: { id: string; action: string; entity_type: string | null; entity_slug: string | null; created_at: string }[];
}

export const useAdminUserDetail = (userId: string | null) =>
  useQuery({
    queryKey: ["admin-user-detail", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_user_detail", { _user_id: userId });
      if (error) throw error;
      return data as AdminUserDetail;
    },
  });

export const useAdjustXp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      const { error } = await (supabase.rpc as any)("admin_adjust_xp", {
        _user_id: userId, _amount: amount, _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-user-detail", vars.userId] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "XP adjusted" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

export const useGrantAchievement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, achievementId }: { userId: string; achievementId: string }) => {
      const { error } = await (supabase.rpc as any)("admin_grant_achievement", {
        _user_id: userId, _achievement_id: achievementId,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-user-detail", vars.userId] });
      qc.invalidateQueries({ queryKey: ["admin-achievement-stats"] });
      toast({ title: "Achievement granted" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

export const useRevokeAchievement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, achievementId }: { userId: string; achievementId: string }) => {
      const { error } = await (supabase.rpc as any)("admin_revoke_achievement", {
        _user_id: userId, _achievement_id: achievementId,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-user-detail", vars.userId] });
      qc.invalidateQueries({ queryKey: ["admin-achievement-stats"] });
      toast({ title: "Achievement revoked" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

// ───────── Achievements admin
export const useAchievementStats = () =>
  useQuery({
    queryKey: ["admin-achievement-stats"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_achievement_stats");
      if (error) throw error;
      return (data ?? []) as { achievement_id: string; earned_count: number; last_earned: string | null }[];
    },
  });

export const useRecomputeAchievements = () =>
  useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await (supabase.rpc as any)("admin_recompute_achievements", { _user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => toast({ title: "Recomputed achievements" }),
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

// ───────── Leaderboards admin
export const useAdminLeaderboard = (window: "all" | "week" = "all", limit = 100) =>
  useQuery({
    queryKey: ["admin-leaderboard", window, limit],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_leaderboard_top", {
        _window: window, _limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        user_id: string; full_name: string | null; username: string | null; avatar_url: string | null;
        total_xp: number; xp_this_week: number; current_level: number; leaderboard_hidden: boolean;
      }>;
    },
  });

export const useToggleLeaderboardHidden = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, hidden }: { userId: string; hidden: boolean }) => {
      const { error } = await (supabase.rpc as any)("admin_set_leaderboard_hidden", {
        _user_id: userId, _hidden: hidden,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-leaderboard"] });
      toast({ title: "Visibility updated" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

export const useForceSnapshotLeaderboard = () =>
  useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_force_snapshot_leaderboard");
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => toast({ title: "Snapshot created", description: `${count} rows inserted.` }),
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

// ───────── Gamification rules
export interface GamificationRules {
  xp_per_quiz_correct?: number;
  xp_per_problem_easy?: number;
  xp_per_problem_medium?: number;
  xp_per_problem_hard?: number;
  xp_per_srs_review?: number;
  level_xp_multiplier?: number;
  daily_xp_cap?: number;
}

export const useGamificationRules = () =>
  useQuery({
    queryKey: ["admin-gamification-rules"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_get_gamification_rules");
      if (error) throw error;
      // returns { 'gamification.xp_per_quiz_correct': 10, ... }
      const raw = (data ?? {}) as Record<string, any>;
      const out: Record<string, any> = {};
      Object.entries(raw).forEach(([k, v]) => {
        out[k.replace(/^gamification\./, "")] = v;
      });
      return out as GamificationRules;
    },
  });

export const useSetGamificationRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: keyof GamificationRules; value: number }) => {
      const { error } = await supabase.rpc("admin_set_setting", {
        _key: `gamification.${key}`,
        _value: value as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gamification-rules"] });
      toast({ title: "Rule saved" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};
