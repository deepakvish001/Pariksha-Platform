import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RoadmapStreakData {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  lastActiveDate: string | null;
  totalDaysActive: number;
  thisWeekDays: number;
  isLoading: boolean;
}

export const useRoadmapStreak = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<RoadmapStreakData>({
    currentStreak: 0,
    longestStreak: 0,
    todayCompleted: false,
    lastActiveDate: null,
    totalDaysActive: 0,
    thisWeekDays: 0,
    isLoading: true,
  });

  const calculateStreak = useCallback(async () => {
    if (!user) {
      setStreakData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Fetch all completed roadmap progress ordered by date
      const { data, error } = await supabase
        .from("user_topic_progress")
        .select("updated_at, completed_at")
        .eq("user_id", user.id)
        .like("sheet_id", "roadmap-%")
        .eq("completed", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setStreakData({
          currentStreak: 0,
          longestStreak: 0,
          todayCompleted: false,
          lastActiveDate: null,
          totalDaysActive: 0,
          thisWeekDays: 0,
          isLoading: false,
        });
        return;
      }

      // Get unique dates (in user's local timezone)
      const uniqueDates = [...new Set(
        data.map(item => {
          const date = new Date(item.completed_at || item.updated_at);
          return date.toLocaleDateString("en-CA"); // YYYY-MM-DD format
        })
      )].sort((a, b) => b.localeCompare(a)); // Sort descending

      const today = new Date().toLocaleDateString("en-CA");
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");

      const todayCompleted = uniqueDates[0] === today;
      const lastActiveDate = uniqueDates[0];
      const totalDaysActive = uniqueDates.length;

      // Calculate this week's days
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfWeekStr = startOfWeek.toLocaleDateString("en-CA");
      const thisWeekDays = uniqueDates.filter(d => d >= startOfWeekStr).length;

      // Calculate current streak
      let currentStreak = 0;
      let checkDate = todayCompleted ? today : yesterday;

      // If the last activity wasn't today or yesterday, streak is broken
      if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        currentStreak = 0;
      } else {
        for (let i = 0; i < uniqueDates.length; i++) {
          if (uniqueDates[i] === checkDate) {
            currentStreak++;
            // Move to previous day
            const prevDate = new Date(checkDate);
            prevDate.setDate(prevDate.getDate() - 1);
            checkDate = prevDate.toLocaleDateString("en-CA");
          } else if (uniqueDates[i] < checkDate) {
            // Found a gap, streak ends
            break;
          }
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 1;

      for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i - 1]);
        const prevDate = new Date(uniqueDates[i]);
        const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / 86400000);

        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

      setStreakData({
        currentStreak,
        longestStreak,
        todayCompleted,
        lastActiveDate,
        totalDaysActive,
        thisWeekDays,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error calculating roadmap streak:", error);
      setStreakData(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  useEffect(() => {
    calculateStreak();
  }, [calculateStreak]);

  return { ...streakData, refreshStreak: calculateStreak };
};
