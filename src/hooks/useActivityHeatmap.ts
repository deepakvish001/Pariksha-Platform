import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay, subDays, format, eachDayOfInterval } from "date-fns";

export interface DayActivity {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = no activity, 4 = max activity
}

interface UseActivityHeatmapOptions {
  days?: number;
}

export function useActivityHeatmap(options: UseActivityHeatmapOptions = {}) {
  const { days = 365 } = options;
  const { user } = useAuth();
  const [heatmapData, setHeatmapData] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalActivities, setTotalActivities] = useState(0);

  const fetchHeatmapData = useCallback(async () => {
    if (!user) {
      setHeatmapData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const endDate = startOfDay(new Date());
      const startDate = subDays(endDate, days - 1);

      // Fetch all activities in the date range
      const { data, error } = await supabase
        .from("user_activity_log")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", new Date().toISOString());

      if (error) throw error;

      // Count activities per day
      const activityCounts: Record<string, number> = {};
      (data || []).forEach((activity) => {
        const dateKey = format(new Date(activity.created_at), "yyyy-MM-dd");
        activityCounts[dateKey] = (activityCounts[dateKey] || 0) + 1;
      });

      // Find max count for scaling
      const counts = Object.values(activityCounts);
      const maxCount = Math.max(...counts, 1);
      const total = counts.reduce((sum, c) => sum + c, 0);
      setTotalActivities(total);

      // Generate all days in range with activity levels
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      const heatmap: DayActivity[] = allDays.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const count = activityCounts[dateKey] || 0;
        
        // Calculate intensity level (0-4)
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count > 0) {
          const ratio = count / maxCount;
          if (ratio <= 0.25) level = 1;
          else if (ratio <= 0.5) level = 2;
          else if (ratio <= 0.75) level = 3;
          else level = 4;
        }

        return { date: dateKey, count, level };
      });

      setHeatmapData(heatmap);
    } catch (err) {
      console.error("Error fetching heatmap data:", err);
    } finally {
      setLoading(false);
    }
  }, [user, days]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  return { heatmapData, loading, totalActivities, refetch: fetchHeatmapData };
}
