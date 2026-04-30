import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SupportMessage {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  replied_at: string | null;
  reply_body: string | null;
}

export const useSupportMessages = (status: string = "open") =>
  useQuery({
    queryKey: ["admin-support", status],
    queryFn: async (): Promise<SupportMessage[]> => {
      let q = supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SupportMessage[];
    },
  });

export const useUpdateSupportMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<SupportMessage, "status" | "reply_body">>;
    }) => {
      const update: any = { ...patch };
      if (patch.reply_body) {
        update.replied_at = new Date().toISOString();
        update.status = patch.status ?? "resolved";
      }
      const { error } = await supabase.from("support_messages").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-support"] });
      toast({ title: "Updated" });
    },
    onError: (e: any) =>
      toast({ title: "Update failed", description: e?.message, variant: "destructive" }),
  });
};

export const useDeleteSupportMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("support_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-support"] });
      toast({ title: "Removed" });
    },
  });
};
