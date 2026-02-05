import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { achievements, type Achievement } from "@/components/AchievementBadge";

interface QuizPerformance {
  accuracy: number;
  avgTimeSeconds: number;
  totalTimeSeconds: number;
  difficulty: string;
  isChallenge: boolean;
  quizType: "aptitude" | "dsa" | "sql";
}

export function useQuizAchievements() {
  const { user } = useAuth();
  const [newlyEarned, setNewlyEarned] = useState<Achievement[]>([]);

  const checkAndAwardAchievements = useCallback(
    async (performance: QuizPerformance) => {
      if (!user) return [];

      const earned: Achievement[] = [];

      try {
        // Get existing achievements
        const { data: existingAchievements } = await supabase
          .from("user_achievements")
          .select("achievement_id")
          .eq("user_id", user.id);

        const existingIds = new Set(existingAchievements?.map((a) => a.achievement_id) || []);

        // Get quiz results stats for more complex achievements
        const { data: quizResults } = await supabase
          .from("quiz_results")
          .select("accuracy, difficulty, quiz_type, completed_at")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false });

        const achievementsToAward: string[] = [];

        // Perfect Score achievement
        if (performance.accuracy === 100 && !existingIds.has("quiz_perfect_score")) {
          achievementsToAward.push("quiz_perfect_score");
          const achievement = achievements.find((a) => a.id === "quiz_perfect_score");
          if (achievement) earned.push(achievement);
        }

        // Speed Demon achievement (avg time under 15 seconds)
        if (performance.avgTimeSeconds < 15 && !existingIds.has("quiz_speed_demon")) {
          achievementsToAward.push("quiz_speed_demon");
          const achievement = achievements.find((a) => a.id === "quiz_speed_demon");
          if (achievement) earned.push(achievement);
        }

        // Challenger achievement (first timed challenge)
        if (performance.isChallenge && !existingIds.has("quiz_challenger")) {
          achievementsToAward.push("quiz_challenger");
          const achievement = achievements.find((a) => a.id === "quiz_challenger");
          if (achievement) earned.push(achievement);
        }

        // Brain Master achievement (5 hard quizzes completed)
        if (performance.difficulty === "Hard" && !existingIds.has("quiz_brain_master")) {
          const hardQuizCount = (quizResults?.filter((r) => r.difficulty === "Hard").length || 0) + 1;
          if (hardQuizCount >= 5) {
            achievementsToAward.push("quiz_brain_master");
            const achievement = achievements.find((a) => a.id === "quiz_brain_master");
            if (achievement) earned.push(achievement);
          }
        }

        // Sharp Mind achievement (80%+ accuracy in 10 quizzes)
        if (performance.accuracy >= 80 && !existingIds.has("quiz_accuracy_80")) {
          const highAccuracyCount = (quizResults?.filter((r) => r.accuracy >= 80).length || 0) + 1;
          if (highAccuracyCount >= 10) {
            achievementsToAward.push("quiz_accuracy_80");
            const achievement = achievements.find((a) => a.id === "quiz_accuracy_80");
            if (achievement) earned.push(achievement);
          }
        }

        // Triple Crown achievement (perfect scores in all 3 quiz types)
        if (performance.accuracy === 100 && !existingIds.has("quiz_triple_crown")) {
          const perfectByType = new Set(
            quizResults?.filter((r) => r.accuracy === 100).map((r) => r.quiz_type) || []
          );
          perfectByType.add(performance.quizType);
          if (perfectByType.has("aptitude") && perfectByType.has("dsa") && perfectByType.has("sql")) {
            achievementsToAward.push("quiz_triple_crown");
            const achievement = achievements.find((a) => a.id === "quiz_triple_crown");
            if (achievement) earned.push(achievement);
          }
        }

        // Quiz Streak achievement (check consecutive days)
        if (!existingIds.has("quiz_streak_5") && quizResults && quizResults.length > 0) {
          const dates = quizResults.map((r) => new Date(r.completed_at).toDateString());
          const uniqueDates = [...new Set(dates)];
          const today = new Date().toDateString();
          if (!uniqueDates.includes(today)) {
            uniqueDates.unshift(today);
          }
          
          let streak = 1;
          for (let i = 1; i < uniqueDates.length && streak < 5; i++) {
            const prevDate = new Date(uniqueDates[i - 1]);
            const currDate = new Date(uniqueDates[i]);
            const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              streak++;
            } else {
              break;
            }
          }
          
          if (streak >= 5) {
            achievementsToAward.push("quiz_streak_5");
            const achievement = achievements.find((a) => a.id === "quiz_streak_5");
            if (achievement) earned.push(achievement);
          }
        }

        // Award new achievements
        if (achievementsToAward.length > 0) {
          const inserts = achievementsToAward.map((achievementId) => ({
            user_id: user.id,
            achievement_id: achievementId,
          }));

          await supabase.from("user_achievements").insert(inserts);
        }

        setNewlyEarned(earned);
        return earned;
      } catch (error) {
        console.error("Error checking quiz achievements:", error);
        return [];
      }
    },
    [user]
  );

  const clearNewlyEarned = useCallback(() => {
    setNewlyEarned([]);
  }, []);

  return { checkAndAwardAchievements, newlyEarned, clearNewlyEarned };
}