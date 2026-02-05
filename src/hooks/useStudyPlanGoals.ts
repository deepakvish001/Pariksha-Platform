import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface StudyPlanGoal {
  id: string;
  category: string;
  target_questions: number;
  questions_practiced: number;
  is_completed: boolean;
  completed_at: string | null;
  started_at: string;
  updated_at: string;
}

interface UseStudyPlanGoalsReturn {
  goals: StudyPlanGoal[];
  isLoading: boolean;
  startGoal: (category: string, targetQuestions: number) => Promise<void>;
  updateProgress: (category: string, questionsDelta: number) => Promise<void>;
  markCompleted: (category: string) => Promise<void>;
  resetGoal: (category: string) => Promise<void>;
  getGoalForCategory: (category: string) => StudyPlanGoal | undefined;
}

export const useStudyPlanGoals = (): UseStudyPlanGoalsReturn => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<StudyPlanGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("study_plan_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.error("Error fetching study plan goals:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const startGoal = async (category: string, targetQuestions: number) => {
    if (!user) return;

    try {
      const existingGoal = goals.find((g) => g.category === category);

      if (existingGoal) {
        // Reset existing goal
        const { error } = await supabase
          .from("study_plan_goals")
          .update({
            target_questions: targetQuestions,
            questions_practiced: 0,
            is_completed: false,
            completed_at: null,
            started_at: new Date().toISOString(),
          })
          .eq("id", existingGoal.id);

        if (error) throw error;
      } else {
        // Create new goal
        const { error } = await supabase.from("study_plan_goals").insert({
          user_id: user.id,
          category,
          target_questions: targetQuestions,
          questions_practiced: 0,
          is_completed: false,
        });

        if (error) throw error;
      }

      await fetchGoals();
      toast.success(`Started study goal for ${category.toUpperCase()}`);
    } catch (err) {
      console.error("Error starting goal:", err);
      toast.error("Failed to start study goal");
    }
  };

  const updateProgress = async (category: string, questionsDelta: number) => {
    if (!user) return;

    const goal = goals.find((g) => g.category === category);
    if (!goal) return;

    try {
      const newPracticed = Math.max(0, goal.questions_practiced + questionsDelta);
      const isNowCompleted = newPracticed >= goal.target_questions;

      const { error } = await supabase
        .from("study_plan_goals")
        .update({
          questions_practiced: newPracticed,
          is_completed: isNowCompleted,
          completed_at: isNowCompleted && !goal.is_completed ? new Date().toISOString() : goal.completed_at,
        })
        .eq("id", goal.id);

      if (error) throw error;

      if (isNowCompleted && !goal.is_completed) {
        toast.success(`🎉 Completed ${category.toUpperCase()} study goal!`);
      }

      await fetchGoals();
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  };

  const markCompleted = async (category: string) => {
    if (!user) return;

    const goal = goals.find((g) => g.category === category);
    if (!goal) return;

    try {
      const { error } = await supabase
        .from("study_plan_goals")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          questions_practiced: goal.target_questions,
        })
        .eq("id", goal.id);

      if (error) throw error;

      toast.success(`Marked ${category.toUpperCase()} as completed!`);
      await fetchGoals();
    } catch (err) {
      console.error("Error marking completed:", err);
      toast.error("Failed to mark as completed");
    }
  };

  const resetGoal = async (category: string) => {
    if (!user) return;

    const goal = goals.find((g) => g.category === category);
    if (!goal) return;

    try {
      const { error } = await supabase
        .from("study_plan_goals")
        .update({
          questions_practiced: 0,
          is_completed: false,
          completed_at: null,
          started_at: new Date().toISOString(),
        })
        .eq("id", goal.id);

      if (error) throw error;

      toast.success(`Reset ${category.toUpperCase()} study goal`);
      await fetchGoals();
    } catch (err) {
      console.error("Error resetting goal:", err);
      toast.error("Failed to reset goal");
    }
  };

  const getGoalForCategory = (category: string) => {
    return goals.find((g) => g.category === category);
  };

  return {
    goals,
    isLoading,
    startGoal,
    updateProgress,
    markCompleted,
    resetGoal,
    getGoalForCategory,
  };
};
