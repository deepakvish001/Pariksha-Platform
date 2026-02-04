import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  SpacedRepetitionQuestion,
  calculateDueDate,
  getUrgency,
} from "./useSpacedRepetition";
import { differenceInHours } from "date-fns";

interface ProgressItem {
  solved: boolean;
  revision: boolean;
  completedAt?: string;
  reviewCount?: number;
}

interface ProgressState {
  [itemId: number]: ProgressItem;
}

interface UseMassRecruitmentProgressReturn {
  progress: ProgressState;
  isLoading: boolean;
  isSolved: (itemId: number) => boolean;
  isRevision: (itemId: number) => boolean;
  toggleSolved: (itemId: number) => Promise<void>;
  toggleRevision: (itemId: number) => Promise<void>;
  markReviewed: (itemId: number, categoryId: string) => Promise<void>;
  dueQuestions: SpacedRepetitionQuestion[];
  spacedRepetitionStats: {
    critical: number;
    due: number;
    upcoming: number;
    total: number;
  };
}

export function useMassRecruitmentProgress(
  companyId: string | undefined,
  activeTabId: string
): UseMassRecruitmentProgressReturn {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [allCategoriesProgress, setAllCategoriesProgress] = useState<
    Record<string, ProgressState>
  >({});

  // Fetch progress from Supabase for all categories (for spaced repetition)
  useEffect(() => {
    if (!user || !companyId) {
      setProgress({});
      setAllCategoriesProgress({});
      setIsLoading(false);
      return;
    }

    const fetchProgress = async () => {
      setIsLoading(true);
      try {
        // Fetch progress for ALL categories for this company (for spaced repetition)
        const { data, error } = await supabase
          .from("user_company_progress")
          .select("item_id, solved, revision, tab_id, created_at, updated_at")
          .eq("user_id", user.id)
          .eq("company_id", `mass-${companyId}`);

        if (error) {
          console.error("Error fetching mass recruitment progress:", error);
          return;
        }

        // Group by tab_id (category)
        const allProgress: Record<string, ProgressState> = {};
        const currentTabProgress: ProgressState = {};

        data?.forEach((item) => {
          const progressItem: ProgressItem = {
            solved: item.solved,
            revision: item.revision,
            completedAt: item.solved ? item.updated_at : undefined,
            reviewCount: 0, // We'll track this separately in future enhancement
          };

          if (!allProgress[item.tab_id]) {
            allProgress[item.tab_id] = {};
          }
          allProgress[item.tab_id][item.item_id] = progressItem;

          if (item.tab_id === activeTabId) {
            currentTabProgress[item.item_id] = progressItem;
          }
        });

        setAllCategoriesProgress(allProgress);
        setProgress(currentTabProgress);
      } catch (err) {
        console.error("Error fetching mass recruitment progress:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [user, companyId, activeTabId]);

  // Calculate due questions for spaced repetition
  const dueQuestions = useMemo(() => {
    const now = new Date();
    const questions: SpacedRepetitionQuestion[] = [];

    Object.entries(allCategoriesProgress).forEach(([categoryId, categoryProgress]) => {
      Object.entries(categoryProgress).forEach(([itemIdStr, data]) => {
        if (!data.solved || !data.completedAt) return;

        const questionId = parseInt(itemIdStr, 10);
        const completedAt = new Date(data.completedAt);
        const reviewCount = data.reviewCount || 0;
        const dueDate = calculateDueDate(completedAt, reviewCount);

        const hoursUntilDue = differenceInHours(dueDate, now);
        const isOverdue = hoursUntilDue < 0;
        const urgency = getUrgency(hoursUntilDue);

        // Only include questions that are due within the next 7 days or overdue
        if (hoursUntilDue <= 168) {
          questions.push({
            questionId,
            categoryId,
            completedAt,
            reviewCount,
            dueIn: hoursUntilDue,
            isOverdue,
            urgency,
          });
        }
      });
    });

    // Sort by urgency (most urgent first)
    return questions.sort((a, b) => a.dueIn - b.dueIn);
  }, [allCategoriesProgress]);

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

  const upsertProgress = async (
    itemId: number,
    updates: Partial<ProgressItem>,
    tabId: string = activeTabId
  ) => {
    if (!user || !companyId) return;

    const currentProgress = tabId === activeTabId 
      ? progress[itemId] 
      : allCategoriesProgress[tabId]?.[itemId];
    const current = currentProgress || { solved: false, revision: false };
    const newState = { ...current, ...updates };

    // Optimistic update
    if (tabId === activeTabId) {
      setProgress((prev) => ({
        ...prev,
        [itemId]: newState,
      }));
    }

    setAllCategoriesProgress((prev) => ({
      ...prev,
      [tabId]: {
        ...(prev[tabId] || {}),
        [itemId]: newState,
      },
    }));

    try {
      const { error } = await supabase
        .from("user_company_progress")
        .upsert(
          {
            user_id: user.id,
            company_id: `mass-${companyId}`,
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
        console.error("Error updating mass recruitment progress:", error);
        // Revert optimistic update on error
        if (tabId === activeTabId) {
          setProgress((prev) => ({
            ...prev,
            [itemId]: current,
          }));
        }
        setAllCategoriesProgress((prev) => ({
          ...prev,
          [tabId]: {
            ...(prev[tabId] || {}),
            [itemId]: current,
          },
        }));
      }
    } catch (err) {
      console.error("Error updating mass recruitment progress:", err);
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
    [progress, user, companyId, activeTabId]
  );

  const toggleRevision = useCallback(
    async (itemId: number) => {
      const current = progress[itemId]?.revision || false;
      await upsertProgress(itemId, { revision: !current });
    },
    [progress, user, companyId, activeTabId]
  );

  const markReviewed = useCallback(
    async (itemId: number, categoryId: string) => {
      const categoryProgress = allCategoriesProgress[categoryId];
      const current = categoryProgress?.[itemId];
      if (!current) return;

      const newReviewCount = (current.reviewCount || 0) + 1;
      await upsertProgress(
        itemId,
        {
          completedAt: new Date().toISOString(),
          reviewCount: newReviewCount,
        },
        categoryId
      );
    },
    [allCategoriesProgress, user, companyId]
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
