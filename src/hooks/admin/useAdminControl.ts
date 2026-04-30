import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// ───────── Dashboard
export const useAdminKpis = () =>
  useQuery({
    queryKey: ["admin-kpis"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_dashboard_kpis");
      if (error) throw error;
      return data as Record<string, number>;
    },
  });

export const useAdminTrendSubmissions = (days = 30) =>
  useQuery({
    queryKey: ["admin-trend-subs", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_trend_submissions", { _days: days });
      if (error) throw error;
      return (data ?? []) as { day: string; total: number; accepted: number }[];
    },
  });

export const useAdminTrendSignups = (days = 30) =>
  useQuery({
    queryKey: ["admin-trend-signups", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_trend_signups", { _days: days });
      if (error) throw error;
      return (data ?? []) as { day: string; signups: number }[];
    },
  });

// ───────── Users
export interface AdminUserRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  joined_at: string;
  last_active_at: string | null;
  total_xp: number | null;
  current_level: number | null;
  is_suspended: boolean;
  roles: string[];
}

export const useAdminUsers = (search = "", limit = 50, offset = 0) =>
  useQuery({
    queryKey: ["admin-users", search, limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users", {
        _search: search.trim() || null,
        _limit: limit,
        _offset: offset,
      });
      if (error) throw error;
      return (data ?? []) as AdminUserRow[];
    },
  });

const invalidateUsers = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["admin-users"] });
};

export const useGrantRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      const { error } = await supabase.rpc("admin_grant_role", { _user_id: userId, _role: role });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateUsers(qc);
      toast({ title: "Role granted" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

export const useRevokeRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      const { error } = await supabase.rpc("admin_revoke_role", { _user_id: userId, _role: role });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateUsers(qc);
      toast({ title: "Role revoked" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

export const useSuspendUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase.rpc("admin_suspend_user", { _user_id: userId, _reason: reason });
      if (error) throw error;
    },
    onSuccess: () => { invalidateUsers(qc); toast({ title: "User suspended" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

export const useUnsuspendUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_unsuspend_user", { _user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => { invalidateUsers(qc); toast({ title: "User reinstated" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

// ───────── Settings
export const usePlatformSettings = () =>
  useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_settings").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

export const useSetSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase.rpc("admin_set_setting", { _key: key, _value: value });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-settings"] });
      toast({ title: "Setting saved" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

// ───────── Daily Challenge schedule
export const useDailyChallengeSchedule = () =>
  useQuery({
    queryKey: ["dcs"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("admin_daily_challenge_schedule")
        .select("*")
        .gte("challenge_date", today)
        .order("challenge_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useScheduleDailyChallenge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, slug }: { date: string; slug: string }) => {
      const { error } = await supabase.rpc("admin_schedule_daily_challenge", {
        _date: date,
        _slug: slug,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dcs"] });
      toast({ title: "Daily challenge scheduled" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

// ───────── Broadcast
export const useBroadcast = () =>
  useMutation({
    mutationFn: async (input: {
      audience: { kind: "all" | "level" | "role" | "user"; min_level?: number; role?: string; user_id?: string };
      title: string;
      message: string;
      data?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.rpc("admin_broadcast_notification", {
        _audience: input.audience as any,
        _title: input.title,
        _message: input.message,
        _data: (input.data ?? {}) as any,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => toast({ title: "Broadcast sent", description: `${count} users notified.` }),
    onError: (e: any) => toast({ title: "Broadcast failed", description: e.message, variant: "destructive" }),
  });

// ───────── Reports
export const useReports = (status: string = "open") =>
  useQuery({
    queryKey: ["admin-reports", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_reports")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

export const useResolveReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "resolved" | "dismissed" }) => {
      const { error } = await supabase.rpc("admin_resolve_report", { _id: id, _new_status: status });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
      toast({ title: "Report updated" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

// ───────── AI content moderation
export const useAdminAIContent = (search = "") =>
  useQuery({
    queryKey: ["admin-ai-content", search],
    queryFn: async () => {
      let q = supabase
        .from("ai_generated_content")
        .select("id,user_id,content_type,title,topic,is_public,likes_count,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

export const useToggleAIContentPublic = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const { error } = await supabase.rpc("admin_set_ai_content_visibility", {
        _id: id,
        _is_public: isPublic,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ai-content"] });
      toast({ title: "Visibility updated" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteAIContent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("admin_delete_ai_content", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ai-content"] });
      toast({ title: "Content deleted" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};
