import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ParticipantStatus =
  | "not_joined"
  | "joined"
  | "in_progress"
  | "submitted"
  | "auto_submitted"
  | "abandoned";

export type LiveParticipant = {
  invite_id: string;
  email: string;
  name: string | null;
  external_id: string | null;
  invite_status: string;
  attempt_id: string | null;
  attempt_status: string | null;
  started_at: string | null;
  submitted_at: string | null;
  score: number | null;
  integrity_score: number | null;
  status: ParticipantStatus;
};

export function useLiveParticipants(assessmentId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!assessmentId) return;
    const ch = supabase
      .channel(`b2b-live-${assessmentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assessment_attempts", filter: `assessment_id=eq.${assessmentId}` },
        () => qc.invalidateQueries({ queryKey: ["b2b", "live-participants", assessmentId] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assessment_invites", filter: `assessment_id=eq.${assessmentId}` },
        () => qc.invalidateQueries({ queryKey: ["b2b", "live-participants", assessmentId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [assessmentId, qc]);

  return useQuery({
    queryKey: ["b2b", "live-participants", assessmentId],
    enabled: !!assessmentId,
    refetchInterval: 15_000,
    queryFn: async (): Promise<LiveParticipant[]> => {
      const [invitesRes, attemptsRes] = await Promise.all([
        supabase
          .from("assessment_invites")
          .select("id,email,name,external_id,status")
          .eq("assessment_id", assessmentId!),
        supabase
          .from("assessment_attempts")
          .select("id,invite_id,status,started_at,submitted_at,score,integrity_score")
          .eq("assessment_id", assessmentId!)
          .order("started_at", { ascending: false }),
      ]);
      if (invitesRes.error) throw invitesRes.error;
      if (attemptsRes.error) throw attemptsRes.error;

      const latestByInvite = new Map<string, any>();
      for (const a of attemptsRes.data ?? []) {
        if (a.invite_id && !latestByInvite.has(a.invite_id)) {
          latestByInvite.set(a.invite_id, a);
        }
      }

      return (invitesRes.data ?? []).map((i: any) => {
        const a = latestByInvite.get(i.id);
        let status: ParticipantStatus = "not_joined";
        if (a) {
          if (a.status === "in_progress") status = "in_progress";
          else if (a.status === "submitted") status = "submitted";
          else if (a.status === "auto_submitted") status = "auto_submitted";
          else if (a.status === "abandoned") status = "abandoned";
          else status = "joined";
        } else if (i.status === "claimed") {
          status = "joined";
        }
        return {
          invite_id: i.id,
          email: i.email,
          name: i.name,
          external_id: i.external_id,
          invite_status: i.status,
          attempt_id: a?.id ?? null,
          attempt_status: a?.status ?? null,
          started_at: a?.started_at ?? null,
          submitted_at: a?.submitted_at ?? null,
          score: a?.score ?? null,
          integrity_score: a?.integrity_score ?? null,
          status,
        } as LiveParticipant;
      });
    },
  });
}

export type LiveEvent = {
  id: string;
  attempt_id: string;
  kind: string;
  payload: any;
  created_at: string;
  candidate?: { email: string; name: string | null } | null;
};

export function useAssessmentActivity(assessmentId?: string, limit = 80) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!assessmentId) return;
    const ch = supabase
      .channel(`b2b-events-${assessmentId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attempt_events" },
        () => qc.invalidateQueries({ queryKey: ["b2b", "activity", assessmentId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [assessmentId, qc]);

  return useQuery({
    queryKey: ["b2b", "activity", assessmentId, limit],
    enabled: !!assessmentId,
    refetchInterval: 20_000,
    queryFn: async (): Promise<LiveEvent[]> => {
      // Get attempts for this assessment first, then their events.
      const { data: attempts, error: e1 } = await supabase
        .from("assessment_attempts")
        .select("id, invite:assessment_invites(email,name)")
        .eq("assessment_id", assessmentId!);
      if (e1) throw e1;
      const ids = (attempts ?? []).map((a: any) => a.id);
      if (ids.length === 0) return [];
      const byAttempt = new Map<string, any>();
      for (const a of attempts ?? []) byAttempt.set((a as any).id, (a as any).invite);

      const { data, error } = await supabase
        .from("attempt_events")
        .select("id, attempt_id, kind, payload, created_at")
        .in("attempt_id", ids)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((e: any) => ({ ...e, candidate: byAttempt.get(e.attempt_id) ?? null }));
    },
  });
}

export function useForceSubmitAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ attempt_id }: { attempt_id: string; assessment_id: string }) => {
      const { error } = await supabase
        .from("assessment_attempts")
        .update({ status: "auto_submitted", submitted_at: new Date().toISOString() })
        .eq("id", attempt_id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["b2b", "live-participants", vars.assessment_id] });
      qc.invalidateQueries({ queryKey: ["b2b", "attempts", vars.assessment_id] });
    },
  });
}
