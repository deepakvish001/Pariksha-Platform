import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInDays, differenceInWeeks, format, addWeeks, startOfWeek } from "date-fns";

export interface LearningGoal {
  id: string;
  user_id: string;
  roadmap_id: string;
  target_completion_date: string;
  weekly_topics_target: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  reminder_enabled: boolean;
}

export interface GoalProgress {
  goal: LearningGoal | null;
  daysRemaining: number;
  weeksRemaining: number;
  currentProgress: number;
  requiredWeeklyPace: number;
  isOnTrack: boolean;
  weeklyMilestones: {
    weekNumber: number;
    targetTopics: number;
    startDate: Date;
    endDate: Date;
  }[];
}

export function useRoadmapLearningGoals(roadmapId: string, totalTopics: number, completedTopics: number) {
  const { user } = useAuth();
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing goal
  useEffect(() => {
    const fetchGoal = async () => {
      if (!user || !roadmapId) {
        setGoal(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("roadmap_learning_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("roadmap_id", roadmapId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching learning goal:", error);
      } else {
        setGoal(data);
      }
      setIsLoading(false);
    };

    fetchGoal();
  }, [user, roadmapId]);

  // Create or update goal
  const saveGoal = useCallback(async (
    targetDate: Date,
    weeklyTarget: number,
    reminderEnabled: boolean = true
  ) => {
    if (!user) {
      toast.error("Please sign in to set learning goals");
      return false;
    }

    setIsSaving(true);
    try {
      const goalData = {
        user_id: user.id,
        roadmap_id: roadmapId,
        target_completion_date: format(targetDate, "yyyy-MM-dd"),
        weekly_topics_target: weeklyTarget,
        reminder_enabled: reminderEnabled,
        is_active: true,
      };

      if (goal) {
        // Update existing
        const { error } = await supabase
          .from("roadmap_learning_goals")
          .update({
            ...goalData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", goal.id);

        if (error) throw error;
        setGoal({ ...goal, ...goalData });
      } else {
        // Create new
        const { data, error } = await supabase
          .from("roadmap_learning_goals")
          .insert(goalData)
          .select()
          .single();

        if (error) throw error;
        setGoal(data);
      }

      toast.success("Learning goal saved!");
      return true;
    } catch (error: any) {
      console.error("Error saving goal:", error);
      toast.error("Failed to save learning goal");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, roadmapId, goal]);

  // Delete goal
  const deleteGoal = useCallback(async () => {
    if (!goal) return false;

    try {
      const { error } = await supabase
        .from("roadmap_learning_goals")
        .delete()
        .eq("id", goal.id);

      if (error) throw error;
      setGoal(null);
      toast.success("Learning goal removed");
      return true;
    } catch (error: any) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to remove goal");
      return false;
    }
  }, [goal]);

  // Calculate progress metrics
  const getGoalProgress = useCallback((): GoalProgress => {
    if (!goal) {
      return {
        goal: null,
        daysRemaining: 0,
        weeksRemaining: 0,
        currentProgress: 0,
        requiredWeeklyPace: 0,
        isOnTrack: false,
        weeklyMilestones: [],
      };
    }

    const targetDate = new Date(goal.target_completion_date);
    const today = new Date();
    const daysRemaining = Math.max(0, differenceInDays(targetDate, today));
    const weeksRemaining = Math.max(0, differenceInWeeks(targetDate, today));
    const remainingTopics = totalTopics - completedTopics;
    const currentProgress = Math.round((completedTopics / totalTopics) * 100);

    // Calculate required weekly pace
    const requiredWeeklyPace = weeksRemaining > 0 
      ? Math.ceil(remainingTopics / weeksRemaining) 
      : remainingTopics;

    // Check if on track
    const expectedProgress = ((differenceInDays(today, new Date(goal.created_at)) / differenceInDays(targetDate, new Date(goal.created_at))) * 100);
    const isOnTrack = currentProgress >= expectedProgress || completedTopics >= totalTopics;

    // Generate weekly milestones
    const weeklyMilestones: GoalProgress["weeklyMilestones"] = [];
    const startDate = startOfWeek(new Date(goal.created_at), { weekStartsOn: 1 });
    const totalWeeks = Math.ceil(differenceInWeeks(targetDate, startDate));
    
    for (let i = 0; i <= Math.min(totalWeeks, 12); i++) {
      const weekStart = addWeeks(startDate, i);
      const weekEnd = addWeeks(weekStart, 1);
      const targetTopics = Math.min(
        Math.round(((i + 1) / totalWeeks) * totalTopics),
        totalTopics
      );
      
      weeklyMilestones.push({
        weekNumber: i + 1,
        targetTopics,
        startDate: weekStart,
        endDate: weekEnd,
      });
    }

    return {
      goal,
      daysRemaining,
      weeksRemaining,
      currentProgress,
      requiredWeeklyPace,
      isOnTrack,
      weeklyMilestones,
    };
  }, [goal, totalTopics, completedTopics]);

  return {
    goal,
    isLoading,
    isSaving,
    saveGoal,
    deleteGoal,
    getGoalProgress,
  };
}
