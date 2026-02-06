import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActivityStats {
  problemsSolved: number;
  quizzesCompleted: number;
  templatesUsed: number;
  weeklyXP: number;
  achievementsUnlocked: number;
  // Week-over-week changes
  problemsChange: number;
  quizzesChange: number;
  templatesChange: number;
  xpChange: number;
}

export function useActivityStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ActivityStats>({
    problemsSolved: 0,
    quizzesCompleted: 0,
    templatesUsed: 0,
    weeklyXP: 0,
    achievementsUnlocked: 0,
    problemsChange: 0,
    quizzesChange: 0,
    templatesChange: 0,
    xpChange: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Fetch all stats in parallel
      const [
        problemsResult,
        problemsLastWeekResult,
        quizzesResult,
        quizzesLastWeekResult,
        resumeDownloadsResult,
        outreachUsageResult,
        templatesLastWeekResult,
        weeklyXPResult,
        lastWeekXPResult,
        achievementsResult,
      ] = await Promise.all([
        // Problems solved (total)
        supabase
          .from("user_company_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("solved", true),
        // Problems solved (last week for comparison)
        supabase
          .from("user_company_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("solved", true)
          .gte("updated_at", oneWeekAgo.toISOString()),
        // Quizzes completed (total)
        supabase
          .from("quiz_results")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        // Quizzes completed (this week)
        supabase
          .from("quiz_results")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("completed_at", oneWeekAgo.toISOString()),
        // Resume downloads (total)
        supabase
          .from("resume_downloads")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        // Outreach templates used (total)
        supabase
          .from("outreach_usage")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        // Templates used (this week - both resume and outreach)
        supabase
          .from("resume_downloads")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("downloaded_at", oneWeekAgo.toISOString()),
        // Weekly XP (this week)
        supabase
          .from("xp_transactions")
          .select("amount")
          .eq("user_id", user.id)
          .gte("created_at", oneWeekAgo.toISOString()),
        // Weekly XP (last week for comparison)
        supabase
          .from("xp_transactions")
          .select("amount")
          .eq("user_id", user.id)
          .gte("created_at", twoWeeksAgo.toISOString())
          .lt("created_at", oneWeekAgo.toISOString()),
        // Achievements unlocked (total)
        supabase
          .from("user_achievements")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      const problemsSolved = problemsResult.count || 0;
      const problemsThisWeek = problemsLastWeekResult.count || 0;
      const quizzesCompleted = quizzesResult.count || 0;
      const quizzesThisWeek = quizzesLastWeekResult.count || 0;
      const resumeDownloads = resumeDownloadsResult.count || 0;
      const outreachUsage = outreachUsageResult.count || 0;
      const templatesThisWeek = templatesLastWeekResult.count || 0;
      const weeklyXP = (weeklyXPResult.data || []).reduce(
        (sum, t) => sum + (t.amount || 0),
        0
      );
      const lastWeekXP = (lastWeekXPResult.data || []).reduce(
        (sum, t) => sum + (t.amount || 0),
        0
      );
      const achievementsUnlocked = achievementsResult.count || 0;

      setStats({
        problemsSolved,
        quizzesCompleted,
        templatesUsed: resumeDownloads + outreachUsage,
        weeklyXP,
        achievementsUnlocked,
        problemsChange: problemsThisWeek,
        quizzesChange: quizzesThisWeek,
        templatesChange: templatesThisWeek,
        xpChange: weeklyXP - lastWeekXP,
      });
    } catch (err) {
      console.error("Error fetching activity stats:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
