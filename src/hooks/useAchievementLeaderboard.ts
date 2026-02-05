 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { achievements } from "@/components/AchievementBadge";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, startOfMonth } from "date-fns";
 
 interface LeaderboardEntry {
   userId: string;
   fullName: string;
   avatarUrl: string | null;
   username: string | null;
   totalAchievements: number;
   rarityScore: number;
   legendaryCount: number;
   epicCount: number;
   rareCount: number;
   achievements: string[];
 }
 
export type SortMode = "rarity" | "total";
export type TimeFilter = "all" | "month" | "week";

 // Rarity weights for scoring
 const RARITY_WEIGHTS = {
   legendary: 100,
   epic: 50,
   rare: 25,
   uncommon: 10,
   common: 5,
 };
 
 const getRarityTier = (percentage: number): keyof typeof RARITY_WEIGHTS => {
   if (percentage >= 50) return "common";
   if (percentage >= 25) return "uncommon";
   if (percentage >= 10) return "rare";
   if (percentage >= 3) return "epic";
   return "legendary";
 };
 
export function useAchievementLeaderboard(sortMode: SortMode = "rarity", timeFilter: TimeFilter = "all") {
   const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<{ rank: number; entry: LeaderboardEntry } | null>(null);
   const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
 
   useEffect(() => {
     const fetchLeaderboard = async () => {
      setIsLoading(true);
       try {
        // Build query with optional date filter
        let query = supabase
           .from("user_achievements")
           .select("user_id, achievement_id");
 
        // Apply time filter
        if (timeFilter === "week") {
          const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
          query = query.gte("earned_at", weekStart);
        } else if (timeFilter === "month") {
          const monthStart = startOfMonth(new Date()).toISOString();
          query = query.gte("earned_at", monthStart);
        }

        const { data: allAchievements, error: achievementsError } = await query;

         if (achievementsError) throw achievementsError;
 
        // If no achievements in time period, return early
        if (!allAchievements || allAchievements.length === 0) {
          setAllEntries([]);
          setLeaderboard([]);
          setCurrentUserRank(null);
          setIsLoading(false);
          return;
        }

         // Calculate total unique users and achievement percentages
         const uniqueUsers = new Set(allAchievements?.map((a) => a.user_id) || []);
         const totalUsers = Math.max(uniqueUsers.size, 1);
 
         // Count occurrences of each achievement
         const achievementCounts = new Map<string, number>();
         allAchievements?.forEach((row) => {
           const current = achievementCounts.get(row.achievement_id) || 0;
           achievementCounts.set(row.achievement_id, current + 1);
         });
 
         // Calculate rarity for each achievement
         const achievementRarity = new Map<string, keyof typeof RARITY_WEIGHTS>();
         achievements.forEach((achievement) => {
           const count = achievementCounts.get(achievement.id) || 0;
           const percentage = (count / totalUsers) * 100;
           achievementRarity.set(achievement.id, getRarityTier(percentage));
         });
 
         // Group achievements by user
         const userAchievements = new Map<string, string[]>();
         allAchievements?.forEach((row) => {
           const existing = userAchievements.get(row.user_id) || [];
           existing.push(row.achievement_id);
           userAchievements.set(row.user_id, existing);
         });
 
         // Get user profiles
         const userIds = Array.from(userAchievements.keys());
         const { data: profiles, error: profilesError } = await supabase
           .from("profiles")
           .select("user_id, full_name, avatar_url")
           .in("user_id", userIds);
 
         if (profilesError) throw profilesError;
 
         // Get extended profiles for usernames
         const { data: extendedProfiles, error: extendedError } = await supabase
           .from("user_profiles_extended")
           .select("user_id, username")
           .in("user_id", userIds);
 
         if (extendedError) throw extendedError;
 
         const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
         const usernameMap = new Map(extendedProfiles?.map((p) => [p.user_id, p.username]) || []);
 
         // Build leaderboard entries
         const entries: LeaderboardEntry[] = [];
        userAchievements.forEach((achievementIds, odId) => {
          const profile = profileMap.get(odId);
           let rarityScore = 0;
           let legendaryCount = 0;
           let epicCount = 0;
           let rareCount = 0;
 
           achievementIds.forEach((id) => {
             const rarity = achievementRarity.get(id) || "common";
             rarityScore += RARITY_WEIGHTS[rarity];
             if (rarity === "legendary") legendaryCount++;
             if (rarity === "epic") epicCount++;
             if (rarity === "rare") rareCount++;
           });
 
           entries.push({
            userId: odId,
             fullName: profile?.full_name || "Anonymous",
             avatarUrl: profile?.avatar_url || null,
            username: usernameMap.get(odId) || null,
             totalAchievements: achievementIds.length,
             rarityScore,
             legendaryCount,
             epicCount,
             rareCount,
             achievements: achievementIds,
           });
         });
 
        setAllEntries(entries);
       } catch (error) {
         console.error("Error fetching achievement leaderboard:", error);
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchLeaderboard();
  }, [timeFilter]);
 
  // Sort and slice based on mode
  useEffect(() => {
    if (allEntries.length === 0) return;

    const sorted = [...allEntries].sort((a, b) => {
      if (sortMode === "rarity") {
        return b.rarityScore - a.rarityScore;
      }
      return b.totalAchievements - a.totalAchievements;
    });

    // Find current user's rank
    if (user) {
      const userIndex = sorted.findIndex((e) => e.userId === user.id);
      if (userIndex !== -1) {
        setCurrentUserRank({ rank: userIndex + 1, entry: sorted[userIndex] });
      } else {
        setCurrentUserRank(null);
      }
    }

    setLeaderboard(sorted.slice(0, 50));
  }, [allEntries, sortMode, user]);

  return { leaderboard, currentUserRank, isLoading };
 }