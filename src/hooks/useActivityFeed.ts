import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  isNew?: boolean;
}

interface UseActivityFeedOptions {
  limit?: number;
}

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const { limit = 50 } = options;
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("user_activity_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      setActivities((data as ActivityItem[]) || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_activity_log",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newActivity = payload.new as ActivityItem;
          setActivities((prev) => [
            { ...newActivity, isNew: true },
            ...prev.slice(0, limit - 1),
          ]);

          // Remove "isNew" flag after animation
          setTimeout(() => {
            setActivities((prev) =>
              prev.map((a) =>
                a.id === newActivity.id ? { ...a, isNew: false } : a
              )
            );
          }, 2000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, limit]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  };
}
