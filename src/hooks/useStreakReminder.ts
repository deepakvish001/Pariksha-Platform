 import { useEffect, useRef, useCallback } from "react";
 import { useToast } from "@/hooks/use-toast";
 import { useStreak } from "@/hooks/useStreak";
 import { useAuth } from "@/contexts/AuthContext";
 
 const REMINDER_MESSAGES = [
   { title: "🔥 Keep your streak alive!", message: "You haven't completed any topics today. Don't break your streak!" },
   { title: "💪 Time to practice!", message: "A quick study session can make all the difference. Start now!" },
   { title: "📚 Don't forget to study!", message: "Consistency is key to success. Complete a topic today!" },
   { title: "⚡ Stay on track!", message: "Your streak is waiting! Complete a topic to keep the momentum." },
   { title: "🎯 Daily goal reminder", message: "You're one topic away from maintaining your progress!" },
 ];
 
 export function useStreakReminder() {
   const { user } = useAuth();
   const { toast } = useToast();
   const { todayCompleted, currentStreak, isLoading } = useStreak();
   const hasRemindedToday = useRef<string | null>(null);
 
   const getDateKey = () => new Date().toISOString().split("T")[0];
 
   const shouldRemind = useCallback(() => {
     const now = new Date();
     const hour = now.getHours();
     
     // Only remind between 10 AM and 9 PM
     if (hour < 10 || hour > 21) return false;
     
     // Don't remind if already completed today
     if (todayCompleted) return false;
     
     // Only remind if user has an active streak to protect
     if (currentStreak === 0) return false;
     
     // Don't remind more than once per day
     const dateKey = getDateKey();
     if (hasRemindedToday.current === dateKey) return false;
     
     return true;
   }, [todayCompleted, currentStreak]);
 
   const triggerReminder = useCallback(() => {
     const dateKey = getDateKey();
     
     if (!shouldRemind()) return;
     
     const randomMessage = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
     
     toast({
       title: randomMessage.title,
       description: `${randomMessage.message} (${currentStreak} day streak)`,
       duration: 6000,
     });
     
     hasRemindedToday.current = dateKey;
   }, [shouldRemind, currentStreak, toast]);
 
   useEffect(() => {
     if (!user || isLoading) return;
     
     // Check on initial load (with a delay to not overwhelm)
     const initialTimer = setTimeout(() => {
       if (shouldRemind()) {
         // Only trigger if it's been a while since login (afternoon/evening)
         const hour = new Date().getHours();
         if (hour >= 14) {
           triggerReminder();
         }
       }
     }, 5000);
 
     // Set up periodic check (every 2 hours)
     const intervalId = setInterval(() => {
       triggerReminder();
     }, 2 * 60 * 60 * 1000);
 
     return () => {
       clearTimeout(initialTimer);
       clearInterval(intervalId);
     };
   }, [user, isLoading, shouldRemind, triggerReminder]);
 
   return { triggerReminder };
 }