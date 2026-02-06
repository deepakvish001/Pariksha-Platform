import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const LOCAL_STORAGE_KEY = "outreach_favorites";

interface OutreachFavorite {
  template_id: string;
}

export const useOutreachFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from localStorage for guests or Supabase for logged-in users
  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        // Use type assertion since the types file may not be updated yet
        const { data, error } = await (supabase as any)
          .from("outreach_favorites")
          .select("template_id")
          .eq("user_id", user.id);

        if (error) throw error;
        setFavorites((data as OutreachFavorite[])?.map((f) => f.template_id) || []);
      } else {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        setFavorites(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorite = useCallback(
    (templateId: string) => favorites.includes(templateId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (templateId: string) => {
      const isCurrentlyFavorite = favorites.includes(templateId);

      try {
        if (user) {
          if (isCurrentlyFavorite) {
            const { error } = await (supabase as any)
              .from("outreach_favorites")
              .delete()
              .eq("user_id", user.id)
              .eq("template_id", templateId);

            if (error) throw error;
            setFavorites((prev) => prev.filter((id) => id !== templateId));
            toast({
              title: "Removed from favorites",
              description: "Template removed from your saved collection.",
            });
          } else {
            const { error } = await (supabase as any)
              .from("outreach_favorites")
              .insert({ user_id: user.id, template_id: templateId });

            if (error) throw error;
            setFavorites((prev) => [...prev, templateId]);
            toast({
              title: "Added to favorites",
              description: "Template saved to your collection.",
            });
          }
        } else {
          // Guest user - use localStorage
          const newFavorites = isCurrentlyFavorite
            ? favorites.filter((id) => id !== templateId)
            : [...favorites, templateId];

          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newFavorites));
          setFavorites(newFavorites);

          toast({
            title: isCurrentlyFavorite
              ? "Removed from favorites"
              : "Added to favorites",
            description: isCurrentlyFavorite
              ? "Template removed from your saved collection."
              : "Template saved to your collection. Sign in to sync across devices.",
          });
        }
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
        toast({
          title: "Error",
          description: "Failed to update favorite. Please try again.",
          variant: "destructive",
        });
      }
    },
    [favorites, user]
  );

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
  };
};
