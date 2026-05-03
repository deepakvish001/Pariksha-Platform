import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Contest, ContestProblem, ContestRegistration } from "@/hooks/useContests";

export const useAdminContests = () => {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel("admin-contests-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "contests" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-contests"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contest_registrations" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-contests"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return useQuery({
    queryKey: ["admin-contests"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (data ?? []) as Contest[];
      // Fetch registration counts in one go
      const { data: regs } = await supabase
        .from("contest_registrations")
        .select("contest_id, status");
      const counts = new Map<string, number>();
      (regs ?? []).forEach((r: any) => {
        if (r.status === "registered") counts.set(r.contest_id, (counts.get(r.contest_id) ?? 0) + 1);
      });
      return list.map((c) => ({ ...c, registrations_count: counts.get(c.id) ?? 0 }));
    },
  });
};

export const useAdminContest = (id: string | undefined) => {
  return useQuery({
    queryKey: ["admin-contest", id],
    enabled: !!id,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase.from("contests").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as Contest | null;
    },
  });
};

export const useAdminContestProblems = (contestId: string | undefined) => {
  const qc = useQueryClient();
  useEffect(() => {
    if (!contestId) return;
    const ch = supabase
      .channel(`admin-contest-problems-${contestId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "contest_problems",
        filter: `contest_id=eq.${contestId}`,
      }, () => qc.invalidateQueries({ queryKey: ["admin-contest-problems", contestId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, contestId]);

  return useQuery({
    queryKey: ["admin-contest-problems", contestId],
    enabled: !!contestId,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contest_problems")
        .select("*")
        .eq("contest_id", contestId!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ContestProblem[];
    },
  });
};

const writeAudit = async (action: string, entitySlug: string, diff: any, actorId: string) => {
  await supabase.from("admin_audit_log").insert({
    action, entity_type: "contest", entity_slug: entitySlug, diff, actor_id: actorId,
  });
};

export const useSaveContest = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Partial<Contest> & { id?: string }) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { data, error } = await supabase
          .from("contests")
          .update(rest)
          .eq("id", id)
          .select("*")
          .maybeSingle();
        if (error) throw error;
        if (user && data) await writeAudit("update", data.slug, rest, user.id);
        return data as Contest;
      } else {
        const insertRow: any = { ...payload, created_by: user?.id };
        const { data, error } = await supabase
          .from("contests")
          .insert(insertRow)
          .select("*")
          .maybeSingle();
        if (error) throw error;
        if (user && data) await writeAudit("create", data.slug, payload, user.id);
        return data as Contest;
      }
    },
    onSuccess: () => {
      toast.success("Contest saved");
      qc.invalidateQueries({ queryKey: ["admin-contests"] });
      qc.invalidateQueries({ queryKey: ["contests"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });
};

export const useDeleteContest = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (c: { id: string; slug: string }) => {
      const { error } = await supabase.from("contests").delete().eq("id", c.id);
      if (error) throw error;
      if (user) await writeAudit("delete", c.slug, {}, user.id);
    },
    onSuccess: () => {
      toast.success("Contest deleted");
      qc.invalidateQueries({ queryKey: ["admin-contests"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });
};

export const useSetContestProblems = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contestId, problems }: {
      contestId: string;
      problems: { problem_slug: string; order_index: number; points: number }[];
    }) => {
      const del = await supabase.from("contest_problems").delete().eq("contest_id", contestId);
      if (del.error) throw del.error;
      if (problems.length === 0) return;
      const { error } = await supabase
        .from("contest_problems")
        .insert(problems.map((p) => ({ ...p, contest_id: contestId })));
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success("Problems updated");
      qc.invalidateQueries({ queryKey: ["admin-contest-problems", vars.contestId] });
      qc.invalidateQueries({ queryKey: ["contest-problems", vars.contestId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
};

export const useAdminContestRegistrations = (contestId: string | undefined) => {
  const qc = useQueryClient();
  useEffect(() => {
    if (!contestId) return;
    const ch = supabase
      .channel(`admin-regs-${contestId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "contest_registrations",
        filter: `contest_id=eq.${contestId}`,
      }, () => qc.invalidateQueries({ queryKey: ["admin-contest-registrations", contestId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, contestId]);

  return useQuery({
    queryKey: ["admin-contest-registrations", contestId],
    enabled: !!contestId,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contest_registrations")
        .select("*")
        .eq("contest_id", contestId!)
        .order("registered_at", { ascending: false });
      if (error) throw error;
      const list = (data ?? []) as ContestRegistration[];
      const ids = Array.from(new Set(list.map((r) => r.user_id)));
      if (ids.length === 0) return list as (ContestRegistration & { full_name?: string; avatar_url?: string | null })[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", ids);
      const map = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
      return list.map((r) => ({ ...r, ...(map.get(r.user_id) ?? {}) }));
    },
  });
};

export const useUpdateRegistrationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContestRegistration["status"] }) => {
      const { error } = await supabase.from("contest_registrations").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registration updated");
      qc.invalidateQueries({ queryKey: ["admin-contest-registrations"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
};

export const useDeleteRegistration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contest_registrations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["admin-contest-registrations"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
};

export const useRecomputeLeaderboard = () => {
  return useMutation({
    mutationFn: async (contestId: string) => {
      const { error } = await supabase.rpc("recompute_contest_leaderboard", { _contest_id: contestId });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Leaderboard recomputed"),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
};
