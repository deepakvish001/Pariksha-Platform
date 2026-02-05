 import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { achievements, type Achievement } from "@/components/AchievementBadge";
 import { useToast } from "@/hooks/use-toast";
 import confetti from "canvas-confetti";
 
 interface AchievementNotificationContextType {
   checkAndNotifyNewAchievements: () => Promise<void>;
   notifyAchievement: (achievement: Achievement) => void;
 }
 
 const AchievementNotificationContext = createContext<AchievementNotificationContextType | undefined>(undefined);
 
 export function AchievementNotificationProvider({ children }: { children: ReactNode }) {
   const { user } = useAuth();
   const { toast } = useToast();
   const [lastCheckedIds, setLastCheckedIds] = useState<Set<string>>(new Set());
   const [isInitialized, setIsInitialized] = useState(false);
 
   // Initialize with current achievements on mount
   useEffect(() => {
     const initializeAchievements = async () => {
       if (!user) {
         setIsInitialized(false);
         setLastCheckedIds(new Set());
         return;
       }
 
       try {
         const { data } = await supabase
           .from("user_achievements")
           .select("achievement_id")
           .eq("user_id", user.id);
 
         if (data) {
           setLastCheckedIds(new Set(data.map((a) => a.achievement_id)));
         }
         setIsInitialized(true);
       } catch (error) {
         console.error("Error initializing achievements:", error);
       }
     };
 
     initializeAchievements();
   }, [user]);
 
   const triggerCelebration = useCallback(() => {
     confetti({
       particleCount: 80,
       spread: 60,
       origin: { y: 0.7 },
       colors: ["#fbbf24", "#f59e0b", "#d97706", "#10b981", "#8b5cf6"],
     });
   }, []);
 
   const notifyAchievement = useCallback((achievement: Achievement) => {
     triggerCelebration();
     toast({
       title: "🏆 Achievement Unlocked!",
       description: `${achievement.name}: ${achievement.description}`,
     });
   }, [toast, triggerCelebration]);
 
   const checkAndNotifyNewAchievements = useCallback(async () => {
     if (!user || !isInitialized) return;
 
     try {
       const { data } = await supabase
         .from("user_achievements")
         .select("achievement_id")
         .eq("user_id", user.id);
 
       if (!data) return;
 
       const currentIds = new Set(data.map((a) => a.achievement_id));
       
       // Find newly earned achievements
       const newAchievementIds = [...currentIds].filter((id) => !lastCheckedIds.has(id));
       
       if (newAchievementIds.length > 0) {
         // Notify for each new achievement
         newAchievementIds.forEach((id) => {
           const achievement = achievements.find((a) => a.id === id);
           if (achievement) {
             notifyAchievement(achievement);
           }
         });
 
         // Update the tracked IDs
         setLastCheckedIds(currentIds);
       }
     } catch (error) {
       console.error("Error checking achievements:", error);
     }
   }, [user, isInitialized, lastCheckedIds, notifyAchievement]);
 
   return (
     <AchievementNotificationContext.Provider value={{ checkAndNotifyNewAchievements, notifyAchievement }}>
       {children}
     </AchievementNotificationContext.Provider>
   );
 }
 
 export function useAchievementNotification() {
   const context = useContext(AchievementNotificationContext);
   if (context === undefined) {
     throw new Error("useAchievementNotification must be used within an AchievementNotificationProvider");
   }
   return context;
 }