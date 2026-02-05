 import { useEffect, useRef, useCallback } from "react";
 import { useToast } from "@/hooks/use-toast";
 import confetti from "canvas-confetti";
 
 interface XPGoalNotificationsProps {
   todayXP: number;
   weekXP: number;
   dailyTarget: number;
   weeklyTarget: number;
 }
 
 export function useXPGoalNotifications({
   todayXP,
   weekXP,
   dailyTarget,
   weeklyTarget,
 }: XPGoalNotificationsProps) {
   const { toast } = useToast();
   const lastNotifiedDaily = useRef<string | null>(null);
   const lastNotifiedWeekly = useRef<string | null>(null);
 
   const getDateKey = () => new Date().toISOString().split("T")[0];
   
   const getWeekKey = () => {
     const now = new Date();
     const startOfYear = new Date(now.getFullYear(), 0, 1);
     const weekNumber = Math.ceil(
       ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
     );
     return `${now.getFullYear()}-W${weekNumber}`;
   };
 
   const triggerCelebration = useCallback(() => {
     confetti({
       particleCount: 100,
       spread: 70,
       origin: { y: 0.6 },
       colors: ["#fbbf24", "#f59e0b", "#d97706", "#10b981", "#3b82f6"],
     });
   }, []);
 
   useEffect(() => {
     const dateKey = getDateKey();
     const weekKey = getWeekKey();
 
     // Check daily goal
     if (
       dailyTarget > 0 &&
       todayXP >= dailyTarget &&
       lastNotifiedDaily.current !== dateKey
     ) {
       triggerCelebration();
       toast({
         title: "🎯 Daily XP Goal Achieved!",
         description: `You've earned ${todayXP} XP today. Keep up the momentum!`,
       });
       lastNotifiedDaily.current = dateKey;
     }
 
     // Check weekly goal
     if (
       weeklyTarget > 0 &&
       weekXP >= weeklyTarget &&
       lastNotifiedWeekly.current !== weekKey
     ) {
       triggerCelebration();
       toast({
         title: "🏆 Weekly XP Goal Achieved!",
         description: `You've earned ${weekXP} XP this week. Amazing progress!`,
       });
       lastNotifiedWeekly.current = weekKey;
     }
   }, [todayXP, weekXP, dailyTarget, weeklyTarget, toast, triggerCelebration]);
 }