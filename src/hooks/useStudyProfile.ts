import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StudyProfile {
  user_id: string;
  goal: string;
  target_date: string | null;
  weekday_minutes: number;
  weekend_minutes: number;
  level: string;
  topics_known: string[];
  notes: string | null;
}

export const useStudyProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("user_study_profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile((data as StudyProfile) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (patch: Omit<StudyProfile, "user_id">) => {
      if (!user) throw new Error("Not signed in");
      const row = { user_id: user.id, ...patch };
      const { error } = await supabase
        .from("user_study_profile")
        .upsert(row, { onConflict: "user_id" });
      if (error) throw error;
      await refresh();
    },
    [user, refresh]
  );

  return { profile, loading, save, refresh };
};
