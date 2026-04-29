import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDistinctTopics = () => {
  return useQuery({
    queryKey: ["admin-distinct-topics"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("coding_problems")
        .select("topics")
        .limit(500);
      if (error) throw error;
      const set = new Set<string>();
      (data ?? []).forEach((r: any) => {
        (r.topics ?? []).forEach((t: string) => {
          if (t && typeof t === "string") set.add(t);
        });
      });
      return [...set].sort((a, b) => a.localeCompare(b));
    },
  });
};
