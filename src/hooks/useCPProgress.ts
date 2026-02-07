import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface ProgressItem {
  solved: boolean;
  revision: boolean;
  completedAt?: string;
}

interface ProgressState {
  [itemId: number]: ProgressItem;
}

interface UseCPProgressReturn {
  progress: ProgressState;
  isLoading: boolean;
  isSolved: (itemId: number) => boolean;
  isRevision: (itemId: number) => boolean;
  toggleSolved: (itemId: number) => Promise<void>;
  toggleRevision: (itemId: number) => Promise<void>;
  getSolvedCount: (problemSetId: number, totalProblems: number) => number;
  getTotalSolved: () => number;
}

const COMPANY_ID = "cp-questions";
const TAB_ID = "all";

export function useCPProgress(): UseCPProgressReturn {
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
          .eq("company_id", COMPANY_ID)
          .eq("tab_id", TAB_ID);

        if (error) {
          console.error("Error fetching CP progress:", error);
          return;
        }

        const progressMap: ProgressState = {};
        data?.forEach((item) => {
          progressMap[item.item_id] = {
            solved: item.solved,
            revision: item.revision,
            completedAt: item.solved ? item.updated_at : undefined,
          };
        });
        setProgress(progressMap);
      } catch (err) {
        console.error("Error fetching CP progress:", err);
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
      .channel(`cp-progress-${user.id}`)
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

          // Only process CP progress
          if (newRecord?.company_id !== COMPANY_ID && oldRecord?.company_id !== COMPANY_ID) {
            return;
          }

          if (payload.eventType === "DELETE" && oldRecord) {
            setProgress((prev) => {
              const updated = { ...prev };
              delete updated[oldRecord.item_id];
              return updated;
            });
          } else if (newRecord && newRecord.company_id === COMPANY_ID) {
            setProgress((prev) => ({
              ...prev,
              [newRecord.item_id]: {
                solved: newRecord.solved,
                revision: newRecord.revision,
                completedAt: newRecord.solved ? newRecord.updated_at : undefined,
              },
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
          company_id: COMPANY_ID,
          tab_id: TAB_ID,
          item_id: itemId,
          solved: newState.solved,
          revision: newState.revision,
        },
        {
          onConflict: "user_id,company_id,tab_id,item_id",
        }
      );

      if (error) {
        console.error("Error updating CP progress:", error);
        setProgress((prev) => ({
          ...prev,
          [itemId]: current,
        }));
        toast({
          title: "Error",
          description: "Failed to save progress. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error updating CP progress:", err);
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

  // For problem sets, we track solved as marking the entire set complete
  // This returns 0 or problemCount based on solved status
  const getSolvedCount = useCallback(
    (problemSetId: number, totalProblems: number) => {
      return progress[problemSetId]?.solved ? totalProblems : 0;
    },
    [progress]
  );

  const getTotalSolved = useCallback(() => {
    return Object.values(progress).filter((p) => p.solved).length;
  }, [progress]);

  return {
    progress,
    isLoading,
    isSolved,
    isRevision,
    toggleSolved,
    toggleRevision,
    getSolvedCount,
    getTotalSolved,
  };
}
