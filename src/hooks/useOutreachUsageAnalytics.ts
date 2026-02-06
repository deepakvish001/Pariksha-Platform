import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UsageEntry {
  template_id: string;
  copied_at: string;
}

interface UsageStats {
  templateId: string;
  count: number;
  lastUsed: string;
}

export const useOutreachUsageAnalytics = () => {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<UsageEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsageData = useCallback(async () => {
    if (!user) {
      setUsageData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("outreach_usage")
        .select("template_id, copied_at")
        .eq("user_id", user.id)
        .order("copied_at", { ascending: false });

      if (error) throw error;
      setUsageData(data || []);
    } catch (error) {
      console.error("Failed to load usage data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  // Calculate statistics
  const stats = usageData.reduce<Record<string, UsageStats>>((acc, entry) => {
    if (!acc[entry.template_id]) {
      acc[entry.template_id] = {
        templateId: entry.template_id,
        count: 0,
        lastUsed: entry.copied_at,
      };
    }
    acc[entry.template_id].count++;
    return acc;
  }, {});

  const topTemplates = Object.values(stats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalCopies = usageData.length;

  // Group by date for chart
  const copyHistory = usageData.reduce<Record<string, number>>((acc, entry) => {
    const date = new Date(entry.copied_at).toISOString().split("T")[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(copyHistory)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Last 30 days

  // Recent activity
  const recentActivity = usageData.slice(0, 10);

  return {
    usageData,
    isLoading,
    topTemplates,
    totalCopies,
    chartData,
    recentActivity,
    refresh: loadUsageData,
  };
};
