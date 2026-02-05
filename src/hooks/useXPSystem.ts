 import { useState, useEffect, useCallback, useMemo } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 
 // XP values for different actions
 export const XP_VALUES = {
   QUIZ_COMPLETE: 10,
   QUIZ_PERFECT: 25,
   QUESTION_CORRECT: 2,
   SRS_REVIEW_CORRECT: 5,
   SRS_MASTERED: 50,
   STREAK_DAY: 15,
   ACHIEVEMENT_EARNED: 30,
 };
 
 // Level thresholds (XP required for each level)
 export const LEVEL_THRESHOLDS = [
   0,      // Level 1
   100,    // Level 2
   250,    // Level 3
   500,    // Level 4
   850,    // Level 5
   1300,   // Level 6
   1900,   // Level 7
   2650,   // Level 8
   3550,   // Level 9
   4600,   // Level 10
   5800,   // Level 11
   7150,   // Level 12
   8650,   // Level 13
   10300,  // Level 14
   12100,  // Level 15
   14050,  // Level 16
   16150,  // Level 17
   18400,  // Level 18
   20800,  // Level 19
   23350,  // Level 20
 ];
 
 export const LEVEL_TITLES = [
   "Novice",           // 1
   "Apprentice",       // 2
   "Student",          // 3
   "Scholar",          // 4
   "Practitioner",     // 5
   "Adept",            // 6
   "Expert",           // 7
   "Specialist",       // 8
   "Master",           // 9
   "Grandmaster",      // 10
   "Sage",             // 11
   "Wizard",           // 12
   "Champion",         // 13
   "Legend",           // 14
   "Mythic",           // 15
   "Transcendent",     // 16
   "Immortal",         // 17
   "Divine",           // 18
   "Cosmic",           // 19
   "Ultimate",         // 20
 ];
 
 export function calculateLevel(xp: number): number {
   for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
     if (xp >= LEVEL_THRESHOLDS[i]) {
       return i + 1;
     }
   }
   return 1;
 }
 
 export function getXPForNextLevel(currentLevel: number): number {
   if (currentLevel >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
   return LEVEL_THRESHOLDS[currentLevel];
 }
 
 export function getXPProgress(xp: number, level: number): { current: number; required: number; percentage: number } {
   const currentLevelXP = LEVEL_THRESHOLDS[level - 1] || 0;
   const nextLevelXP = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
   const current = xp - currentLevelXP;
   const required = nextLevelXP - currentLevelXP;
   const percentage = Math.min((current / required) * 100, 100);
   return { current, required, percentage };
 }
 
 export function useXPSystem() {
   const { user } = useAuth();
   const [totalXP, setTotalXP] = useState(0);
   const [currentLevel, setCurrentLevel] = useState(1);
   const [xpThisWeek, setXpThisWeek] = useState(0);
   const [isLoading, setIsLoading] = useState(true);
   const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [pendingLevelUp, setPendingLevelUp] = useState<number | null>(null);
 
   // Fetch XP data
   const fetchXPData = useCallback(async () => {
     if (!user) {
       setIsLoading(false);
       return;
     }
 
     try {
       const { data: profile, error } = await supabase
         .from("user_profiles_extended")
         .select("total_xp, current_level, xp_this_week")
         .eq("user_id", user.id)
         .maybeSingle();
 
       if (!error && profile) {
         setTotalXP(profile.total_xp || 0);
         setCurrentLevel(profile.current_level || 1);
         setXpThisWeek(profile.xp_this_week || 0);
       }
 
       // Fetch recent transactions
       const { data: transactions } = await supabase
         .from("xp_transactions")
         .select("*")
         .eq("user_id", user.id)
         .order("created_at", { ascending: false })
         .limit(10);
 
       if (transactions) {
         setRecentTransactions(transactions);
       }
     } catch (error) {
       console.error("Error fetching XP data:", error);
     } finally {
       setIsLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchXPData();
   }, [fetchXPData]);
 
   // Award XP
   const awardXP = useCallback(async (
     amount: number,
     source: string,
     description?: string,
     showToast: boolean = true
   ) => {
     if (!user || amount <= 0) return;
 
     try {
       // Insert transaction
       await supabase.from("xp_transactions").insert({
         user_id: user.id,
         amount,
         source,
         description,
       });
 
       // Update profile XP
       const newTotalXP = totalXP + amount;
       const newLevel = calculateLevel(newTotalXP);
       const leveledUp = newLevel > currentLevel;
 
       await supabase
         .from("user_profiles_extended")
         .update({
           total_xp: newTotalXP,
           current_level: newLevel,
           xp_this_week: xpThisWeek + amount,
         })
         .eq("user_id", user.id);
 
       setTotalXP(newTotalXP);
       setCurrentLevel(newLevel);
       setXpThisWeek(xpThisWeek + amount);
 
      // Set pending level up for celebration
      if (leveledUp) {
        setPendingLevelUp(newLevel);
       }
 
       return { leveledUp, newLevel, newTotalXP };
     } catch (error) {
       console.error("Error awarding XP:", error);
     }
  }, [user, totalXP, currentLevel, xpThisWeek]);

  const clearPendingLevelUp = useCallback(() => {
    setPendingLevelUp(null);
  }, []);
 
   const progress = useMemo(() => getXPProgress(totalXP, currentLevel), [totalXP, currentLevel]);
   const title = LEVEL_TITLES[currentLevel - 1] || "Ultimate";
 
   return {
     totalXP,
     currentLevel,
     xpThisWeek,
     title,
     progress,
     isLoading,
     recentTransactions,
    pendingLevelUp,
    clearPendingLevelUp,
     awardXP,
     refetch: fetchXPData,
   };
 }