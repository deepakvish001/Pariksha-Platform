import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface RoadmapOverride {
  roadmap_id: string;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  updated_at: string;
}

export const useRoadmapOverrides = () =>
  useQuery({
    queryKey: ["admin-roadmap-overrides"],
    queryFn: async (): Promise<RoadmapOverride[]> => {
      const { data, error } = await supabase
        .from("roadmap_overrides")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as RoadmapOverride[];
    },
  });

export const useUpsertRoadmapOverride = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<RoadmapOverride> & { roadmap_id: string }) => {
      const { error } = await supabase
        .from("roadmap_overrides")
        .upsert({ ...row, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-roadmap-overrides"] });
      toast({ title: "Saved" });
    },
    onError: (e: any) =>
      toast({ title: "Update failed", description: e?.message, variant: "destructive" }),
  });
};

export const useSetFeaturedRoadmap = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roadmap_id: string) => {
      // Clear existing featured
      await supabase
        .from("roadmap_overrides")
        .update({ is_featured: false })
        .neq("roadmap_id", roadmap_id);
      // Set new featured
      const { error } = await supabase
        .from("roadmap_overrides")
        .upsert({ roadmap_id, is_featured: true, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-roadmap-overrides"] });
      toast({ title: "Featured roadmap updated" });
    },
  });
};
