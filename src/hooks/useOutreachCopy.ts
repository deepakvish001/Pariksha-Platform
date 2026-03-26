import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useOutreachCopy = () => {
  const { user } = useAuth();

  const trackCopy = useCallback(
    async (templateId: string) => {
      if (!user) return;

      try {
        await (supabase as any)
          .from("outreach_usage")
          .insert({ user_id: user.id, template_id: templateId });
      } catch (error) {
        console.error("Failed to track copy:", error);
      }
    },
    [user]
  );

  return { trackCopy };
};
