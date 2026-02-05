 import { useState, useEffect, useCallback } from "react";
import { useMemo } from "react";
import { differenceInHours } from "date-fns";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
 import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
 
 interface ProgressItem {
   question_id: number;
   solved: boolean;
   revision: boolean;
   review_count: number;
   completed_at: string | null;
 }
 
// Spaced repetition intervals in days
const INTERVALS = [1, 3, 7, 14, 30, 60, 120];

function getNextReviewInterval(reviewCount: number): number {
  const index = Math.min(reviewCount, INTERVALS.length - 1);
  return INTERVALS[index];
}

function calculateDueDate(completedAt: Date, reviewCount: number): Date {
  const intervalDays = getNextReviewInterval(reviewCount);
  const dueDate = new Date(completedAt);
  dueDate.setDate(dueDate.getDate() + intervalDays);
  return dueDate;
}

function getUrgency(hoursUntilDue: number): "critical" | "due" | "upcoming" | "later" {
  if (hoursUntilDue < 0) return "critical";
  if (hoursUntilDue < 24) return "due";
  if (hoursUntilDue < 72) return "upcoming";
  return "later";
}

export interface CSSpacedRepetitionQuestion {
  questionId: number;
  subjectId: string;
  completedAt: Date;
  reviewCount: number;
  dueIn: number;
  isOverdue: boolean;
  urgency: "critical" | "due" | "upcoming" | "later";
}

 export function useCSProgress() {
   const { user } = useAuth();
   const { toast } = useToast();
   const [progress, setProgress] = useState<Map<number, ProgressItem>>(new Map());
   const [isLoading, setIsLoading] = useState(true);
 
   const SHEET_ID = "cs-subjects";
 
   // Fetch progress from database
   useEffect(() => {
     const fetchProgress = async () => {
       if (!user) {
         setProgress(new Map());
         setIsLoading(false);
         return;
       }
 
       try {
         const { data, error } = await supabase
           .from("user_topic_progress")
           .select("*")
           .eq("user_id", user.id)
           .eq("sheet_id", SHEET_ID);
 
         if (error) throw error;
 
         const progressMap = new Map<number, ProgressItem>();
         data?.forEach((item) => {
           const questionId = parseInt(item.topic_id.replace("cs-", ""));
           progressMap.set(questionId, {
             question_id: questionId,
             solved: item.completed,
             revision: item.is_revision,
             review_count: item.review_count,
             completed_at: item.completed_at,
         });
         });
         setProgress(progressMap);
       } catch (error) {
         console.error("Error fetching CS progress:", error);
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchProgress();
   }, [user]);
 
   // Real-time subscription for cross-device sync
   useEffect(() => {
     if (!user) return;
 
     const channel = supabase
       .channel(`cs-progress-${user.id}`)
       .on(
         "postgres_changes",
         {
           event: "*",
           schema: "public",
           table: "user_topic_progress",
           filter: `user_id=eq.${user.id}`,
         },
         (payload: RealtimePostgresChangesPayload<{
           topic_id: string;
           sheet_id: string;
           completed: boolean;
           is_revision: boolean;
           review_count: number;
           completed_at: string | null;
         }>) => {
           const newRecord = payload.new as {
             topic_id: string;
             sheet_id: string;
             completed: boolean;
             is_revision: boolean;
             review_count: number;
             completed_at: string | null;
           } | null;
           const oldRecord = payload.old as { topic_id: string; sheet_id: string } | null;
 
           // Only process CS subject progress
           if (newRecord?.sheet_id !== SHEET_ID && oldRecord?.sheet_id !== SHEET_ID) {
             return;
           }
 
           if (payload.eventType === "DELETE" && oldRecord) {
             const questionId = parseInt(oldRecord.topic_id.replace("cs-", ""));
             setProgress((prev) => {
               const updated = new Map(prev);
               updated.delete(questionId);
               return updated;
             });
           } else if (newRecord && newRecord.sheet_id === SHEET_ID) {
             const questionId = parseInt(newRecord.topic_id.replace("cs-", ""));
             setProgress((prev) => {
               const updated = new Map(prev);
               updated.set(questionId, {
                 question_id: questionId,
                 solved: newRecord.completed,
                 revision: newRecord.is_revision,
                 review_count: newRecord.review_count,
                 completed_at: newRecord.completed_at,
               });
               return updated;
             });
           }
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [user]);
 
   const isSolved = useCallback(
     (questionId: number) => progress.get(questionId)?.solved || false,
     [progress]
   );
 
   const isRevision = useCallback(
     (questionId: number) => progress.get(questionId)?.revision || false,
     [progress]
   );
 
   const toggleSolved = useCallback(
     async (questionId: number) => {
       if (!user) {
         toast({
           variant: "destructive",
           title: "Sign in required",
           description: "Please sign in to track your progress.",
       });
         return;
       }
 
       const current = progress.get(questionId);
       const newSolved = !current?.solved;
 
       // Optimistic update
       setProgress((prev) => {
         const updated = new Map(prev);
         updated.set(questionId, {
           question_id: questionId,
           solved: newSolved,
           revision: current?.revision || false,
           review_count: current?.review_count || 0,
           completed_at: newSolved ? new Date().toISOString() : null,
       });
         return updated;
       });
 
       try {
         const topicId = `cs-${questionId}`;
 
         if (current) {
           await supabase
             .from("user_topic_progress")
             .update({
               completed: newSolved,
               completed_at: newSolved ? new Date().toISOString() : null,
             })
             .eq("user_id", user.id)
             .eq("sheet_id", SHEET_ID)
             .eq("topic_id", topicId);
         } else {
           await supabase.from("user_topic_progress").insert({
             user_id: user.id,
             sheet_id: SHEET_ID,
             topic_id: topicId,
             completed: newSolved,
             completed_at: newSolved ? new Date().toISOString() : null,
           });
         }
       } catch (error) {
         console.error("Error toggling solved:", error);
         // Revert on error
         setProgress((prev) => {
           const updated = new Map(prev);
           if (current) {
             updated.set(questionId, current);
           } else {
             updated.delete(questionId);
           }
           return updated;
         });
       }
     },
     [user, progress, toast]
   );
 
   const toggleRevision = useCallback(
     async (questionId: number) => {
       if (!user) {
         toast({
           variant: "destructive",
           title: "Sign in required",
           description: "Please sign in to track your progress.",
         });
         return;
       }
 
       const current = progress.get(questionId);
       const newRevision = !current?.revision;
 
       // Optimistic update
       setProgress((prev) => {
         const updated = new Map(prev);
         updated.set(questionId, {
           question_id: questionId,
           solved: current?.solved || false,
           revision: newRevision,
           review_count: current?.review_count || 0,
           completed_at: current?.completed_at || null,
         });
         return updated;
       });
 
       try {
         const topicId = `cs-${questionId}`;
 
         if (current) {
           await supabase
             .from("user_topic_progress")
             .update({ is_revision: newRevision })
             .eq("user_id", user.id)
             .eq("sheet_id", SHEET_ID)
             .eq("topic_id", topicId);
         } else {
           await supabase.from("user_topic_progress").insert({
             user_id: user.id,
             sheet_id: SHEET_ID,
             topic_id: topicId,
             completed: false,
             is_revision: newRevision,
           });
         }
       } catch (error) {
         console.error("Error toggling revision:", error);
         // Revert on error
         setProgress((prev) => {
           const updated = new Map(prev);
           if (current) {
             updated.set(questionId, current);
           } else {
             updated.delete(questionId);
           }
           return updated;
         });
       }
     },
     [user, progress, toast]
   );
 
  const markReviewed = useCallback(
    async (questionId: number) => {
      if (!user) return;

      const current = progress.get(questionId);
      if (!current?.solved) return;

      const newReviewCount = (current.review_count || 0) + 1;

      // Optimistic update
      setProgress((prev) => {
        const updated = new Map(prev);
        updated.set(questionId, {
          ...current,
          review_count: newReviewCount,
          completed_at: new Date().toISOString(),
        });
        return updated;
      });

      try {
        const topicId = `cs-${questionId}`;
        await supabase
          .from("user_topic_progress")
          .update({
            review_count: newReviewCount,
            completed_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("sheet_id", SHEET_ID)
          .eq("topic_id", topicId);
      } catch (error) {
        console.error("Error marking reviewed:", error);
        setProgress((prev) => {
          const updated = new Map(prev);
          updated.set(questionId, current);
          return updated;
        });
      }
    },
    [user, progress]
  );

  // Calculate spaced repetition due questions
  const spacedRepetition = useMemo(() => {
    const now = new Date();
    const questions: CSSpacedRepetitionQuestion[] = [];

    progress.forEach((item, questionId) => {
      if (!item.solved || !item.completed_at) return;

      const completedAt = new Date(item.completed_at);
      const reviewCount = item.review_count || 0;
      const dueDate = calculateDueDate(completedAt, reviewCount);
      const hoursUntilDue = differenceInHours(dueDate, now);
      const isOverdue = hoursUntilDue < 0;
      const urgency = getUrgency(hoursUntilDue);

      // Only include questions due within 7 days or overdue
      if (hoursUntilDue <= 168) {
        questions.push({
          questionId,
          subjectId: "", // Will be filled from question data
          completedAt,
          reviewCount,
          dueIn: hoursUntilDue,
          isOverdue,
          urgency,
        });
      }
    });

    // Sort by urgency (most urgent first)
    questions.sort((a, b) => a.dueIn - b.dueIn);

    const critical = questions.filter((q) => q.urgency === "critical").length;
    const due = questions.filter((q) => q.urgency === "due").length;
    const upcoming = questions.filter((q) => q.urgency === "upcoming").length;

    return {
      dueQuestions: questions,
      stats: { critical, due, upcoming, total: questions.length },
    };
  }, [progress]);

   return {
     isLoading,
     isSolved,
     isRevision,
     toggleSolved,
     toggleRevision,
     progress,
     markReviewed,
     spacedRepetition,
   };
 }