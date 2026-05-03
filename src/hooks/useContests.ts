import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Contest = {
  id: string;
  slug: string;
  title: string;
  description: string;
  rules_md: string;
  banner_url: string | null;
  starts_at: string;
  ends_at: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  status: "draft" | "published" | "live" | "ended" | "archived";
  visibility: "public" | "unlisted" | "private";
  invite_code: string | null;
  max_participants: number | null;
  scoring_mode: "icpc" | "ioi" | "points";
  penalty_minutes: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ContestProblem = {
  contest_id: string;
  problem_slug: string;
  order_index: number;
  points: number;
};

export type ContestRegistration = {
  id: string;
  contest_id: string;
  user_id: string;
  status: "registered" | "disqualified" | "withdrawn";
  display_name: string | null;
  team_name: string | null;
  registered_at: string;
};

export const deriveStatus = (c: Contest): Contest["status"] => {
  if (c.status === "draft" || c.status === "archived") return c.status;
  const now = Date.now();
  const s = new Date(c.starts_at).getTime();
  const e = new Date(c.ends_at).getTime();
  if (now < s) return "published";
  if (now >= s && now <= e) return "live";
  return "ended";
};

export const useContests = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel("contests-list-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "contests" }, () => {
        qc.invalidateQueries({ queryKey: ["contests"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return useQuery({
    queryKey: ["contests"],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<Contest[]> => {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Contest[];
    },
  });
};

export const useContest = (slug: string | undefined) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!slug) return;
    const ch = supabase
      .channel(`contest-${slug}-live`)
      .on("postgres_changes", { event: "*", schema: "public", table: "contests" }, () => {
        qc.invalidateQueries({ queryKey: ["contest", slug] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, slug]);

  return useQuery({
    queryKey: ["contest", slug],
    enabled: !!slug,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data as Contest | null;
    },
  });
};

export const useContestProblems = (contestId: string | undefined) => {
  return useQuery({
    queryKey: ["contest-problems", contestId],
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

export const useMyRegistration = (contestId: string | undefined) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!contestId || !user) return;
    const ch = supabase
      .channel(`my-reg-${contestId}-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "contest_registrations",
        filter: `contest_id=eq.${contestId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ["my-registration", contestId, user.id] });
        qc.invalidateQueries({ queryKey: ["contest-registrations", contestId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, contestId, user]);

  return useQuery({
    queryKey: ["my-registration", contestId, user?.id],
    enabled: !!contestId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contest_registrations")
        .select("*")
        .eq("contest_id", contestId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as ContestRegistration | null;
    },
  });
};

export const useContestRegistrations = (contestId: string | undefined) => {
  return useQuery({
    queryKey: ["contest-registrations", contestId],
    enabled: !!contestId,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contest_registrations")
        .select("*")
        .eq("contest_id", contestId!)
        .order("registered_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContestRegistration[];
    },
  });
};

export const useRegisterForContest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contestId, inviteCode }: { contestId: string; inviteCode?: string }) => {
      const { data, error } = await supabase.rpc("register_for_contest", {
        _contest_id: contestId,
        _invite_code: inviteCode ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      toast.success("Registered for contest");
      qc.invalidateQueries({ queryKey: ["my-registration", vars.contestId] });
      qc.invalidateQueries({ queryKey: ["contest-registrations", vars.contestId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Registration failed"),
  });
};

export const useWithdrawFromContest = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (contestId: string) => {
      const { error } = await supabase
        .from("contest_registrations")
        .delete()
        .eq("contest_id", contestId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: (_d, contestId) => {
      toast.success("Withdrawn from contest");
      qc.invalidateQueries({ queryKey: ["my-registration", contestId] });
      qc.invalidateQueries({ queryKey: ["contest-registrations", contestId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Withdraw failed"),
  });
};
