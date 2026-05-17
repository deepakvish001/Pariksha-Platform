import { useEffect } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  attempt_slug: string | null;
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
          .select("id,slug,invite_id,status,started_at,submitted_at,score,integrity_score")
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
          attempt_slug: a?.slug ?? null,
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

export function useAssessmentActivity(assessmentId?: string, pageSize = 40) {
  const qc = useQueryClient();
  const queryKey = ["b2b", "activity", assessmentId, pageSize] as const;

  useEffect(() => {
    if (!assessmentId) return;
    const ch = supabase
      .channel(`b2b-events-${assessmentId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attempt_events" },
        () => qc.invalidateQueries({ queryKey })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [assessmentId, qc, pageSize]);

  return useInfiniteQuery<LiveEvent[], Error, { pages: LiveEvent[][]; pageParams: (string | null)[] }, typeof queryKey, string | null>({
    queryKey,
    enabled: !!assessmentId,
    refetchInterval: 20_000,
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.length < pageSize ? undefined : lastPage[lastPage.length - 1].created_at,
    queryFn: async ({ pageParam }): Promise<LiveEvent[]> => {
      const { data: attempts, error: e1 } = await supabase
        .from("assessment_attempts")
        .select("id, invite:assessment_invites(email,name)")
        .eq("assessment_id", assessmentId!);
      if (e1) throw e1;
      const ids = (attempts ?? []).map((a: any) => a.id);
      if (ids.length === 0) return [];
      const byAttempt = new Map<string, any>();
      for (const a of attempts ?? []) byAttempt.set((a as any).id, (a as any).invite);

      let q = supabase
        .from("attempt_events")
        .select("id, attempt_id, kind, payload, created_at")
        .in("attempt_id", ids)
        .order("created_at", { ascending: false })
        .limit(pageSize);
      if (pageParam) q = q.lt("created_at", pageParam as string);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((e: any) => ({ ...e, candidate: byAttempt.get(e.attempt_id) ?? null }));
    },
  });
}

export type EvidenceCounts = {
  webcam: number;
  screen: number;
  side_cam: number;
  findings_high: number;
  findings_med: number;
};

const EMPTY_COUNTS: EvidenceCounts = { webcam: 0, screen: 0, side_cam: 0, findings_high: 0, findings_med: 0 };

export function useAssessmentEvidence(assessmentId?: string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!assessmentId) return;
    const ch = supabase
      .channel(`b2b-evidence-${assessmentId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "assessment_proctor_findings" },
        () => qc.invalidateQueries({ queryKey: ["b2b", "evidence", assessmentId] }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "assessment_proctor_snapshots" },
        () => qc.invalidateQueries({ queryKey: ["b2b", "evidence", assessmentId] }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "assessment_side_camera_frames" },
        () => qc.invalidateQueries({ queryKey: ["b2b", "evidence", assessmentId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [assessmentId, qc]);

  return useQuery({
    queryKey: ["b2b", "evidence", assessmentId],
    enabled: !!assessmentId,
    refetchInterval: 30_000,
    queryFn: async (): Promise<Record<string, EvidenceCounts>> => {
      const { data: attempts } = await supabase
        .from("assessment_attempts")
        .select("id")
        .eq("assessment_id", assessmentId!);
      const ids = (attempts ?? []).map((a: any) => a.id);
      if (!ids.length) return {};
      const [snaps, sides, finds] = await Promise.all([
        supabase.from("assessment_proctor_snapshots").select("attempt_id,source").in("attempt_id", ids).limit(8000),
        supabase.from("assessment_side_camera_frames").select("attempt_id").in("attempt_id", ids).limit(8000),
        supabase.from("assessment_proctor_findings").select("attempt_id,severity").in("attempt_id", ids).limit(3000),
      ]);
      const out: Record<string, EvidenceCounts> = {};
      const get = (k: string) => (out[k] ??= { ...EMPTY_COUNTS });
      for (const r of (snaps.data ?? []) as any[]) {
        const c = get(r.attempt_id);
        if (r.source === "screen") c.screen++; else c.webcam++;
      }
      for (const r of (sides.data ?? []) as any[]) get(r.attempt_id).side_cam++;
      for (const r of (finds.data ?? []) as any[]) {
        const c = get(r.attempt_id);
        if (r.severity === "high" || r.severity === "critical") c.findings_high++;
        else if (r.severity === "medium") c.findings_med++;
      }
      return out;
    },
  });
}

export type FlaggedRow = {
  attempt_id: string;
  assessment_id: string;
  assessment_title: string;
  candidate: string;
  integrity_score: number;
  status: string;
};

export function useFlaggedAcrossOrg(orgId?: string, limit = 5) {
  return useQuery({
    queryKey: ["b2b", "flagged-org", orgId, limit],
    enabled: !!orgId,
    refetchInterval: 30_000,
    queryFn: async (): Promise<FlaggedRow[]> => {
      const aRes = await supabase.from("assessments").select("id,title").eq("org_id", orgId!);
      const titleById = new Map<string, string>();
      for (const a of (aRes.data ?? []) as any[]) titleById.set(a.id, a.title);
      const ids = Array.from(titleById.keys());
      if (!ids.length) return [];
      const { data } = await supabase
        .from("assessment_attempts")
        .select("id, assessment_id, status, integrity_score, invite:assessment_invites(email,name)")
        .in("assessment_id", ids)
        .lt("integrity_score", 70)
        .in("status", ["in_progress", "submitted", "auto_submitted"])
        .order("integrity_score", { ascending: true })
        .limit(limit);
      return ((data ?? []) as any[]).map((r) => ({
        attempt_id: r.id,
        assessment_id: r.assessment_id,
        assessment_title: titleById.get(r.assessment_id) ?? "Assessment",
        candidate: r.invite?.name ?? r.invite?.email ?? "Candidate",
        integrity_score: r.integrity_score ?? 0,
        status: r.status,
      }));
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
