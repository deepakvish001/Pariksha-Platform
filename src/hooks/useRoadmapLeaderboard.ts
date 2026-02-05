import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, startOfMonth, isAfter } from "date-fns";

export interface RoadmapLeaderboardEntry {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  completed_topics: number;
  roadmaps_started: number;
  last_completed_at: string | null;
  rank: number;
}

export type TimeFrame = "all" | "week" | "month";

export function useRoadmapLeaderboard(timeFrame: TimeFrame = "all", limit: number = 20) {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<RoadmapLeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<RoadmapLeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch roadmap progress aggregated by user
      const { data: progressData, error } = await supabase
        .from("user_topic_progress")
        .select("user_id, topic_id, completed, sheet_id, completed_at")
        .like("sheet_id", "roadmap-tree-%")
        .eq("completed", true);

      if (error) {
        console.error("Error fetching roadmap progress:", error);
        return;
      }

      // Get time filter cutoff date
      const now = new Date();
      let cutoffDate: Date | null = null;
      if (timeFrame === "week") {
        cutoffDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      } else if (timeFrame === "month") {
        cutoffDate = startOfMonth(now);
      }

      // Aggregate by user with time filter
      const userProgress = new Map<string, { 
        completed_topics: number; 
        roadmaps: Set<string>; 
        last_completed_at: string | null 
      }>();

      progressData?.forEach(item => {
        // Apply time filter
        if (cutoffDate && item.completed_at) {
          const completedDate = new Date(item.completed_at);
          if (!isAfter(completedDate, cutoffDate)) {
            return; // Skip items before cutoff
          }
        }

        const existing = userProgress.get(item.user_id) || {
          completed_topics: 0,
          roadmaps: new Set<string>(),
          last_completed_at: null,
        };

        existing.completed_topics += 1;
        existing.roadmaps.add(item.sheet_id);
        if (item.completed_at && (!existing.last_completed_at || item.completed_at > existing.last_completed_at)) {
          existing.last_completed_at = item.completed_at;
        }

        userProgress.set(item.user_id, existing);
      });

      // Sort by completed topics
      const sortedUsers = Array.from(userProgress.entries())
        .map(([user_id, data]) => ({
          user_id,
          completed_topics: data.completed_topics,
          roadmaps_started: data.roadmaps.size,
          last_completed_at: data.last_completed_at,
        }))
        .sort((a, b) => b.completed_topics - a.completed_topics)
        .slice(0, limit);

      if (sortedUsers.length === 0) {
        setLeaderboard([]);
        setIsLoading(false);
        return;
      }

      // Fetch user profiles
      const userIds = sortedUsers.map(u => u.user_id);
      
      const [profilesResult, extendedResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds),
        supabase
          .from("user_profiles_extended")
          .select("user_id, username")
          .in("user_id", userIds),
      ]);

      const profileMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
      const extendedMap = new Map(extendedResult.data?.map(p => [p.user_id, p]) || []);

      const entries: RoadmapLeaderboardEntry[] = sortedUsers.map((entry, idx) => {
        const profile = profileMap.get(entry.user_id);
        const extended = extendedMap.get(entry.user_id);
        return {
          user_id: entry.user_id,
          username: extended?.username || null,
          full_name: profile?.full_name || null,
          avatar_url: profile?.avatar_url || null,
          completed_topics: entry.completed_topics,
          roadmaps_started: entry.roadmaps_started,
          last_completed_at: entry.last_completed_at,
          rank: idx + 1,
        };
      });

      setLeaderboard(entries);

      // Find current user's rank
      if (user) {
        const currentUserEntry = entries.find(e => e.user_id === user.id);
        if (currentUserEntry) {
          setUserRank(currentUserEntry);
        } else {
          // User not in top N, calculate their stats
          const userData = userProgress.get(user.id);
          if (userData && userData.completed_topics > 0) {
            const { data: userProfile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("user_id", user.id)
              .maybeSingle();

            const { data: userExtended } = await supabase
              .from("user_profiles_extended")
              .select("username")
              .eq("user_id", user.id)
              .maybeSingle();

            // Count users with more completed topics
            const usersAhead = Array.from(userProgress.values())
              .filter(u => u.completed_topics > userData.completed_topics).length;

            setUserRank({
              user_id: user.id,
              username: userExtended?.username || null,
              full_name: userProfile?.full_name || null,
              avatar_url: userProfile?.avatar_url || null,
              completed_topics: userData.completed_topics,
              roadmaps_started: userData.roadmaps.size,
              last_completed_at: userData.last_completed_at,
              rank: usersAhead + 1,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching roadmap leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [limit, user, timeFrame]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    userRank,
    isLoading,
    refetch: fetchLeaderboard,
  };
}
