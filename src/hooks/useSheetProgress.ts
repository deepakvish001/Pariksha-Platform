import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SheetProgressData {
  sheetId: string;
  completedCount: number;
  revisionCount: number;
  lastActivityAt: string | null;
}

export const useSheetProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sheet-progress", user?.id],
    queryFn: async (): Promise<Record<string, SheetProgressData>> => {
      if (!user?.id) return {};

      const { data, error } = await supabase
        .from("user_topic_progress")
        .select("sheet_id, completed, is_revision, updated_at")
        .eq("user_id", user.id);

      if (error) throw error;

      // Group by sheet_id and count completed/revision, track last activity
      const progressMap: Record<string, SheetProgressData> = {};

      data?.forEach((item) => {
        if (!progressMap[item.sheet_id]) {
          progressMap[item.sheet_id] = {
            sheetId: item.sheet_id,
            completedCount: 0,
            revisionCount: 0,
            lastActivityAt: null,
          };
        }

        if (item.completed) {
          progressMap[item.sheet_id].completedCount++;
        }
        if (item.is_revision) {
          progressMap[item.sheet_id].revisionCount++;
        }
        
        // Track most recent activity
        const currentLast = progressMap[item.sheet_id].lastActivityAt;
        if (!currentLast || new Date(item.updated_at) > new Date(currentLast)) {
          progressMap[item.sheet_id].lastActivityAt = item.updated_at;
        }
      });

      return progressMap;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const calculateProgressPercentage = (
  completedCount: number,
  totalProblems: number
): number => {
  if (totalProblems === 0) return 0;
  return Math.round((completedCount / totalProblems) * 100);
};
