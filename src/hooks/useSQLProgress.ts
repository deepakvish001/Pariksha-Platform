 import { useState, useEffect, useCallback, useMemo } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import {
   SpacedRepetitionQuestion,
   calculateDueDate,
   getUrgency,
 } from "./useSpacedRepetition";
 import { differenceInHours } from "date-fns";
 import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
 
 interface ProgressItem {
   solved: boolean;
   revision: boolean;
   completedAt?: string;
   reviewCount?: number;
 }
 
 interface ProgressState {
   [itemId: number]: ProgressItem;
 }
 
 interface UseSQLProgressReturn {
   progress: ProgressState;
   isLoading: boolean;
   isSolved: (itemId: number) => boolean;
   isRevision: (itemId: number) => boolean;
   toggleSolved: (itemId: number) => Promise<void>;
   toggleRevision: (itemId: number) => Promise<void>;
   markReviewed: (itemId: number) => Promise<void>;
   dueQuestions: SpacedRepetitionQuestion[];
   spacedRepetitionStats: {
     critical: number;
     due: number;
     upcoming: number;
     total: number;
   };
 }
 
 export function useSQLProgress(): UseSQLProgressReturn {
   const { user } = useAuth();
   const { toast } = useToast();
   const [progress, setProgress] = useState<ProgressState>({});
   const [isLoading, setIsLoading] = useState(true);
 
   // Fetch progress from Supabase
   useEffect(() => {
     if (!user) {
       setProgress({});
       setIsLoading(false);
       return;
     }
 
     const fetchProgress = async () => {
       setIsLoading(true);
       try {
         const { data, error } = await supabase
           .from("user_company_progress")
           .select("item_id, solved, revision, updated_at")
           .eq("user_id", user.id)
           .eq("company_id", "sql-questions")
           .eq("tab_id", "all");
 
         if (error) {
           console.error("Error fetching SQL progress:", error);
           return;
         }
 
         const progressMap: ProgressState = {};
         data?.forEach((item) => {
           progressMap[item.item_id] = {
             solved: item.solved,
             revision: item.revision,
             completedAt: item.solved ? item.updated_at : undefined,
             reviewCount: 0,
           };
         });
         setProgress(progressMap);
       } catch (err) {
         console.error("Error fetching SQL progress:", err);
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
      .channel(`sql-progress-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_company_progress",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<{
          item_id: number;
          company_id: string;
          tab_id: string;
          solved: boolean;
          revision: boolean;
          updated_at: string;
        }>) => {
          const newRecord = payload.new as {
            item_id: number;
            company_id: string;
            tab_id: string;
            solved: boolean;
            revision: boolean;
            updated_at: string;
          } | null;
          const oldRecord = payload.old as { item_id: number; company_id: string } | null;

          // Only process SQL progress
          if (newRecord?.company_id !== "sql-questions" && oldRecord?.company_id !== "sql-questions") {
            return;
          }

          if (payload.eventType === "DELETE" && oldRecord) {
            setProgress((prev) => {
              const updated = { ...prev };
              delete updated[oldRecord.item_id];
              return updated;
            });
            toast({
              title: "Progress synced",
              description: "Your progress was updated from another device",
              duration: 3000,
            });
          } else if (newRecord && newRecord.company_id === "sql-questions") {
            setProgress((prev) => ({
              ...prev,
              [newRecord.item_id]: {
                solved: newRecord.solved,
                revision: newRecord.revision,
                completedAt: newRecord.solved ? newRecord.updated_at : undefined,
                reviewCount: prev[newRecord.item_id]?.reviewCount || 0,
              },
            }));
            toast({
              title: "Progress synced",
              description: "Your progress was updated from another device",
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

   // Calculate due questions for spaced repetition
   const dueQuestions = useMemo(() => {
     const now = new Date();
     const questions: SpacedRepetitionQuestion[] = [];
 
     Object.entries(progress).forEach(([itemIdStr, data]) => {
       if (!data.solved || !data.completedAt) return;
 
       const questionId = parseInt(itemIdStr, 10);
       const completedAt = new Date(data.completedAt);
       const reviewCount = data.reviewCount || 0;
       const dueDate = calculateDueDate(completedAt, reviewCount);
 
       const hoursUntilDue = differenceInHours(dueDate, now);
       const isOverdue = hoursUntilDue < 0;
       const urgency = getUrgency(hoursUntilDue);
 
       if (hoursUntilDue <= 168) {
         questions.push({
           questionId,
           categoryId: "sql",
           completedAt,
           reviewCount,
           dueIn: hoursUntilDue,
           isOverdue,
           urgency,
         });
       }
     });
 
     return questions.sort((a, b) => a.dueIn - b.dueIn);
   }, [progress]);
 
   const spacedRepetitionStats = useMemo(() => {
     const critical = dueQuestions.filter((q) => q.urgency === "critical").length;
     const due = dueQuestions.filter((q) => q.urgency === "due").length;
     const upcoming = dueQuestions.filter((q) => q.urgency === "upcoming").length;
     return { critical, due, upcoming, total: dueQuestions.length };
   }, [dueQuestions]);
 
   const isSolved = useCallback(
     (itemId: number) => progress[itemId]?.solved || false,
     [progress]
   );
 
   const isRevision = useCallback(
     (itemId: number) => progress[itemId]?.revision || false,
     [progress]
   );
 
   const upsertProgress = async (itemId: number, updates: Partial<ProgressItem>) => {
     if (!user) return;
 
     const current = progress[itemId] || { solved: false, revision: false };
     const newState = { ...current, ...updates };
 
     // Optimistic update
     setProgress((prev) => ({
       ...prev,
       [itemId]: newState,
     }));
 
     try {
       const { error } = await supabase.from("user_company_progress").upsert(
         {
           user_id: user.id,
           company_id: "sql-questions",
           tab_id: "all",
           item_id: itemId,
           solved: newState.solved,
           revision: newState.revision,
         },
         {
           onConflict: "user_id,company_id,tab_id,item_id",
         }
       );
 
       if (error) {
         console.error("Error updating SQL progress:", error);
         setProgress((prev) => ({
           ...prev,
           [itemId]: current,
         }));
       }
     } catch (err) {
       console.error("Error updating SQL progress:", err);
       setProgress((prev) => ({
         ...prev,
         [itemId]: current,
       }));
     }
   };
 
   const toggleSolved = useCallback(
     async (itemId: number) => {
       const current = progress[itemId]?.solved || false;
       const updates: Partial<ProgressItem> = { solved: !current };
       if (!current) {
         updates.completedAt = new Date().toISOString();
       }
       await upsertProgress(itemId, updates);
     },
     [progress, user]
   );
 
   const toggleRevision = useCallback(
     async (itemId: number) => {
       const current = progress[itemId]?.revision || false;
       await upsertProgress(itemId, { revision: !current });
     },
     [progress, user]
   );
 
   const markReviewed = useCallback(
     async (itemId: number) => {
       const current = progress[itemId];
       if (!current) return;
 
       const newReviewCount = (current.reviewCount || 0) + 1;
       await upsertProgress(itemId, {
         completedAt: new Date().toISOString(),
         reviewCount: newReviewCount,
       });
     },
     [progress, user]
   );
 
   return {
     progress,
     isLoading,
     isSolved,
     isRevision,
     toggleSolved,
     toggleRevision,
     markReviewed,
     dueQuestions,
     spacedRepetitionStats,
   };
 }