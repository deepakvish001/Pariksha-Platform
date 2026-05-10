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
  fundamentalsQuizResults: {
    total: number;
    highAccuracyCount: number;
    veryHighAccuracyCount: number;
    hasPerfectScore: boolean;
    hasLanguagePerfect: boolean;
    hasOopsPerfect: boolean;
  };
  fundamentalsStreak: number;
  systemDesignQuizResults: {
    total: number;
    highAccuracyCount: number;
    veryHighAccuracyCount: number;
    hasPerfectScore: boolean;
    hasHLDPerfect: boolean;
    hasLLDPerfect: boolean;
  };
  researchQuizResults: {
    total: number;
    highAccuracyCount: number;
    veryHighAccuracyCount: number;
    hasPerfectScore: boolean;
    hasJobPortalPerfect: boolean;
    hasJobPortalQuiz: boolean;
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
       const [topicsResult, quizResultsData, fundamentalsTopicsResult] = await Promise.all([
         supabase
           .from("user_topic_progress")
           .select("completed, is_revision, completed_at")
           .eq("user_id", user.id),
         supabase
           .from("quiz_results")
           .select("accuracy, difficulty, quiz_type, avg_time_seconds, completed_at, category")
           .eq("user_id", user.id)
           .order("completed_at", { ascending: false }),
         supabase
           .from("user_topic_progress")
           .select("completed_at, sheet_id")
           .eq("user_id", user.id)
           .eq("completed", true)
           .or("sheet_id.like.language-%,sheet_id.eq.oops-concepts"),
       ]);
 
       const topics = topicsResult.data || [];
       const quizResults = quizResultsData.data || [];
       const fundamentalsTopics = fundamentalsTopicsResult.data || [];

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

       // Calculate fundamentals streak (language-* and oops-concepts topics)
       const fundamentalsDates = fundamentalsTopics
         .filter((t) => t.completed_at)
         .map((t) => new Date(t.completed_at!).toDateString());
       const uniqueFundamentalsDates = [...new Set(fundamentalsDates)].sort(
         (a, b) => new Date(b).getTime() - new Date(a).getTime()
       );

       let fundamentalsStreak = 0;
       for (let i = 0; i < uniqueFundamentalsDates.length; i++) {
         const checkDate = new Date(today);
         checkDate.setDate(checkDate.getDate() - i);
         if (uniqueFundamentalsDates.includes(checkDate.toDateString())) {
           fundamentalsStreak++;
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

        // Calculate fundamentals quiz stats (language-* and oops-*)
        const fundamentalsQuizzes = quizResults.filter(
          (r) => r.quiz_type.startsWith("language-") || r.quiz_type.startsWith("oops-")
        );
        const fundamentalsTotal = fundamentalsQuizzes.length;
        const fundamentalsHighAccuracy = fundamentalsQuizzes.filter((r) => r.accuracy >= 80).length;
        const fundamentalsVeryHighAccuracy = fundamentalsQuizzes.filter((r) => r.accuracy >= 90).length;
        const fundamentalsHasPerfect = fundamentalsQuizzes.some((r) => r.accuracy === 100);
        const hasLanguagePerfect = fundamentalsQuizzes.some(
          (r) => r.quiz_type.startsWith("language-") && r.accuracy === 100
        );
        const hasOopsPerfect = fundamentalsQuizzes.some(
          (r) => r.quiz_type.startsWith("oops-") && r.accuracy === 100
        );

        // Calculate system design quiz stats (hld-* and lld-*)
        const systemDesignQuizzes = quizResults.filter(
          (r) => r.quiz_type.startsWith("hld-") || r.quiz_type.startsWith("lld-")
        );
        const systemDesignTotal = systemDesignQuizzes.length;
        const systemDesignHighAccuracy = systemDesignQuizzes.filter((r) => r.accuracy >= 80).length;
        const systemDesignVeryHighAccuracy = systemDesignQuizzes.filter((r) => r.accuracy >= 90).length;
        const systemDesignHasPerfect = systemDesignQuizzes.some((r) => r.accuracy === 100);
        const hasHLDPerfect = systemDesignQuizzes.some(
          (r) => r.quiz_type.startsWith("hld-") && r.accuracy === 100
        );
         const hasLLDPerfect = systemDesignQuizzes.some(
           (r) => r.quiz_type.startsWith("lld-") && r.accuracy === 100
         );

         // Calculate research quiz stats (job-portal-* and roadmap-*)
         const researchQuizzes = quizResults.filter(
           (r) => r.quiz_type.startsWith("job-portal-") || r.quiz_type.startsWith("roadmap-")
         );
         const researchTotal = researchQuizzes.length;
         const researchHighAccuracy = researchQuizzes.filter((r) => r.accuracy >= 80).length;
         const researchVeryHighAccuracy = researchQuizzes.filter((r) => r.accuracy >= 90).length;
         const researchHasPerfect = researchQuizzes.some((r) => r.accuracy === 100);
         const hasJobPortalPerfect = researchQuizzes.some(
           (r) => r.quiz_type.startsWith("job-portal-") && r.accuracy === 100
         );
         const hasRoadmapPerfect = researchQuizzes.some(
           (r) => r.quiz_type.startsWith("roadmap-") && r.accuracy === 100
         );
          const hasJobPortalQuiz = researchQuizzes.some((r) => r.quiz_type.startsWith("job-portal-"));
          const hasRoadmapQuiz = researchQuizzes.some((r) => r.quiz_type.startsWith("roadmap-"));

          // Calculate roadmap progress
          const roadmapData = roadmapProgressResult.data || [];
          const roadmapByPath = new Map<string, { total: number; completed: number }>();
          
          roadmapData.forEach((item) => {
            // Extract roadmap path from sheet_id like "roadmap-tree-frontend"
            const pathMatch = item.sheet_id.match(/roadmap-tree-(\w+)/);
            if (pathMatch) {
              const path = pathMatch[1];
              const existing = roadmapByPath.get(path) || { total: 0, completed: 0 };
              existing.total += 1;
              if (item.completed) existing.completed += 1;
              roadmapByPath.set(path, existing);
            }
          });

          const frontendStats = roadmapByPath.get("frontend") || { total: 0, completed: 0 };
          const backendStats = roadmapByPath.get("backend") || { total: 0, completed: 0 };
          const mobileStats = roadmapByPath.get("mobile") || { total: 0, completed: 0 };
          
          const totalRoadmapTopics = roadmapData.filter(r => r.completed).length;

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
            fundamentalsQuizResults: {
              total: fundamentalsTotal,
              highAccuracyCount: fundamentalsHighAccuracy,
              veryHighAccuracyCount: fundamentalsVeryHighAccuracy,
              hasPerfectScore: fundamentalsHasPerfect,
              hasLanguagePerfect,
              hasOopsPerfect,
            },
            fundamentalsStreak,
            systemDesignQuizResults: {
              total: systemDesignTotal,
              highAccuracyCount: systemDesignHighAccuracy,
              veryHighAccuracyCount: systemDesignVeryHighAccuracy,
              hasPerfectScore: systemDesignHasPerfect,
              hasHLDPerfect,
              hasLLDPerfect,
            },
            researchQuizResults: {
              total: researchTotal,
              highAccuracyCount: researchHighAccuracy,
              veryHighAccuracyCount: researchVeryHighAccuracy,
              hasPerfectScore: researchHasPerfect,
              hasJobPortalPerfect,
              hasRoadmapPerfect,
              hasJobPortalQuiz,
              hasRoadmapQuiz,
            },
            roadmapProgress: {
              totalTopics: totalRoadmapTopics,
              frontendComplete: frontendStats.total > 0 && frontendStats.completed === frontendStats.total,
              backendComplete: backendStats.total > 0 && backendStats.completed === backendStats.total,
              mobileComplete: mobileStats.total > 0 && mobileStats.completed === mobileStats.total,
              frontendTotal: frontendStats.total,
              frontendCompleted: frontendStats.completed,
              backendTotal: backendStats.total,
              backendCompleted: backendStats.completed,
              mobileTotal: mobileStats.total,
              mobileCompleted: mobileStats.completed,
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
      case "fundamentals_quiz_count":
        return { current: Math.min(progress.fundamentalsQuizResults.total, value), target: value };
      case "fundamentals_accuracy":
        if (value === 5) {
          return { current: Math.min(progress.fundamentalsQuizResults.highAccuracyCount, value), target: value };
        }
        return { current: Math.min(progress.fundamentalsQuizResults.veryHighAccuracyCount, value), target: value };
      case "fundamentals_mastery":
        if (value === 1) {
          return { current: progress.fundamentalsQuizResults.hasPerfectScore ? 1 : 0, target: 1 };
        }
        // For fundamentals_master (value: 2), need both language and oops perfect
        const fundMasteryCount = (progress.fundamentalsQuizResults.hasLanguagePerfect ? 1 : 0) + 
                                  (progress.fundamentalsQuizResults.hasOopsPerfect ? 1 : 0);
        return { current: fundMasteryCount, target: 2 };
      case "fundamentals_streak":
        return { current: Math.min(progress.fundamentalsStreak, value), target: value };
      case "system_design_quiz_count":
        return { current: Math.min(progress.systemDesignQuizResults.total, value), target: value };
      case "system_design_accuracy":
        if (value === 5) {
          return { current: Math.min(progress.systemDesignQuizResults.highAccuracyCount, value), target: value };
        }
        return { current: Math.min(progress.systemDesignQuizResults.veryHighAccuracyCount, value), target: value };
      case "system_design_mastery":
        if (value === 1) {
          // HLD Expert - need HLD perfect
          return { current: progress.systemDesignQuizResults.hasHLDPerfect ? 1 : 0, target: 1 };
        }
        if (value === 2) {
          // LLD Expert - need LLD perfect
          return { current: progress.systemDesignQuizResults.hasLLDPerfect ? 1 : 0, target: 1 };
        }
        // System Design Master (value: 3) - need both HLD and LLD perfect
        const sdMasteryCount = (progress.systemDesignQuizResults.hasHLDPerfect ? 1 : 0) + 
                               (progress.systemDesignQuizResults.hasLLDPerfect ? 1 : 0);
        return { current: sdMasteryCount, target: 2 };
      case "research_quiz_count":
        return { current: Math.min(progress.researchQuizResults.total, value), target: value };
      case "research_accuracy":
        return { current: Math.min(progress.researchQuizResults.veryHighAccuracyCount, value), target: value };
      case "research_mastery":
        if (value === 2) {
          // Research Explorer - need quizzes in both categories
          const explorerCount = (progress.researchQuizResults.hasJobPortalQuiz ? 1 : 0) + 
                                (progress.researchQuizResults.hasRoadmapQuiz ? 1 : 0);
          return { current: explorerCount, target: 2 };
        }
        // Career Master (value: 3) - need perfect in both
        const researchMasteryCount = (progress.researchQuizResults.hasJobPortalPerfect ? 1 : 0) + 
                                     (progress.researchQuizResults.hasRoadmapPerfect ? 1 : 0);
        return { current: researchMasteryCount, target: 2 };
      
      
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