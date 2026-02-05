 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 
 const MILESTONE_DAYS = [7, 14, 30, 60, 100];
 const STORAGE_KEY = "celebrated_milestones";
 
 interface UseStreakMilestoneResult {
   currentStreak: number;
   showMilestone: boolean;
   milestoneStreak: number;
   closeMilestone: () => void;
   checkMilestone: (streak: number) => void;
 }
 
 export const useStreakMilestone = (): UseStreakMilestoneResult => {
   const { user } = useAuth();
   const [currentStreak, setCurrentStreak] = useState(0);
   const [showMilestone, setShowMilestone] = useState(false);
   const [milestoneStreak, setMilestoneStreak] = useState(0);
 
   const getCelebratedMilestones = useCallback((): number[] => {
     if (!user) return [];
     const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
     return stored ? JSON.parse(stored) : [];
   }, [user]);
 
   const setCelebratedMilestone = useCallback((milestone: number) => {
     if (!user) return;
     const celebrated = getCelebratedMilestones();
     if (!celebrated.includes(milestone)) {
       celebrated.push(milestone);
       localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(celebrated));
     }
   }, [user, getCelebratedMilestones]);
 
   const checkMilestone = useCallback((streak: number) => {
     setCurrentStreak(streak);
     
     // Check if this streak hits a milestone that hasn't been celebrated
     const milestone = MILESTONE_DAYS.find((m) => m === streak);
     if (milestone) {
       const celebrated = getCelebratedMilestones();
       if (!celebrated.includes(milestone)) {
         setMilestoneStreak(milestone);
         setShowMilestone(true);
         setCelebratedMilestone(milestone);
       }
     }
   }, [getCelebratedMilestones, setCelebratedMilestone]);
 
   const closeMilestone = useCallback(() => {
     setShowMilestone(false);
   }, []);
 
   // Calculate streak on mount
   useEffect(() => {
     const calculateStreak = async () => {
       if (!user) return;
 
       try {
         // Use quiz_results for quiz streak
         const { data, error } = await supabase
           .from("quiz_results")
           .select("completed_at")
           .eq("user_id", user.id)
           .order("completed_at", { ascending: false });
 
         if (error || !data || data.length === 0) return;
 
         const uniqueDates = [
           ...new Set(
             data.map((item) => new Date(item.completed_at).toLocaleDateString("en-CA"))
           ),
         ].sort((a, b) => b.localeCompare(a));
 
         const today = new Date().toLocaleDateString("en-CA");
         const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
 
         let streak = 0;
         let checkDate = uniqueDates[0] === today ? today : yesterday;
 
         if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
           for (const date of uniqueDates) {
             if (date === checkDate) {
               streak++;
               const prevDate = new Date(checkDate);
               prevDate.setDate(prevDate.getDate() - 1);
               checkDate = prevDate.toLocaleDateString("en-CA");
             } else if (date < checkDate) {
               break;
             }
           }
         }
 
         checkMilestone(streak);
       } catch (err) {
         console.error("Error calculating streak:", err);
       }
     };
 
     calculateStreak();
   }, [user, checkMilestone]);
 
   return {
     currentStreak,
     showMilestone,
     milestoneStreak,
     closeMilestone,
     checkMilestone,
   };
 };