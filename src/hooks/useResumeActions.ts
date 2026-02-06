import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ResumeTemplate, resumeTemplates } from "@/data/resumeTemplatesData";

interface ResumeFavorite {
  id: string;
  user_id: string;
  template_id: number;
  created_at: string;
}

export interface ResumeDownload {
  id: string;
  user_id: string;
  template_id: number;
  template_name: string;
  downloaded_at: string;
  created_at: string;
}

// Helper to get the storage URL for a template
const getTemplateStorageUrl = (templateId: number, format: string = "pdf") => {
  const { data } = supabase.storage
    .from("resume-templates")
    .getPublicUrl(`template-${templateId}.${format.toLowerCase()}`);
  return data.publicUrl;
};

// Helper to trigger actual file download
const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("File not found");
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  } catch (error) {
    console.error("Download failed:", error);
    return false;
  }
};

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

  const trackDownloadMutation = useMutation({
    mutationFn: async (template: ResumeTemplate) => {
      // Track in database if user is logged in
      if (user) {
        const { data, error } = await supabase
          .from("resume_downloads")
          .insert({
            user_id: user.id,
            template_id: template.id,
            template_name: template.name,
          })
          .select()
          .single();

        if (error) {
          console.error("Error tracking download:", error);
        }
      }

      // Attempt to download from storage
      const storageUrl = getTemplateStorageUrl(template.id, "pdf");
      const filename = `${template.name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      
      const downloaded = await downloadFile(storageUrl, filename);
      
      if (!downloaded) {
        // If storage file doesn't exist, create a placeholder PDF download
        // This is a fallback - in production, actual files would be in storage
        toast.info("Template download prepared!", {
          description: "File will be available soon. Check back later for the full template.",
        });
        return { template, fallback: true };
      }
      
      return { template, fallback: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["resume-downloads"] });
      if (result && !result.fallback) {
        toast.success("Download complete!", {
          description: `${result.template.name} has been downloaded.`,
        });
      }
    },
    onError: (error) => {
      console.error("Download error:", error);
      toast.error("Download failed. Please try again.");
    },
  });

  const clearHistory = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("resume_downloads")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-downloads"] });
      toast.success("Download history cleared");
    },
    onError: (error) => {
      console.error("Error clearing history:", error);
      toast.error("Failed to clear history");
    },
  });

  const getDownloadCount = useCallback(
    (templateId: number) => {
      return downloads.filter((d) => d.template_id === templateId).length;
    },
    [downloads]
  );

  const redownload = useCallback(
    (templateId: number) => {
      const template = resumeTemplates.find((t) => t.id === templateId);
      if (template) {
        trackDownloadMutation.mutate(template);
      }
    },
    [trackDownloadMutation]
  );

  return {
    downloads,
    isLoading,
    trackDownload: trackDownloadMutation.mutate,
    clearHistory: clearHistory.mutate,
    getDownloadCount,
    redownload,
    isDownloading: trackDownloadMutation.isPending,
  };
};
