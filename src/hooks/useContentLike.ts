import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useContentLike = (contentId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isLiked, isLoading: isLikeLoading } = useQuery({
    queryKey: ["content-like", contentId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from("ai_content_likes")
        .select("id")
        .eq("content_id", contentId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!contentId && !!user,
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in to like content");

      if (isLiked) {
        const { error } = await supabase
          .from("ai_content_likes")
          .delete()
          .eq("content_id", contentId)
          .eq("user_id", user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ai_content_likes")
          .insert({ content_id: contentId, user_id: user.id });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-like", contentId] });
      queryClient.invalidateQueries({ queryKey: ["ai-content"] });
      queryClient.invalidateQueries({ queryKey: ["public-ai-content"] });
      queryClient.invalidateQueries({ queryKey: ["ai-content-detail"] });
    },
  });

  return {
    isLiked: isLiked ?? false,
    isLikeLoading,
    toggleLike: toggleLike.mutate,
    isToggling: toggleLike.isPending,
  };
};
