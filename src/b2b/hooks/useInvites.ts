import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type InviteStatus = "pending" | "claimed" | "submitted" | "expired";
export type InviteSource = "email" | "link" | "bulk_upload" | "manual" | "api";

export type Invite = {
  id: string;
  assessment_id: string;
  email: string;
  name: string | null;
  external_id: string | null;
  token: string;
  status: InviteStatus;
  source: InviteSource;
  expires_at: string | null;
  last_sent_at?: string | null;
  last_send_attempt_at?: string | null;
  last_send_error?: string | null;
  send_count?: number | null;
  created_at: string;
  updated_at: string;
};

export function useInvites(assessmentId?: string) {
  return useQuery({
    queryKey: ["b2b", "invites", assessmentId],
    enabled: !!assessmentId,
    queryFn: async (): Promise<Invite[]> => {
      const { data, error } = await supabase
        .from("assessment_invites")
        .select("*")
        .eq("assessment_id", assessmentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Invite[];
    },
  });
}

const ALLOWED_SOURCES: ReadonlySet<InviteSource> = new Set([
  "email",
  "link",
  "bulk_upload",
  "manual",
  "api",
]);

export function useCreateInvites() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      assessment_id: string;
      rows: { email: string; name?: string; external_id?: string }[];
      source?: InviteSource;
    }) => {
      // Default heuristic: >1 row implies a paste/CSV bulk upload; a single
      // row is a manual one-off add. Callers can override via `source`.
      const inferred: InviteSource =
        input.rows.length > 1 ? "bulk_upload" : "manual";
      const requested = (input.source ?? inferred) as InviteSource;
      const source: InviteSource = ALLOWED_SOURCES.has(requested)
        ? requested
        : inferred;
      const seen = new Set<string>();
      const payload = input.rows
        .map((r) => ({ ...r, email: r.email.trim().toLowerCase() }))
        .filter((r) => {
          if (!r.email || seen.has(r.email)) return false;
          seen.add(r.email);
          return true;
        })
        .map((r) => ({
          assessment_id: input.assessment_id,
          email: r.email,
          name: r.name ?? null,
          external_id: r.external_id ?? null,
          source,
        }));
      if (!payload.length) return [] as Invite[];
      const { data, error } = await supabase
        .from("assessment_invites")
        .upsert(payload, { onConflict: "assessment_id,email", ignoreDuplicates: true })
        .select("*");
      if (error) throw error;
      return (data ?? []) as Invite[];
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["b2b", "invites", vars.assessment_id] }),
  });
}

export function useDeleteInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, assessment_id }: { id: string; assessment_id: string }) => {
      const { error } = await supabase.from("assessment_invites").delete().eq("id", id);
      if (error) throw error;
      return { id, assessment_id };
    },
    onSuccess: ({ assessment_id }) =>
      qc.invalidateQueries({ queryKey: ["b2b", "invites", assessment_id] }),
  });
}

export function buildJoinUrl(token: string) {
  return `${window.location.origin}/assessments/join/${token}`;
}

// Claim invite via SECURITY DEFINER RPC.
export async function claimInvite(token: string) {
  const { data, error } = await supabase.rpc("claim_assessment_invite", { _token: token });
  if (error) throw error;
  return data;
}

// Student-side: list invites/attempts for current user.
export function useMyInvites() {
  return useQuery({
    queryKey: ["student", "invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_invites")
        .select("*, assessment:assessments(id,title,duration_min,status,type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyAttempts() {
  return useQuery({
    queryKey: ["student", "attempts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("*, assessment:assessments(id,title,duration_min)")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
