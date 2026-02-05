 import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import LevelUpCelebration from "@/components/LevelUpCelebration";
 
 interface LevelUpContextType {
   checkForLevelUp: (newLevel: number) => void;
  triggerCelebration: (level: number) => void;
 }
 
 const LevelUpContext = createContext<LevelUpContextType | undefined>(undefined);
 
 export function LevelUpProvider({ children }: { children: ReactNode }) {
   const { user } = useAuth();
   const [lastKnownLevel, setLastKnownLevel] = useState<number | null>(null);
   const [celebratingLevel, setCelebratingLevel] = useState<number | null>(null);
 
   // Initialize with current level
   useEffect(() => {
     const fetchCurrentLevel = async () => {
       if (!user) {
         setLastKnownLevel(null);
         return;
       }
 
       try {
         const { data } = await supabase
           .from("user_profiles_extended")
           .select("current_level")
           .eq("user_id", user.id)
           .maybeSingle();
 
         if (data) {
           setLastKnownLevel(data.current_level || 1);
         }
       } catch (error) {
         console.error("Error fetching level:", error);
       }
     };
 
     fetchCurrentLevel();
   }, [user]);
 
   // Subscribe to level changes
   useEffect(() => {
     if (!user) return;
 
     const channel = supabase
       .channel("level-changes")
       .on(
         "postgres_changes",
         {
           event: "UPDATE",
           schema: "public",
           table: "user_profiles_extended",
           filter: `user_id=eq.${user.id}`,
         },
         (payload) => {
           const newLevel = payload.new.current_level;
           if (lastKnownLevel !== null && newLevel > lastKnownLevel) {
             setCelebratingLevel(newLevel);
           }
           setLastKnownLevel(newLevel);
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [user, lastKnownLevel]);
 
   const checkForLevelUp = useCallback((newLevel: number) => {
     if (lastKnownLevel !== null && newLevel > lastKnownLevel) {
       setCelebratingLevel(newLevel);
     }
     setLastKnownLevel(newLevel);
   }, [lastKnownLevel]);
 
  const triggerCelebration = useCallback((level: number) => {
    setCelebratingLevel(level);
  }, []);

   const handleDismiss = () => {
     setCelebratingLevel(null);
   };
 
   return (
    <LevelUpContext.Provider value={{ checkForLevelUp, triggerCelebration }}>
       {children}
       {celebratingLevel !== null && (
         <LevelUpCelebration level={celebratingLevel} onClose={handleDismiss} />
       )}
     </LevelUpContext.Provider>
   );
 }
 
 export function useLevelUp() {
   const context = useContext(LevelUpContext);
   if (context === undefined) {
     throw new Error("useLevelUp must be used within a LevelUpProvider");
   }
   return context;
 }