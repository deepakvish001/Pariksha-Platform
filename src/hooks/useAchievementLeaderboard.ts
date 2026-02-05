 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { achievements } from "@/components/AchievementBadge";
 
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
 
 export function useAchievementLeaderboard() {
   const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     const fetchLeaderboard = async () => {
       try {
         // Get all user achievements
         const { data: allAchievements, error: achievementsError } = await supabase
           .from("user_achievements")
           .select("user_id, achievement_id");
 
         if (achievementsError) throw achievementsError;
 
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
         userAchievements.forEach((achievementIds, oderId) => {
           const profile = profileMap.get(oderId);
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
             userId: oderId,
             fullName: profile?.full_name || "Anonymous",
             avatarUrl: profile?.avatar_url || null,
             username: usernameMap.get(oderId) || null,
             totalAchievements: achievementIds.length,
             rarityScore,
             legendaryCount,
             epicCount,
             rareCount,
             achievements: achievementIds,
           });
         });
 
         // Sort by rarity score (highest first)
         entries.sort((a, b) => b.rarityScore - a.rarityScore);
 
         setLeaderboard(entries.slice(0, 50)); // Top 50
       } catch (error) {
         console.error("Error fetching achievement leaderboard:", error);
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchLeaderboard();
   }, []);
 
   return { leaderboard, isLoading };
 }