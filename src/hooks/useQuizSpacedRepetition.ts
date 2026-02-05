 import { useState, useEffect, useCallback, useMemo } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { differenceInHours, addDays } from "date-fns";
import { useSRSSettings, DEFAULT_SRS_INTERVALS, DEFAULT_MASTERY_THRESHOLD } from "@/hooks/useSRSSettings";
 
function getNextReviewDate(reviewCount: number, wasCorrect: boolean, intervals: number[]): Date {
   // If wrong, reset to beginning or reduce interval
   if (!wasCorrect) {
     return addDays(new Date(), 1); // Review tomorrow
   }
   // If correct, use increasing intervals
  const index = Math.min(reviewCount, intervals.length - 1);
  return addDays(new Date(), intervals[index]);
 }
 
 export interface QuizReviewItem {
   id: string;
   questionId: number;
   category: string;
   title: string;
   lastAnsweredAt: Date;
   nextReviewAt: Date;
   reviewCount: number;
   correctStreak: number;
   hoursUntilDue: number;
   isOverdue: boolean;
   urgency: "critical" | "due" | "upcoming" | "later";
 }
 
 function getUrgency(hoursUntilDue: number): QuizReviewItem["urgency"] {
   if (hoursUntilDue < 0) return "critical";
   if (hoursUntilDue < 24) return "due";
   if (hoursUntilDue < 72) return "upcoming";
   return "later";
 }
 
 export function useQuizSpacedRepetition() {
   const { user } = useAuth();
   const { toast } = useToast();
  const { settings } = useSRSSettings();
   const [reviews, setReviews] = useState<QuizReviewItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
  const masteryThreshold = settings.masteryThreshold || DEFAULT_MASTERY_THRESHOLD;
  const intervals = settings.intervals || DEFAULT_SRS_INTERVALS;

   // Fetch due reviews
   const fetchReviews = useCallback(async () => {
     if (!user) {
       setReviews([]);
       setIsLoading(false);
       return;
     }
 
     try {
       const { data, error } = await supabase
         .from("quiz_spaced_repetition")
         .select("*")
         .eq("user_id", user.id)
         .lte("next_review_at", addDays(new Date(), 7).toISOString())
         .order("next_review_at", { ascending: true });
 
       if (error) throw error;
 
       const now = new Date();
       const items: QuizReviewItem[] = (data || []).map((item: any) => {
         const nextReviewAt = new Date(item.next_review_at);
         const hoursUntilDue = differenceInHours(nextReviewAt, now);
         return {
           id: item.id,
           questionId: item.question_id,
           category: item.question_category,
           title: item.question_title,
           lastAnsweredAt: new Date(item.last_answered_at),
           nextReviewAt,
           reviewCount: item.review_count,
           correctStreak: item.correct_streak,
           hoursUntilDue,
           isOverdue: hoursUntilDue < 0,
           urgency: getUrgency(hoursUntilDue),
         };
       });
 
       setReviews(items);
     } catch (error) {
       console.error("Error fetching quiz reviews:", error);
     } finally {
       setIsLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchReviews();
   }, [fetchReviews]);
 
   // Add incorrect questions for review
   const scheduleForReview = useCallback(async (
     questionsToSchedule: Array<{
       questionId: number;
       category: string;
       title: string;
     }>
   ) => {
     if (!user || questionsToSchedule.length === 0) return;
 
     try {
       const now = new Date();
       const nextReview = addDays(now, 1); // First review tomorrow
 
       for (const q of questionsToSchedule) {
         await supabase
           .from("quiz_spaced_repetition")
           .upsert(
             {
               user_id: user.id,
               question_id: q.questionId,
               question_category: q.category,
               question_title: q.title,
               last_answered_at: now.toISOString(),
               next_review_at: nextReview.toISOString(),
               review_count: 0,
               correct_streak: 0,
             },
             {
               onConflict: "user_id,question_id,question_category",
             }
           );
       }
 
       await fetchReviews();
     } catch (error) {
       console.error("Error scheduling reviews:", error);
     }
   }, [user, fetchReviews]);
 
   // Mark a review as completed
   const completeReview = useCallback(async (
     reviewId: string,
     wasCorrect: boolean
   ) => {
     if (!user) return;
 
     const review = reviews.find(r => r.id === reviewId);
     if (!review) return;
 
     try {
       const newReviewCount = review.reviewCount + 1;
       const newCorrectStreak = wasCorrect ? review.correctStreak + 1 : 0;
      const nextReviewAt = getNextReviewDate(newCorrectStreak, wasCorrect, intervals);
 
      // If correct streak reaches mastery threshold, remove from review
      if (newCorrectStreak >= masteryThreshold) {
         await supabase
           .from("quiz_spaced_repetition")
           .delete()
           .eq("id", reviewId);
 
         toast({
           title: "Mastered! 🎉",
           description: "Question removed from review queue",
           duration: 3000,
         });
       } else {
         await supabase
           .from("quiz_spaced_repetition")
           .update({
             last_answered_at: new Date().toISOString(),
             next_review_at: nextReviewAt.toISOString(),
             review_count: newReviewCount,
             correct_streak: newCorrectStreak,
           })
           .eq("id", reviewId);
 
         if (wasCorrect) {
           toast({
             title: "Good job!",
            description: `${masteryThreshold - newCorrectStreak} more correct to master`,
             duration: 3000,
           });
         }
       }
 
       await fetchReviews();
     } catch (error) {
       console.error("Error completing review:", error);
     }
  }, [user, reviews, fetchReviews, toast, masteryThreshold, intervals]);
 
   // Remove a question from review
   const removeFromReview = useCallback(async (reviewId: string) => {
     if (!user) return;
 
     try {
       await supabase
         .from("quiz_spaced_repetition")
         .delete()
         .eq("id", reviewId);
 
       await fetchReviews();
     } catch (error) {
       console.error("Error removing review:", error);
     }
   }, [user, fetchReviews]);
 
   const stats = useMemo(() => {
     const critical = reviews.filter(r => r.urgency === "critical").length;
     const due = reviews.filter(r => r.urgency === "due").length;
     const upcoming = reviews.filter(r => r.urgency === "upcoming").length;
     return { critical, due, upcoming, total: reviews.length };
   }, [reviews]);
 
   return {
     reviews,
     isLoading,
     stats,
    masteryThreshold,
     scheduleForReview,
     completeReview,
     removeFromReview,
     refetch: fetchReviews,
   };
 }