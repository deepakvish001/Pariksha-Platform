 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { achievements } from "@/components/AchievementBadge";
 
 interface AchievementRarity {
   achievementId: string;
   earnedCount: number;
   totalUsers: number;
   percentage: number;
   rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
 }
 
 const getRarityTier = (percentage: number): AchievementRarity["rarity"] => {
   if (percentage >= 50) return "common";
   if (percentage >= 25) return "uncommon";
   if (percentage >= 10) return "rare";
   if (percentage >= 3) return "epic";
   return "legendary";
 };
 
 export function useAchievementRarity() {
   const [rarityData, setRarityData] = useState<Map<string, AchievementRarity>>(new Map());
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     const fetchRarityData = async () => {
       try {
         // Get total unique users who have any achievements
         const { data: totalData, error: totalError } = await supabase
           .from("user_achievements")
           .select("user_id")
           .limit(1000);
 
         if (totalError) throw totalError;
 
         const uniqueUsers = new Set(totalData?.map((d) => d.user_id) || []);
         const totalUsers = Math.max(uniqueUsers.size, 1); // Avoid division by zero
 
         // Get count per achievement
         const { data: achievementCounts, error: countsError } = await supabase
           .from("user_achievements")
           .select("achievement_id");
 
         if (countsError) throw countsError;
 
         // Count occurrences of each achievement
         const countMap = new Map<string, number>();
         achievementCounts?.forEach((row) => {
           const current = countMap.get(row.achievement_id) || 0;
           countMap.set(row.achievement_id, current + 1);
         });
 
         // Build rarity data for all achievements
         const rarityMap = new Map<string, AchievementRarity>();
         achievements.forEach((achievement) => {
           const earnedCount = countMap.get(achievement.id) || 0;
           const percentage = totalUsers > 0 ? (earnedCount / totalUsers) * 100 : 0;
           rarityMap.set(achievement.id, {
             achievementId: achievement.id,
             earnedCount,
             totalUsers,
             percentage,
             rarity: getRarityTier(percentage),
           });
         });
 
         setRarityData(rarityMap);
       } catch (error) {
         console.error("Error fetching achievement rarity:", error);
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchRarityData();
   }, []);
 
   const getRarity = (achievementId: string): AchievementRarity | undefined => {
     return rarityData.get(achievementId);
   };
 
   return { rarityData, getRarity, isLoading };
 }