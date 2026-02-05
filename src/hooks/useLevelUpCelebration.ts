 import { useState, useCallback, useEffect, useRef } from "react";
 
 export function useLevelUpCelebration() {
   const [celebratingLevel, setCelebratingLevel] = useState<number | null>(null);
   const lastLevelRef = useRef<number | null>(null);
 
   const checkLevelUp = useCallback((previousLevel: number, newLevel: number) => {
     if (newLevel > previousLevel && previousLevel > 0) {
       setCelebratingLevel(newLevel);
       return true;
     }
     return false;
   }, []);
 
   const triggerCelebration = useCallback((level: number) => {
     setCelebratingLevel(level);
   }, []);
 
   const dismissCelebration = useCallback(() => {
     setCelebratingLevel(null);
   }, []);
 
   // Track level changes
   const trackLevel = useCallback((currentLevel: number) => {
     if (lastLevelRef.current !== null && currentLevel > lastLevelRef.current) {
       setCelebratingLevel(currentLevel);
     }
     lastLevelRef.current = currentLevel;
   }, []);
 
   return {
     celebratingLevel,
     checkLevelUp,
     triggerCelebration,
     dismissCelebration,
     trackLevel,
   };
 }