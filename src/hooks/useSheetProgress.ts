import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay, differenceInDays, parseISO } from "date-fns";

interface SheetProgressData {
  sheetId: string;
  completedCount: number;
  revisionCount: number;
  lastActivityAt: string | null;
  completedAt: string | null; // When sheet was 100% completed
  streak: number; // Consecutive days practiced
}

// Calculate streak from activity dates
const calculateStreak = (dates: string[]): number => {
  if (dates.length === 0) return 0;
  
  const uniqueDays = [...new Set(dates.map(d => startOfDay(parseISO(d)).toISOString()))];
  uniqueDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  if (uniqueDays.length === 0) return 0;
  
  const today = startOfDay(new Date());
  const mostRecent = new Date(uniqueDays[0]);
  
  // If last activity wasn't today or yesterday, streak is broken
  const daysSinceLastActivity = differenceInDays(today, mostRecent);
  if (daysSinceLastActivity > 1) return 0;
  
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const current = new Date(uniqueDays[i - 1]);
    const previous = new Date(uniqueDays[i]);
    const diff = differenceInDays(current, previous);
    
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

export const useSheetProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sheet-progress", user?.id],
    queryFn: async (): Promise<Record<string, SheetProgressData>> => {
      if (!user?.id) return {};

      const { data, error } = await supabase
        .from("user_topic_progress")
        .select("sheet_id, completed, is_revision, updated_at, completed_at")
        .eq("user_id", user.id);

      if (error) throw error;

      // Group by sheet_id and calculate metrics
      const progressMap: Record<string, SheetProgressData> = {};
      const activityDates: Record<string, string[]> = {};

      data?.forEach((item) => {
        if (!progressMap[item.sheet_id]) {
          progressMap[item.sheet_id] = {
            sheetId: item.sheet_id,
            completedCount: 0,
            revisionCount: 0,
            lastActivityAt: null,
            completedAt: null,
            streak: 0,
          };
          activityDates[item.sheet_id] = [];
        }

        if (item.completed) {
          progressMap[item.sheet_id].completedCount++;
        }
        if (item.is_revision) {
          progressMap[item.sheet_id].revisionCount++;
        }
        
        // Track activity dates for streak calculation
        if (item.updated_at) {
          activityDates[item.sheet_id].push(item.updated_at);
        }
        
        // Track most recent activity
        const currentLast = progressMap[item.sheet_id].lastActivityAt;
        if (!currentLast || new Date(item.updated_at) > new Date(currentLast)) {
          progressMap[item.sheet_id].lastActivityAt = item.updated_at;
        }
        
        // Track completion date
        if (item.completed_at) {
          const currentCompleted = progressMap[item.sheet_id].completedAt;
          if (!currentCompleted || new Date(item.completed_at) > new Date(currentCompleted)) {
            progressMap[item.sheet_id].completedAt = item.completed_at;
          }
        }
      });

      // Calculate streaks for each sheet
      Object.keys(progressMap).forEach((sheetId) => {
        progressMap[sheetId].streak = calculateStreak(activityDates[sheetId]);
      });

      return progressMap;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
};

export const calculateProgressPercentage = (
  completedCount: number,
  totalProblems: number
): number => {
  if (totalProblems === 0) return 0;
  return Math.round((completedCount / totalProblems) * 100);
};
