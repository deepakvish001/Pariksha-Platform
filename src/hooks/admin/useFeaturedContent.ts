import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface FeaturedRow {
  slot: string;
  target_type: string;
  target_id: string;
  weight: number;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string;
}

export const useFeaturedContent = () =>
  useQuery({
    queryKey: ["admin-featured-content"],
    queryFn: async (): Promise<FeaturedRow[]> => {
      const { data, error } = await supabase
        .from("featured_content")
        .select("*")
        .order("weight", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FeaturedRow[];
    },
  });

export const useUpsertFeatured = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<FeaturedRow> & { slot: string; target_type: string; target_id: string }) => {
      const { error } = await supabase
        .from("featured_content")
        .upsert({ ...row, updated_at: new Date().toISOString() } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-featured-content"] });
      toast({ title: "Saved", description: "Featured slot updated." });
    },
    onError: (e: any) =>
      toast({ title: "Save failed", description: e?.message, variant: "destructive" }),
  });
};

export const useDeleteFeatured = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slot: string) => {
      const { error } = await supabase.from("featured_content").delete().eq("slot", slot);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-featured-content"] });
      toast({ title: "Removed" });
    },
  });
};
