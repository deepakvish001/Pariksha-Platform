 import { useState, useEffect, useCallback } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 
 interface XPGoals {
   dailyXpTarget: number;
   weeklyXpTarget: number;
 }
 
 export function useXPGoals() {
   const { user } = useAuth();
   const [goals, setGoals] = useState<XPGoals>({ dailyXpTarget: 50, weeklyXpTarget: 300 });
   const [todayXP, setTodayXP] = useState(0);
   const [weekXP, setWeekXP] = useState(0);
   const [isLoading, setIsLoading] = useState(true);
 
   const fetchGoalsAndProgress = useCallback(async () => {
     if (!user) {
       setIsLoading(false);
       return;
     }
 
     try {
       // Fetch goals
       const { data: goalsData } = await supabase
         .from("user_goals")
         .select("daily_xp_target, weekly_xp_target")
         .eq("user_id", user.id)
         .maybeSingle();
 
       if (goalsData) {
         setGoals({
           dailyXpTarget: goalsData.daily_xp_target || 50,
           weeklyXpTarget: goalsData.weekly_xp_target || 300,
         });
       }
 
       // Calculate today's XP from transactions
       const today = new Date();
       today.setHours(0, 0, 0, 0);
       
       const { data: todayTransactions } = await supabase
         .from("xp_transactions")
         .select("amount")
         .eq("user_id", user.id)
         .gte("created_at", today.toISOString());
 
       const todayTotal = todayTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
       setTodayXP(todayTotal);
 
       // Get weekly XP from profile
       const { data: profile } = await supabase
         .from("user_profiles_extended")
         .select("xp_this_week")
         .eq("user_id", user.id)
         .maybeSingle();
 
       setWeekXP(profile?.xp_this_week || 0);
     } catch (error) {
       console.error("Error fetching XP goals:", error);
     } finally {
       setIsLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchGoalsAndProgress();
   }, [fetchGoalsAndProgress]);
 
   const updateGoals = useCallback(async (newGoals: Partial<XPGoals>) => {
     if (!user) return;
 
     try {
       const updates: Record<string, number> = {};
       if (newGoals.dailyXpTarget !== undefined) updates.daily_xp_target = newGoals.dailyXpTarget;
       if (newGoals.weeklyXpTarget !== undefined) updates.weekly_xp_target = newGoals.weeklyXpTarget;
 
       const { error } = await supabase
         .from("user_goals")
         .upsert({
           user_id: user.id,
           ...updates,
         }, { onConflict: "user_id" });
 
       if (!error) {
         setGoals(prev => ({ ...prev, ...newGoals }));
       }
     } catch (error) {
       console.error("Error updating XP goals:", error);
     }
   }, [user]);
 
   const dailyProgress = goals.dailyXpTarget > 0 
     ? Math.min((todayXP / goals.dailyXpTarget) * 100, 100) 
     : 0;
   
   const weeklyProgress = goals.weeklyXpTarget > 0 
     ? Math.min((weekXP / goals.weeklyXpTarget) * 100, 100) 
     : 0;
 
   return {
     goals,
     todayXP,
     weekXP,
     dailyProgress,
     weeklyProgress,
     isLoading,
     updateGoals,
     refetch: fetchGoalsAndProgress,
   };
 }