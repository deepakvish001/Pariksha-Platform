 import { useEffect, useCallback } from "react";
 import { useXPSystem, XP_VALUES, LEVEL_TITLES } from "@/hooks/useXPSystem";
 import { useLevelUp } from "@/contexts/LevelUpContext";
 import { useToast } from "@/hooks/use-toast";
 
 // This hook wraps useXPSystem and adds notifications
 export function useXPWithNotifications() {
   const xpSystem = useXPSystem();
   const { triggerCelebration } = useLevelUp();
   const { toast } = useToast();
 
   // Watch for level ups
   useEffect(() => {
     if (xpSystem.pendingLevelUp) {
       triggerCelebration(xpSystem.pendingLevelUp);
       xpSystem.clearPendingLevelUp();
     }
   }, [xpSystem.pendingLevelUp, triggerCelebration, xpSystem.clearPendingLevelUp]);
 
   // Enhanced awardXP that shows toasts
   const awardXPWithToast = useCallback(async (
     amount: number,
     source: string,
     description?: string,
     showToast: boolean = true
   ) => {
     const result = await xpSystem.awardXP(amount, source, description, showToast);
     
     if (showToast && result) {
       if (!result.leveledUp) {
         // Only show XP toast if not leveling up (level up has its own celebration)
         toast({
           title: `+${amount} XP`,
           description: description || source,
           duration: 2000,
         });
       }
     }
     
     return result;
   }, [xpSystem, toast]);
 
   return {
     ...xpSystem,
     awardXP: awardXPWithToast,
   };
 }
 
 // Re-export for convenience
 export { XP_VALUES, LEVEL_TITLES };