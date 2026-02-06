import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ResumeTemplate } from "@/data/resumeTemplatesData";

interface ResumeFavorite {
  id: string;
  user_id: string;
  template_id: number;
  created_at: string;
}

interface ResumeDownload {
  id: string;
  user_id: string;
  template_id: number;
  template_name: string;
  downloaded_at: string;
  created_at: string;
}

export const useResumeFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["resume-favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("resume_favorites")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as ResumeFavorite[];
    },
    enabled: !!user,
  });

  const addFavorite = useMutation({
    mutationFn: async (templateId: number) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("resume_favorites")
        .insert({
          user_id: user.id,
          template_id: templateId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-favorites"] });
      toast.success("Added to favorites!");
    },
    onError: (error) => {
      console.error("Error adding favorite:", error);
      toast.error("Failed to add to favorites");
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (templateId: number) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("resume_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("template_id", templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-favorites"] });
      toast.success("Removed from favorites");
    },
    onError: (error) => {
      console.error("Error removing favorite:", error);
      toast.error("Failed to remove from favorites");
    },
  });

  const isFavorite = useCallback(
    (templateId: number) => {
      return favorites.some((f) => f.template_id === templateId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (templateId: number) => {
      if (!user) {
        toast.error("Please sign in to save favorites");
        return;
      }

      if (isFavorite(templateId)) {
        removeFavorite.mutate(templateId);
      } else {
        addFavorite.mutate(templateId);
      }
    },
    [user, isFavorite, addFavorite, removeFavorite]
  );

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite: addFavorite.mutate,
    removeFavorite: removeFavorite.mutate,
  };
};

export const useResumeDownloads = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: downloads = [], isLoading } = useQuery({
    queryKey: ["resume-downloads", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("resume_downloads")
        .select("*")
        .eq("user_id", user.id)
        .order("downloaded_at", { ascending: false });

      if (error) throw error;
      return data as ResumeDownload[];
    },
    enabled: !!user,
  });

  const trackDownload = useMutation({
    mutationFn: async (template: ResumeTemplate) => {
      if (!user) {
        // Still allow download for non-authenticated users, just don't track
        return null;
      }

      const { data, error } = await supabase
        .from("resume_downloads")
        .insert({
          user_id: user.id,
          template_id: template.id,
          template_name: template.name,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-downloads"] });
      toast.success("Download started!");
    },
    onError: (error) => {
      console.error("Error tracking download:", error);
      // Don't show error toast for tracking - download should still work
    },
  });

  const getDownloadCount = useCallback(
    (templateId: number) => {
      return downloads.filter((d) => d.template_id === templateId).length;
    },
    [downloads]
  );

  return {
    downloads,
    isLoading,
    trackDownload: trackDownload.mutate,
    getDownloadCount,
  };
};
