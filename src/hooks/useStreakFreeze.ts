import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface StreakFreezeData {
  canUseFreeze: boolean;
  lastFreezeUsedAt: string | null;
  daysUntilNextFreeze: number;
  isLoading: boolean;
}

export const useStreakFreeze = () => {
  const { user } = useAuth();
  const [freezeData, setFreezeData] = useState<StreakFreezeData>({
    canUseFreeze: false,
    lastFreezeUsedAt: null,
    daysUntilNextFreeze: 0,
    isLoading: true,
  });

  const checkFreezeAvailability = useCallback(async () => {
    if (!user) {
      setFreezeData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("user_profiles_extended")
        .select("other_links")
        .eq("user_id", user.id)
        .maybeSingle();

      // Store streak freeze data in other_links JSON field
      const otherLinks = profile?.other_links as Record<string, unknown> || {};
      const lastFreezeUsedAt = (otherLinks.streak_freeze_used_at as string) || null;

      let canUseFreeze = true;
      let daysUntilNextFreeze = 0;

      if (lastFreezeUsedAt) {
        const lastUsedDate = new Date(lastFreezeUsedAt);
        const now = new Date();
        const daysSinceLastUse = Math.floor(
          (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastUse < 7) {
          canUseFreeze = false;
          daysUntilNextFreeze = 7 - daysSinceLastUse;
        }
      }

      setFreezeData({
        canUseFreeze,
        lastFreezeUsedAt,
        daysUntilNextFreeze,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error checking freeze availability:", error);
      setFreezeData(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  const useStreakFreezeAction = useCallback(async (): Promise<boolean> => {
    if (!user || !freezeData.canUseFreeze) {
      toast.error("You can't use a streak freeze right now");
      return false;
    }

    try {
      // Get current other_links
      const { data: profile } = await supabase
        .from("user_profiles_extended")
        .select("other_links")
        .eq("user_id", user.id)
        .maybeSingle();

      const otherLinks = (profile?.other_links as Record<string, unknown>) || {};
      
      // Update with new freeze timestamp
      const updatedLinks = {
        ...otherLinks,
        streak_freeze_used_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_profiles_extended")
        .update({ other_links: updatedLinks })
        .eq("user_id", user.id);

      if (error) throw error;

      // Also create a virtual "activity" for yesterday to restore streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Insert a special marker for streak freeze
      await supabase
        .from("user_topic_progress")
        .insert({
          user_id: user.id,
          sheet_id: "streak-freeze",
          topic_id: `freeze-${Date.now()}`,
          completed: true,
          completed_at: yesterday.toISOString(),
        });

      toast.success("🧊 Streak freeze activated! Your streak has been preserved.");
      
      setFreezeData({
        canUseFreeze: false,
        lastFreezeUsedAt: new Date().toISOString(),
        daysUntilNextFreeze: 7,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error("Error using streak freeze:", error);
      toast.error("Failed to use streak freeze");
      return false;
    }
  }, [user, freezeData.canUseFreeze]);

  useEffect(() => {
    checkFreezeAvailability();
  }, [checkFreezeAvailability]);

  return {
    ...freezeData,
    useStreakFreeze: useStreakFreezeAction,
    refreshFreeze: checkFreezeAvailability,
  };
};
