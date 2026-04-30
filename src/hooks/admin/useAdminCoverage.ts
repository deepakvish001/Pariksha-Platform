import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const rpc = supabase.rpc as any;

const ok = (title: string) => toast({ title });
const fail = (e: any) => toast({ title: "Failed", description: e?.message ?? String(e), variant: "destructive" });

// ───────── Notifications
export const useAdminNotifications = (userId: string | null = null, type: string | null = null, limit = 100) =>
  useQuery({
    queryKey: ["admin-notifications", userId, type, limit],
    queryFn: async () => {
      const { data, error } = await rpc("admin_list_notifications", {
        _user_id: userId, _type: type, _limit: limit, _offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

export const useSendAdminNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { userId: string; title: string; message: string; type?: string; data?: any }) => {
      const { error } = await rpc("admin_send_notification", {
        _user_id: vars.userId, _title: vars.title, _message: vars.message,
        _type: vars.type ?? "admin_message", _data: vars.data ?? {},
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-notifications"] }); ok("Notification sent"); },
    onError: fail,
  });
};

export const useAdminPushSubscriptions = (userId: string | null = null) =>
  useQuery({
    queryKey: ["admin-push-subs", userId],
    queryFn: async () => {
      const { data, error } = await rpc("admin_list_push_subscriptions", { _user_id: userId, _limit: 200 });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

// ───────── Quizzes
export const useAdminQuizAttempts = (userId: string | null = null, category: string | null = null, limit = 100) =>
  useQuery({
    queryKey: ["admin-quizzes", userId, category, limit],
    queryFn: async () => {
      const { data, error } = await rpc("admin_list_quiz_attempts", {
        _user_id: userId, _category: category, _limit: limit, _offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

export const useAdminQuizOverview = () =>
  useQuery({
    queryKey: ["admin-quiz-overview"],
    queryFn: async () => {
      const { data, error } = await rpc("admin_quiz_overview");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

export const useDeleteQuizAttempt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await rpc("admin_delete_quiz_attempt", { _attempt_id: id }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-quizzes"] }); ok("Attempt deleted"); },
    onError: fail,
  });
};

export const useResetSrs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { userId: string; category?: string | null }) => {
      const { data, error } = await rpc("admin_reset_srs", { _user_id: vars.userId, _category: vars.category ?? null });
      if (error) throw error; return data as number;
    },
    onSuccess: (n) => { qc.invalidateQueries({ queryKey: ["admin-quizzes"] }); ok(`SRS reset (${n} rows)`); },
    onError: fail,
  });
};

// ───────── Resumes
export const useAdminResumes = (userId: string | null = null, limit = 100) =>
  useQuery({
    queryKey: ["admin-resumes", userId, limit],
    queryFn: async () => {
      const { data, error } = await rpc("admin_list_resumes", { _user_id: userId, _limit: limit, _offset: 0 });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

export const useAdminResumeStats = () =>
  useQuery({
    queryKey: ["admin-resume-stats"],
    queryFn: async () => { const { data, error } = await rpc("admin_resume_stats"); if (error) throw error; return data as any; },
  });

export const useDeleteResume = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await rpc("admin_delete_resume", { _id: id });
      if (error) throw error;
      // best-effort storage cleanup
      const url = data as string | null;
      if (url && url.includes("/storage/v1/object/public/")) {
        try {
          const m = url.match(/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
          if (m) await supabase.storage.from(m[1]).remove([m[2]]);
        } catch { /* ignore */ }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-resumes"] }); qc.invalidateQueries({ queryKey: ["admin-resume-stats"] }); ok("Resume deleted"); },
    onError: fail,
  });
};

// ───────── Submissions
export const useAdminSubmissions = (
  userId: string | null = null, problemSlug: string | null = null,
  verdict: string | null = null, limit = 100,
) =>
  useQuery({
    queryKey: ["admin-submissions", userId, problemSlug, verdict, limit],
    queryFn: async () => {
      const { data, error } = await rpc("admin_list_submissions", {
        _user_id: userId, _problem_slug: problemSlug, _verdict: verdict, _limit: limit, _offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

export const useAdminSubmissionDetail = (id: string | null) =>
  useQuery({
    enabled: !!id,
    queryKey: ["admin-submission", id],
    queryFn: async () => { const { data, error } = await rpc("admin_submission_detail", { _id: id }); if (error) throw error; return data as any; },
  });

export const useAdminProblemAcceptance = (limit = 50) =>
  useQuery({
    queryKey: ["admin-problem-acceptance", limit],
    queryFn: async () => { const { data, error } = await rpc("admin_problem_acceptance", { _limit: limit }); if (error) throw error; return (data ?? []) as any[]; },
  });

// ───────── Conversations / Chat
export const useAdminConversations = (userId: string | null = null, limit = 100) =>
  useQuery({
    queryKey: ["admin-conversations", userId, limit],
    queryFn: async () => {
      const { data, error } = await rpc("admin_list_conversations", { _user_id: userId, _limit: limit, _offset: 0 });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

export const useAdminChatUsage = () =>
  useQuery({
    queryKey: ["admin-chat-usage"],
    queryFn: async () => { const { data, error } = await rpc("admin_chat_usage"); if (error) throw error; return data as any; },
  });

export const usePurgeConversations = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => { const { data, error } = await rpc("admin_purge_user_conversations", { _user_id: userId }); if (error) throw error; return data as number; },
    onSuccess: (n) => { qc.invalidateQueries({ queryKey: ["admin-conversations"] }); qc.invalidateQueries({ queryKey: ["admin-chat-usage"] }); ok(`Purged ${n} conversations`); },
    onError: fail,
  });
};

// ───────── Outreach
export const useAdminOutreach = (q: string | null = null, limit = 100) =>
  useQuery({
    queryKey: ["admin-outreach", q, limit],
    queryFn: async () => {
      const { data, error } = await rpc("admin_list_outreach_templates", { _q: q, _limit: limit, _offset: 0 });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

export const useAdminOutreachStats = () =>
  useQuery({
    queryKey: ["admin-outreach-stats"],
    queryFn: async () => { const { data, error } = await rpc("admin_outreach_stats"); if (error) throw error; return data as any; },
  });

export const useSetOutreachHidden = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { templateId: string; hidden: boolean; reason?: string }) => {
      const { error } = await rpc("admin_set_outreach_hidden", {
        _template_id: vars.templateId, _hidden: vars.hidden, _reason: vars.reason ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-outreach"] }); qc.invalidateQueries({ queryKey: ["admin-outreach-stats"] }); ok("Visibility updated"); },
    onError: fail,
  });
};

// ───────── Folders / Sharing
export const useAdminSharedFolders = (limit = 100) =>
  useQuery({
    queryKey: ["admin-shared-folders", limit],
    queryFn: async () => { const { data, error } = await rpc("admin_list_shared_folders", { _limit: limit, _offset: 0 }); if (error) throw error; return (data ?? []) as any[]; },
  });

export const useRevokeShare = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shareId: string) => { const { error } = await rpc("admin_revoke_share", { _share_id: shareId }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-shared-folders"] }); ok("Share revoked"); },
    onError: fail,
  });
};

// ───────── Scheduled broadcasts
export const useScheduledBroadcasts = (onlyPending = false) =>
  useQuery({
    queryKey: ["admin-scheduled-broadcasts", onlyPending],
    queryFn: async () => { const { data, error } = await rpc("admin_list_scheduled_broadcasts", { _only_pending: onlyPending }); if (error) throw error; return (data ?? []) as any[]; },
  });

export const useScheduleBroadcast = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { title: string; message: string; type?: string; targetFilter?: any; scheduledFor: string }) => {
      const { error } = await rpc("admin_schedule_broadcast", {
        _title: vars.title, _message: vars.message, _type: vars.type ?? "announcement",
        _target_filter: vars.targetFilter ?? {}, _scheduled_for: vars.scheduledFor,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-scheduled-broadcasts"] }); ok("Broadcast scheduled"); },
    onError: fail,
  });
};

export const useCancelScheduledBroadcast = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await rpc("admin_cancel_scheduled_broadcast", { _id: id }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-scheduled-broadcasts"] }); ok("Cancelled"); },
    onError: fail,
  });
};

// ───────── Force logout
export const useForceLogout = () =>
  useMutation({
    mutationFn: async (vars: { userId: string; reason?: string }) => {
      const { error } = await rpc("admin_force_logout", { _user_id: vars.userId, _reason: vars.reason ?? null });
      if (error) throw error;
    },
    onSuccess: () => ok("User will be signed out on next ping"),
    onError: fail,
  });

// ───────── Audit purge
export const usePurgeAudit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (days: number) => { const { data, error } = await rpc("admin_purge_audit_older_than", { _days: days }); if (error) throw error; return data as number; },
    onSuccess: (n) => { qc.invalidateQueries({ queryKey: ["admin-audit"] }); ok(`Purged ${n} rows`); },
    onError: fail,
  });
};

// ───────── Feature flag registry (typed schemas + rollout %)
export const useFlagRegistry = () =>
  useQuery({
    queryKey: ["admin-flag-registry"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_feature_flag_registry" as any)
        .select("*")
        .order("key");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

export const useUpsertFlagRegistry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { key: string; type: string; schema?: any; description?: string; rolloutPct?: number }) => {
      const { error } = await rpc("admin_flag_registry_upsert", {
        _key: vars.key, _type: vars.type, _schema: vars.schema ?? {},
        _description: vars.description ?? null, _rollout_pct: vars.rolloutPct ?? 100,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-flag-registry"] }); ok("Flag saved"); },
    onError: fail,
  });
};

// ───────── Support canned replies
export const useCannedReplies = () =>
  useQuery({
    queryKey: ["admin-canned-replies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_canned_replies" as any)
        .select("*")
        .order("label");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

export const useUpsertCannedReply = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id?: string | null; label: string; body: string }) => {
      const { error } = await rpc("admin_canned_reply_upsert", {
        _id: vars.id ?? null, _label: vars.label, _body: vars.body,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-canned-replies"] }); ok("Canned reply saved"); },
    onError: fail,
  });
};

export const useDeleteCannedReply = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await rpc("admin_canned_reply_delete", { _id: id }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-canned-replies"] }); ok("Deleted"); },
    onError: fail,
  });
};
