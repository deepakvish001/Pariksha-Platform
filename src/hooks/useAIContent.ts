import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type AIContentType = "plan" | "course" | "guide" | "roadmap" | "quiz";

export interface AIGeneratedContent {
  id: string;
  user_id: string;
  content_type: AIContentType;
  title: string;
  topic: string;
  content: Record<string, unknown>;
  is_public: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export function useAIContent(contentType?: AIContentType) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contents, isLoading, error } = useQuery({
    queryKey: ["ai-content", contentType, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("ai_generated_content")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (contentType) {
        query = query.eq("content_type", contentType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as AIGeneratedContent[];
    },
    enabled: !!user,
  });

  const generateContent = useMutation({
    mutationFn: async ({
      topic,
      contentType,
      includeQuestions = false,
    }: {
      topic: string;
      contentType: AIContentType;
      includeQuestions?: boolean;
    }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ topic, contentType, includeQuestions }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      return response.json() as Promise<AIGeneratedContent>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ai-content"] });
      toast({
        title: "Content Generated!",
        description: `Your ${data.content_type} "${data.title}" is ready.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ai_generated_content")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-content"] });
      toast({
        title: "Deleted",
        description: "Content has been removed.",
      });
    },
  });

  const togglePublic = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const { error } = await supabase
        .from("ai_generated_content")
        .update({ is_public: isPublic })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, { isPublic }) => {
      queryClient.invalidateQueries({ queryKey: ["ai-content"] });
      toast({
        title: isPublic ? "Made Public" : "Made Private",
        description: isPublic 
          ? "Others can now see this content." 
          : "Only you can see this content now.",
      });
    },
  });

  return {
    contents: contents || [],
    isLoading,
    error,
    generateContent,
    deleteContent,
    togglePublic,
  };
}

export interface PublicAIContent extends AIGeneratedContent {
  creator?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function usePublicAIContent(contentType?: AIContentType) {
  const { data: contents, isLoading } = useQuery({
    queryKey: ["public-ai-content", contentType],
    queryFn: async () => {
      let query = supabase
        .from("ai_generated_content")
        .select(`
          *,
          profiles!ai_generated_content_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq("is_public", true)
        .order("likes_count", { ascending: false })
        .limit(50);
      
      if (contentType) {
        query = query.eq("content_type", contentType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to include creator info
      return (data || []).map((item: any) => ({
        ...item,
        creator: item.profiles ? {
          full_name: item.profiles.full_name,
          avatar_url: item.profiles.avatar_url,
        } : null,
        profiles: undefined,
      })) as PublicAIContent[];
    },
  });

  return { contents: contents || [], isLoading };
}
