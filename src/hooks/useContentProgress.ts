import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProgressData {
  completedItems: string[];
  quizScore?: number;
  quizAttempts?: number;
  lastQuizScore?: number;
}

export const useContentProgress = (contentId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ["content-progress", contentId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("ai_content_progress")
        .select("*")
        .eq("content_id", contentId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!contentId && !!user,
  });

  const updateProgress = useMutation({
    mutationFn: async (newProgress: Partial<ProgressData>) => {
      if (!user) throw new Error("Must be logged in to track progress");

      const currentProgress = (progress?.progress as unknown as ProgressData) || { completedItems: [] };
      const mergedProgress = { ...currentProgress, ...newProgress };

      if (progress) {
        const { error } = await supabase
          .from("ai_content_progress")
          .update({
            progress: mergedProgress,
            last_accessed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", progress.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ai_content_progress")
          .insert({
            content_id: contentId,
            user_id: user.id,
            progress: mergedProgress,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-progress", contentId] });
    },
  });

  const toggleItemComplete = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error("Must be logged in to track progress");

      const currentProgress = (progress?.progress as unknown as ProgressData) || { completedItems: [] };
      const completedItems = currentProgress.completedItems || [];
      
      const newCompletedItems = completedItems.includes(itemId)
        ? completedItems.filter(id => id !== itemId)
        : [...completedItems, itemId];

      const newProgress = { ...currentProgress, completedItems: newCompletedItems };

      if (progress) {
        const { error } = await supabase
          .from("ai_content_progress")
          .update({
            progress: newProgress,
            last_accessed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", progress.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ai_content_progress")
          .insert({
            content_id: contentId,
            user_id: user.id,
            progress: newProgress,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-progress", contentId] });
    },
  });

  const saveQuizResult = useMutation({
    mutationFn: async ({ score, total }: { score: number; total: number }) => {
      if (!user) throw new Error("Must be logged in to save quiz results");

      const currentProgress = (progress?.progress as unknown as ProgressData) || { completedItems: [] };
      const attempts = (currentProgress.quizAttempts || 0) + 1;
      const bestScore = Math.max(currentProgress.quizScore || 0, score);

      const newProgress = {
        ...currentProgress,
        quizScore: bestScore,
        quizAttempts: attempts,
        lastQuizScore: score,
      };

      if (progress) {
        const { error } = await supabase
          .from("ai_content_progress")
          .update({
            progress: newProgress,
            last_accessed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            completed_at: score === total ? new Date().toISOString() : null,
          })
          .eq("id", progress.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ai_content_progress")
          .insert({
            content_id: contentId,
            user_id: user.id,
            progress: newProgress,
            completed_at: score === total ? new Date().toISOString() : null,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-progress", contentId] });
    },
  });

  const progressData = (progress?.progress as unknown as ProgressData) || { completedItems: [] };

  return {
    progress: progressData,
    isLoading,
    completedItems: progressData.completedItems || [],
    quizScore: progressData.quizScore,
    quizAttempts: progressData.quizAttempts,
    lastQuizScore: progressData.lastQuizScore,
    isCompleted: !!progress?.completed_at,
    toggleItemComplete: toggleItemComplete.mutate,
    updateProgress: updateProgress.mutate,
    saveQuizResult: saveQuizResult.mutate,
    isUpdating: updateProgress.isPending || toggleItemComplete.isPending || saveQuizResult.isPending,
  };
};
