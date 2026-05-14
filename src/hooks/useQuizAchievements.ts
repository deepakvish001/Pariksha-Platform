import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { achievements, type Achievement } from "@/components/AchievementBadge";
 import { useToast } from "@/hooks/use-toast";
 import confetti from "canvas-confetti";

interface QuizPerformance {
  accuracy: number;
  avgTimeSeconds: number;
  totalTimeSeconds: number;
  difficulty: string;
  isChallenge: boolean;
  quizType: "aptitude" | "dsa" | "sql" | "cs";
}

export function useQuizAchievements() {
  const { user } = useAuth();
   const { toast } = useToast();
  const [newlyEarned, setNewlyEarned] = useState<Achievement[]>([]);

   const triggerCelebration = useCallback((achievement: Achievement) => {
     confetti({
       particleCount: 80,
       spread: 60,
       origin: { y: 0.7 },
       colors: ["#fbbf24", "#f59e0b", "#d97706", "#10b981", "#8b5cf6"],
     });
   }, []);
 
  const checkAndAwardAchievements = useCallback(
    async (_performance: QuizPerformance) => {
      if (!user) return [];
      try {
        // Server-side validation: recomputes eligibility from real data and inserts only earned ones.
        const { data: newIds, error } = await supabase.rpc("award_earned_achievements");
        if (error) {
          console.error("award_earned_achievements failed:", error);
          return [];
        }
        const earned: Achievement[] = (newIds ?? [])
          .map((id: string) => achievements.find((a) => a.id === id))
          .filter((a): a is Achievement => Boolean(a));
        earned.forEach((achievement) => triggerCelebration(achievement));
        setNewlyEarned(earned);
        return earned;
      } catch (error) {
        console.error("Error checking quiz achievements:", error);
        return [];
      }
    },
    [user, triggerCelebration]
  );

  const clearNewlyEarned = useCallback(() => {
    setNewlyEarned([]);
  }, []);

  return { checkAndAwardAchievements, newlyEarned, clearNewlyEarned };
}