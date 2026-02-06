import { useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useThemeSync = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, extendedProfile } = useAuth();

  // Load theme from database on mount
  useEffect(() => {
    // Access the new column using type assertion
    const profile = extendedProfile as unknown as { theme_preference?: string } | null;
    if (profile?.theme_preference) {
      setTheme(profile.theme_preference);
    }
  }, [extendedProfile, setTheme]);

  // Sync theme to database when it changes
  const syncTheme = useCallback(async (newTheme: string) => {
    if (!user) return;

    setTheme(newTheme);

    try {
      await supabase
        .from("user_profiles_extended")
        .update({ theme_preference: newTheme } as Record<string, unknown>)
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Failed to sync theme preference:", error);
    }
  }, [user, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme: syncTheme,
  };
};
