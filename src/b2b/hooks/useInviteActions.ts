import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SendResult = {
  sent: number;
  failed: number;
  results?: { email: string; ok: boolean; error?: string }[];
};

export function useSendInvites(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: {
      invite_ids?: string[];
      only_pending?: boolean;
    }): Promise<SendResult> => {
      const { data, error } = await supabase.functions.invoke(
        "send-assessment-invite",
        { body: { assessment_id: assessmentId, ...opts } },
      );
      if (error) throw new Error(error.message ?? "Failed to send");
      return data as SendResult;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["b2b", "invites", assessmentId] }),
  });
}

export function useScheduleInvites(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      invite_ids,
      scheduled_send_at,
    }: {
      invite_ids: string[];
      scheduled_send_at: string | null;
    }) => {
      const { error } = await supabase
        .from("assessment_invites")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ scheduled_send_at } as any)
        .in("id", invite_ids);
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["b2b", "invites", assessmentId] }),
  });
}

export function useBulkDeleteInvites(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("assessment_invites")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["b2b", "invites", assessmentId] }),
  });
}
