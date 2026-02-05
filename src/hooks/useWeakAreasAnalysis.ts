import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CategoryStats {
  category: string;
  label: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  accuracy: number;
  avgTimeSeconds: number;
}

interface WeakAreasData {
  categoryStats: CategoryStats[];
  overallAccuracy: number;
  weakestCategory: string | null;
  strongestCategory: string | null;
  isLoading: boolean;
  error: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  dsa: "Data Structures & Algorithms",
  cs: "Computer Science",
  sql: "SQL & Databases",
  aptitude: "Aptitude & Reasoning",
};

export const useWeakAreasAnalysis = (): WeakAreasData => {
  const { user } = useAuth();
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResponses = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all question responses for the user
        const { data: quizResults, error: resultsError } = await supabase
          .from("quiz_results")
          .select("id")
          .eq("user_id", user.id);

        if (resultsError) throw resultsError;

        if (!quizResults || quizResults.length === 0) {
          setResponses([]);
          setIsLoading(false);
          return;
        }

        const resultIds = quizResults.map((r) => r.id);

        const { data: responsesData, error: responsesError } = await supabase
          .from("quiz_question_responses")
          .select("*")
          .in("quiz_result_id", resultIds);

        if (responsesError) throw responsesError;

        setResponses(responsesData || []);
      } catch (err: any) {
        console.error("Error fetching weak areas data:", err);
        setError(err.message || "Failed to load analysis data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResponses();
  }, [user]);

  const analysisData = useMemo(() => {
    if (responses.length === 0) {
      return {
        categoryStats: [],
        overallAccuracy: 0,
        weakestCategory: null,
        strongestCategory: null,
      };
    }

    // Group by category
    const categoryGroups: Record<string, any[]> = {};
    responses.forEach((r) => {
      const cat = r.question_category;
      if (!categoryGroups[cat]) {
        categoryGroups[cat] = [];
      }
      categoryGroups[cat].push(r);
    });

    // Calculate stats per category
    const categoryStats: CategoryStats[] = Object.entries(categoryGroups).map(
      ([category, items]) => {
        const total = items.length;
        const correct = items.filter((i) => i.is_correct).length;
        const skipped = items.filter((i) => i.selected_answer_index === null).length;
        const incorrect = total - correct - skipped;
        const totalTime = items.reduce((sum, i) => sum + (i.time_taken_seconds || 0), 0);

        return {
          category,
          label: CATEGORY_LABELS[category] || category.toUpperCase(),
          totalQuestions: total,
          correctAnswers: correct,
          incorrectAnswers: incorrect,
          skippedAnswers: skipped,
          accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
          avgTimeSeconds: total > 0 ? Math.round(totalTime / total) : 0,
        };
      }
    );

    // Sort by accuracy (weakest first)
    categoryStats.sort((a, b) => a.accuracy - b.accuracy);

    const totalCorrect = responses.filter((r) => r.is_correct).length;
    const overallAccuracy =
      responses.length > 0 ? Math.round((totalCorrect / responses.length) * 100) : 0;

    const weakestCategory = categoryStats.length > 0 ? categoryStats[0].category : null;
    const strongestCategory =
      categoryStats.length > 0 ? categoryStats[categoryStats.length - 1].category : null;

    return {
      categoryStats,
      overallAccuracy,
      weakestCategory,
      strongestCategory,
    };
  }, [responses]);

  return {
    ...analysisData,
    isLoading,
    error,
  };
};
