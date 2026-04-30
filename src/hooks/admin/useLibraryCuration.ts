import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const LIBRARY_CATEGORIES = [
  { id: "dsa", label: "DSA Questions" },
  { id: "sql", label: "SQL Questions" },
  { id: "aptitude", label: "Aptitude" },
  { id: "interview", label: "Interview Questions" },
  { id: "cs", label: "Core CS Subjects" },
  { id: "notes", label: "Handwritten Notes" },
  { id: "companies", label: "Company Resources" },
  { id: "positions", label: "Position Resources" },
] as const;

export interface HiddenItem {
  category: string;
  item_id: string;
  hidden_at: string;
}

export const useHiddenLibraryItems = () =>
  useQuery({
    queryKey: ["admin-library-hidden"],
    queryFn: async (): Promise<HiddenItem[]> => {
      const { data, error } = await supabase
        .from("library_hidden_items")
        .select("*")
        .order("hidden_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as HiddenItem[];
    },
  });

export const useToggleLibraryItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      category,
      item_id,
      hide,
    }: {
      category: string;
      item_id: string;
      hide: boolean;
    }) => {
      if (hide) {
        const { error } = await supabase
          .from("library_hidden_items")
          .upsert({ category, item_id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("library_hidden_items")
          .delete()
          .eq("category", category)
          .eq("item_id", item_id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-library-hidden"] });
    },
    onError: (e: any) =>
      toast({ title: "Update failed", description: e?.message, variant: "destructive" }),
  });
};

export const useLibraryCategoryFlag = (category: string) => {
  const qc = useQueryClient();
  const key = `library.${category}.enabled`;

  const query = useQuery({
    queryKey: ["platform-setting", key],
    queryFn: async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      const v = (data?.value as any)?.enabled;
      return v === undefined ? true : !!v;
    },
  });

  const setFlag = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from("platform_settings")
        .upsert({ key, value: { enabled } as any, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-setting", key] });
      toast({ title: "Saved" });
    },
  });

  return { enabled: query.data ?? true, isLoading: query.isLoading, setFlag: setFlag.mutate };
};
