import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ProgressItem {
  solved: boolean;
  revision: boolean;
}

interface ProgressState {
  [itemId: number]: ProgressItem;
}

interface UseCompanyProgressReturn {
  progress: ProgressState;
  isLoading: boolean;
  isSolved: (itemId: number) => boolean;
  isRevision: (itemId: number) => boolean;
  toggleSolved: (itemId: number) => Promise<void>;
  toggleRevision: (itemId: number) => Promise<void>;
}

export function useCompanyProgress(
  companyId: string | undefined,
  tabId: string
): UseCompanyProgressReturn {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressState>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch progress from Supabase
  useEffect(() => {
    if (!user || !companyId) {
      setProgress({});
      setIsLoading(false);
      return;
    }

    const fetchProgress = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_company_progress")
          .select("item_id, solved, revision")
          .eq("user_id", user.id)
          .eq("company_id", companyId)
          .eq("tab_id", tabId);

        if (error) {
          console.error("Error fetching company progress:", error);
          return;
        }

        const progressMap: ProgressState = {};
        data?.forEach((item) => {
          progressMap[item.item_id] = {
            solved: item.solved,
            revision: item.revision,
          };
        });
        setProgress(progressMap);
      } catch (err) {
        console.error("Error fetching company progress:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [user, companyId, tabId]);

  const isSolved = useCallback(
    (itemId: number) => progress[itemId]?.solved || false,
    [progress]
  );

  const isRevision = useCallback(
    (itemId: number) => progress[itemId]?.revision || false,
    [progress]
  );

  const upsertProgress = async (
    itemId: number,
    updates: Partial<ProgressItem>
  ) => {
    if (!user || !companyId) return;

    const current = progress[itemId] || { solved: false, revision: false };
    const newState = { ...current, ...updates };

    // Optimistic update
    setProgress((prev) => ({
      ...prev,
      [itemId]: newState,
    }));

    try {
      const { error } = await supabase
        .from("user_company_progress")
        .upsert(
          {
            user_id: user.id,
            company_id: companyId,
            tab_id: tabId,
            item_id: itemId,
            solved: newState.solved,
            revision: newState.revision,
          },
          {
            onConflict: "user_id,company_id,tab_id,item_id",
          }
        );

      if (error) {
        console.error("Error updating company progress:", error);
        // Revert optimistic update on error
        setProgress((prev) => ({
          ...prev,
          [itemId]: current,
        }));
      }
    } catch (err) {
      console.error("Error updating company progress:", err);
      // Revert optimistic update on error
      setProgress((prev) => ({
        ...prev,
        [itemId]: current,
      }));
    }
  };

  const toggleSolved = useCallback(
    async (itemId: number) => {
      const current = progress[itemId]?.solved || false;
      await upsertProgress(itemId, { solved: !current });
    },
    [progress, user, companyId, tabId]
  );

  const toggleRevision = useCallback(
    async (itemId: number) => {
      const current = progress[itemId]?.revision || false;
      await upsertProgress(itemId, { revision: !current });
    },
    [progress, user, companyId, tabId]
  );

  return {
    progress,
    isLoading,
    isSolved,
    isRevision,
    toggleSolved,
    toggleRevision,
  };
}
