import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { flattenTreeNodes, type RoadmapTreeNode } from "@/data/roadmapTreesData";

interface NodeProgress {
  completed: boolean;
  inProgress: boolean;
}

export const useRoadmapTreeProgress = (treeId: string, nodes: RoadmapTreeNode[]) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, NodeProgress>>({});
  const [loading, setLoading] = useState(true);

  const sheetId = `roadmap-tree-${treeId}`;

  // Fetch progress from database
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_topic_progress")
          .select("topic_id, completed, is_revision")
          .eq("user_id", user.id)
          .eq("sheet_id", sheetId);

        if (error) throw error;

        const progressMap: Record<string, NodeProgress> = {};
        
        if (data) {
          data.forEach((item) => {
            progressMap[item.topic_id] = {
              completed: item.completed,
              inProgress: item.is_revision, // Using is_revision as "in progress" indicator
            };
          });
        }

        setProgress(progressMap);
      } catch (error) {
        console.error("Error fetching roadmap tree progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user, sheetId]);

  // Toggle node completion
  const toggleNodeComplete = useCallback(async (nodeId: string) => {
    if (!user) return;

    const currentProgress = progress[nodeId] || { completed: false, inProgress: false };
    const newCompleted = !currentProgress.completed;

    // Optimistic update
    setProgress(prev => ({
      ...prev,
      [nodeId]: {
        ...currentProgress,
        completed: newCompleted,
        inProgress: false, // Clear in-progress when completing
      },
    }));

    try {
      const { data: existing } = await supabase
        .from("user_topic_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("sheet_id", sheetId)
        .eq("topic_id", nodeId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_topic_progress")
          .update({
            completed: newCompleted,
            completed_at: newCompleted ? new Date().toISOString() : null,
            is_revision: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_topic_progress").insert({
          user_id: user.id,
          sheet_id: sheetId,
          topic_id: nodeId,
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
          is_revision: false,
        });
      }
    } catch (error) {
      console.error("Error updating node progress:", error);
      // Revert on error
      setProgress(prev => ({
        ...prev,
        [nodeId]: currentProgress,
      }));
    }
  }, [user, sheetId, progress]);

  // Set node as in progress
  const setNodeInProgress = useCallback(async (nodeId: string) => {
    if (!user) return;

    const currentProgress = progress[nodeId] || { completed: false, inProgress: false };
    
    // Skip if already completed
    if (currentProgress.completed) return;

    const newInProgress = !currentProgress.inProgress;

    // Optimistic update
    setProgress(prev => ({
      ...prev,
      [nodeId]: {
        ...currentProgress,
        inProgress: newInProgress,
      },
    }));

    try {
      const { data: existing } = await supabase
        .from("user_topic_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("sheet_id", sheetId)
        .eq("topic_id", nodeId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_topic_progress")
          .update({
            is_revision: newInProgress,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_topic_progress").insert({
          user_id: user.id,
          sheet_id: sheetId,
          topic_id: nodeId,
          completed: false,
          is_revision: newInProgress,
        });
      }
    } catch (error) {
      console.error("Error updating node progress:", error);
      // Revert on error
      setProgress(prev => ({
        ...prev,
        [nodeId]: currentProgress,
      }));
    }
  }, [user, sheetId, progress]);

  // Calculate stats
  const allNodes = flattenTreeNodes(nodes);
  const completedCount = allNodes.filter(n => progress[n.id]?.completed).length;
  const inProgressCount = allNodes.filter(n => progress[n.id]?.inProgress).length;

  return {
    progress,
    loading,
    toggleNodeComplete,
    setNodeInProgress,
    stats: {
      total: allNodes.length,
      completed: completedCount,
      inProgress: inProgressCount,
      percentage: Math.round((completedCount / allNodes.length) * 100) || 0,
    },
  };
};
