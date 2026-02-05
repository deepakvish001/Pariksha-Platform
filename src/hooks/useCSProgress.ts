 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
 
 interface ProgressItem {
   question_id: number;
   solved: boolean;
   revision: boolean;
   review_count: number;
   completed_at: string | null;
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
 
   return {
     isLoading,
     isSolved,
     isRevision,
     toggleSolved,
     toggleRevision,
     progress,
   };
 }