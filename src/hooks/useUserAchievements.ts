 import { useEffect, useState, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { achievements, type Achievement } from "@/components/AchievementBadge";
 
 interface EarnedAchievement {
   achievement_id: string;
   earned_at: string;
 }
 
 interface AchievementProgress {
   topicsCompleted: number;
   streakDays: number;
   revisionTopics: number;
   quizResults: {
     total: number;
     hardCount: number;
     highAccuracyCount: number;
     hasPerfectScore: boolean;
     hasSpeedDemon: boolean;
     hasChallenge: boolean;
     perfectByType: Set<string>;
     quizStreak: number;
   };
 }
 
 export function useUserAchievements() {
   const { user } = useAuth();
   const [earnedAchievements, setEarnedAchievements] = useState<EarnedAchievement[]>([]);
   const [progress, setProgress] = useState<AchievementProgress | null>(null);
   const [loading, setLoading] = useState(true);
 
   const fetchAchievements = useCallback(async () => {
     if (!user) {
       setLoading(false);
       return;
     }
 
     try {
       // Fetch earned achievements
       const { data: achievementsData } = await supabase
         .from("user_achievements")
         .select("achievement_id, earned_at")
         .eq("user_id", user.id);
 
       setEarnedAchievements(achievementsData || []);
 
       // Fetch progress data for unearned achievements
       const [topicsResult, quizResultsData] = await Promise.all([
         supabase
           .from("user_topic_progress")
           .select("completed, is_revision, completed_at")
           .eq("user_id", user.id),
         supabase
           .from("quiz_results")
           .select("accuracy, difficulty, quiz_type, avg_time_seconds, completed_at, category")
           .eq("user_id", user.id)
           .order("completed_at", { ascending: false }),
       ]);
 
       const topics = topicsResult.data || [];
       const quizResults = quizResultsData.data || [];
 
       // Calculate topics stats
       const topicsCompleted = topics.filter((t) => t.completed).length;
       const revisionTopics = topics.filter((t) => t.is_revision).length;
 
       // Calculate streak from topics
       const completedDates = topics
         .filter((t) => t.completed && t.completed_at)
         .map((t) => new Date(t.completed_at!).toDateString());
       const uniqueDates = [...new Set(completedDates)].sort(
         (a, b) => new Date(b).getTime() - new Date(a).getTime()
       );
 
       let streakDays = 0;
       const today = new Date();
       today.setHours(0, 0, 0, 0);
 
       for (let i = 0; i < uniqueDates.length; i++) {
         const checkDate = new Date(today);
         checkDate.setDate(checkDate.getDate() - i);
         if (uniqueDates.includes(checkDate.toDateString())) {
           streakDays++;
         } else {
           break;
         }
       }
 
       // Calculate quiz stats
       const hardCount = quizResults.filter((r) => r.difficulty === "Hard").length;
       const highAccuracyCount = quizResults.filter((r) => r.accuracy >= 80).length;
       const hasPerfectScore = quizResults.some((r) => r.accuracy === 100);
       const hasSpeedDemon = quizResults.some((r) => r.avg_time_seconds < 15);
       const hasChallenge = quizResults.some((r) => r.category?.includes("-"));
       const perfectByType = new Set(
         quizResults.filter((r) => r.accuracy === 100).map((r) => r.quiz_type)
       );
 
       // Calculate quiz streak
       const quizDates = quizResults.map((r) => new Date(r.completed_at).toDateString());
       const uniqueQuizDates = [...new Set(quizDates)];
       let quizStreak = 0;
       for (let i = 0; i < uniqueQuizDates.length; i++) {
         const checkDate = new Date(today);
         checkDate.setDate(checkDate.getDate() - i);
         if (uniqueQuizDates.includes(checkDate.toDateString())) {
           quizStreak++;
         } else {
           break;
         }
       }
 
       setProgress({
         topicsCompleted,
         streakDays,
         revisionTopics,
         quizResults: {
           total: quizResults.length,
           hardCount,
           highAccuracyCount,
           hasPerfectScore,
           hasSpeedDemon,
           hasChallenge,
           perfectByType,
           quizStreak,
         },
       });
     } catch (error) {
       console.error("Error fetching achievements:", error);
     } finally {
       setLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchAchievements();
   }, [fetchAchievements]);
 
   const getAchievementProgress = (achievement: Achievement): { current: number; target: number } => {
     if (!progress) return { current: 0, target: achievement.requirement.value };
 
     const { type, value } = achievement.requirement;
 
     switch (type) {
       case "topics_completed":
         return { current: Math.min(progress.topicsCompleted, value), target: value };
       case "streak_days":
         return { current: Math.min(progress.streakDays, value), target: value };
       case "revision_topics":
         return { current: Math.min(progress.revisionTopics, value), target: value };
       case "quiz_perfect_score":
         if (achievement.id === "quiz_triple_crown") {
           return { current: progress.quizResults.perfectByType.size, target: 3 };
         }
         return { current: progress.quizResults.hasPerfectScore ? 1 : 0, target: 1 };
       case "quiz_speed_demon":
         return { current: progress.quizResults.hasSpeedDemon ? 1 : 0, target: 1 };
       case "quiz_challenge_complete":
         if (achievement.id === "quiz_brain_master") {
           return { current: Math.min(progress.quizResults.hardCount, value), target: value };
         }
         return { current: progress.quizResults.hasChallenge ? 1 : 0, target: 1 };
       case "quiz_accuracy":
         return { current: Math.min(progress.quizResults.highAccuracyCount, value), target: value };
       case "quiz_streak":
         return { current: Math.min(progress.quizResults.quizStreak, value), target: value };
       default:
         return { current: 0, target: value };
     }
   };
 
   const isEarned = (achievementId: string): boolean => {
     return earnedAchievements.some((a) => a.achievement_id === achievementId);
   };
 
   const getEarnedAt = (achievementId: string): string | undefined => {
     return earnedAchievements.find((a) => a.achievement_id === achievementId)?.earned_at;
   };
 
   return {
     achievements,
     earnedAchievements,
     progress,
     loading,
     isEarned,
     getEarnedAt,
     getAchievementProgress,
     refresh: fetchAchievements,
   };
 }