import { useEffect, useState, useCallback, useRef } from "react";
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
  pageSize?: number;
}

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const { pageSize = 20 } = options;
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cursorRef = useRef<string | null>(null);

  const fetchActivities = useCallback(async (reset = true) => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      if (reset) {
        setLoading(true);
        cursorRef.current = null;
      } else {
        setLoadingMore(true);
      }

      let query = supabase
        .from("user_activity_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(pageSize + 1); // Fetch one extra to check if there's more

      // Use cursor for pagination
      if (!reset && cursorRef.current) {
        query = query.lt("created_at", cursorRef.current);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const fetchedData = (data as ActivityItem[]) || [];
      const hasMoreData = fetchedData.length > pageSize;
      const itemsToAdd = hasMoreData ? fetchedData.slice(0, pageSize) : fetchedData;

      // Update cursor for next page
      if (itemsToAdd.length > 0) {
        cursorRef.current = itemsToAdd[itemsToAdd.length - 1].created_at;
      }

      setHasMore(hasMoreData);

      if (reset) {
        setActivities(itemsToAdd);
      } else {
        setActivities((prev) => [...prev, ...itemsToAdd]);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, pageSize]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchActivities(false);
    }
  }, [fetchActivities, loadingMore, hasMore]);

  useEffect(() => {
    fetchActivities(true);
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
            ...prev,
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
  }, [user]);

  return {
    activities,
    loading,
    loadingMore,
    hasMore,
    error,
    refetch: () => fetchActivities(true),
    loadMore,
  };
}
