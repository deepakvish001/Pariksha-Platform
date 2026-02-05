import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface RoadmapNote {
  id: string;
  user_id: string;
  roadmap_id: string;
  node_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export const useRoadmapNotes = (roadmapId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all notes for this roadmap
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["roadmap-notes", roadmapId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_roadmap_notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("roadmap_id", roadmapId);

      if (error) throw error;
      return data as RoadmapNote[];
    },
    enabled: !!user && !!roadmapId,
  });

  // Get note for a specific node
  const getNoteForNode = useCallback((nodeId: string): string => {
    const note = notes.find((n) => n.node_id === nodeId);
    return note?.note || "";
  }, [notes]);

  // Check if a node has a note
  const hasNote = useCallback((nodeId: string): boolean => {
    return notes.some((n) => n.node_id === nodeId && n.note.trim().length > 0);
  }, [notes]);

  // Save or update note mutation
  const saveNoteMutation = useMutation({
    mutationFn: async ({ nodeId, note }: { nodeId: string; note: string }) => {
      if (!user) throw new Error("User not authenticated");

      // Check if note exists
      const existingNote = notes.find((n) => n.node_id === nodeId);

      if (existingNote) {
        // Update existing note
        const { error } = await supabase
          .from("user_roadmap_notes")
          .update({ note, updated_at: new Date().toISOString() })
          .eq("id", existingNote.id);

        if (error) throw error;
      } else {
        // Insert new note
        const { error } = await supabase
          .from("user_roadmap_notes")
          .insert({
            user_id: user.id,
            roadmap_id: roadmapId,
            node_id: nodeId,
            note,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-notes", roadmapId] });
    },
    onError: (error) => {
      console.error("Failed to save note:", error);
      toast({
        title: "Error",
        description: "Failed to save your note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("user_roadmap_notes")
        .delete()
        .eq("user_id", user.id)
        .eq("roadmap_id", roadmapId)
        .eq("node_id", nodeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-notes", roadmapId] });
      toast({
        title: "Note deleted",
        description: "Your note has been removed.",
      });
    },
    onError: (error) => {
      console.error("Failed to delete note:", error);
      toast({
        title: "Error",
        description: "Failed to delete your note. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    notes,
    isLoading,
    getNoteForNode,
    hasNote,
    saveNote: saveNoteMutation.mutate,
    deleteNote: deleteNoteMutation.mutate,
    isSaving: saveNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
};
