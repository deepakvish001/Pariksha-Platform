import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, format, eachDayOfInterval, parseISO, isWithinInterval } from "date-fns";

interface DailyProgress {
  date: string;
  count: number;
}

interface ProgressPeriod {
  label: string;
  completed: number;
  startDate: Date;
  endDate: Date;
}

interface ProgressVelocity {
  dailyProgress: DailyProgress[];
  weeklyProgress: ProgressPeriod[];
  monthlyProgress: ProgressPeriod[];
  currentWeekCount: number;
  lastWeekCount: number;
  currentMonthCount: number;
  lastMonthCount: number;
  weeklyTrend: number; // percentage change
  monthlyTrend: number; // percentage change
  averagePerDay: number;
  totalCompleted: number;
  isLoading: boolean;
}

export function useRoadmapProgressHistory(): ProgressVelocity {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<{ completed_at: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgressHistory = async () => {
      if (!user) {
        setProgressData([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Fetch last 60 days of completion data
      const sixtyDaysAgo = subMonths(new Date(), 2).toISOString();

      const { data } = await supabase
        .from("user_topic_progress")
        .select("completed_at")
        .eq("user_id", user.id)
        .like("sheet_id", "roadmap-tree-%")
        .eq("completed", true)
        .gte("completed_at", sixtyDaysAgo)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: true });

      setProgressData(data || []);
      setIsLoading(false);
    };

    fetchProgressHistory();
  }, [user]);

  const velocityData = useMemo(() => {
    const now = new Date();
    
    // Current and last week boundaries
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    // Current and last month boundaries
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Calculate daily progress for last 14 days
    const last14Days = eachDayOfInterval({
      start: subWeeks(now, 2),
      end: now,
    });

    const dailyProgress: DailyProgress[] = last14Days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const count = progressData.filter((item) => {
        if (!item.completed_at) return false;
        return format(parseISO(item.completed_at), "yyyy-MM-dd") === dayStr;
      }).length;
      return { date: dayStr, count };
    });

    // Calculate weekly progress for last 4 weeks
    const weeklyProgress: ProgressPeriod[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const count = progressData.filter((item) => {
        if (!item.completed_at) return false;
        const date = parseISO(item.completed_at);
        return isWithinInterval(date, { start: weekStart, end: weekEnd });
      }).length;
      weeklyProgress.unshift({
        label: i === 0 ? "This Week" : i === 1 ? "Last Week" : `${i} weeks ago`,
        completed: count,
        startDate: weekStart,
        endDate: weekEnd,
      });
    }

    // Calculate monthly progress for last 3 months
    const monthlyProgress: ProgressPeriod[] = [];
    for (let i = 0; i < 3; i++) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      const count = progressData.filter((item) => {
        if (!item.completed_at) return false;
        const date = parseISO(item.completed_at);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      }).length;
      monthlyProgress.unshift({
        label: format(monthStart, "MMM"),
        completed: count,
        startDate: monthStart,
        endDate: monthEnd,
      });
    }

    // Current and last period counts
    const currentWeekCount = progressData.filter((item) => {
      if (!item.completed_at) return false;
      const date = parseISO(item.completed_at);
      return isWithinInterval(date, { start: currentWeekStart, end: currentWeekEnd });
    }).length;

    const lastWeekCount = progressData.filter((item) => {
      if (!item.completed_at) return false;
      const date = parseISO(item.completed_at);
      return isWithinInterval(date, { start: lastWeekStart, end: lastWeekEnd });
    }).length;

    const currentMonthCount = progressData.filter((item) => {
      if (!item.completed_at) return false;
      const date = parseISO(item.completed_at);
      return isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd });
    }).length;

    const lastMonthCount = progressData.filter((item) => {
      if (!item.completed_at) return false;
      const date = parseISO(item.completed_at);
      return isWithinInterval(date, { start: lastMonthStart, end: lastMonthEnd });
    }).length;

    // Calculate trends
    const weeklyTrend = lastWeekCount > 0 
      ? Math.round(((currentWeekCount - lastWeekCount) / lastWeekCount) * 100)
      : currentWeekCount > 0 ? 100 : 0;

    const monthlyTrend = lastMonthCount > 0
      ? Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100)
      : currentMonthCount > 0 ? 100 : 0;

    // Average per day (last 14 days)
    const totalLast14Days = dailyProgress.reduce((sum, d) => sum + d.count, 0);
    const averagePerDay = Math.round((totalLast14Days / 14) * 10) / 10;

    return {
      dailyProgress,
      weeklyProgress,
      monthlyProgress,
      currentWeekCount,
      lastWeekCount,
      currentMonthCount,
      lastMonthCount,
      weeklyTrend,
      monthlyTrend,
      averagePerDay,
      totalCompleted: progressData.length,
      isLoading,
    };
  }, [progressData, isLoading]);

  return velocityData;
}
