import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useOutreachCopy = () => {
  const { user } = useAuth();

  const trackCopy = useCallback(
    async (templateId: string) => {
      if (!user) return;

      try {
        await supabase
          .from("outreach_usage")
          .insert({ user_id: user.id, template_id: templateId });
      } catch (error) {
        // Silently fail for usage tracking
        console.error("Failed to track copy:", error);
      }
    },
    [user]
  );

  return { trackCopy };
};
