import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, subMonths, startOfDay, startOfWeek, eachDayOfInterval, eachWeekOfInterval } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ViewMode = "weekly" | "monthly";

const WeeklyProgressChart = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");

  const { data: activityData, isLoading } = useQuery({
    queryKey: ["progress-chart-activity", user?.id, viewMode],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = viewMode === "weekly" 
        ? subDays(new Date(), 6)
        : subMonths(new Date(), 1);
      
      const { data, error } = await supabase
        .from("user_topic_progress")
        .select("updated_at, completed")
        .eq("user_id", user.id)
        .gte("updated_at", startDate.toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const chartData = useMemo(() => {
    const today = new Date();
    
    if (viewMode === "weekly") {
      const sevenDaysAgo = subDays(today, 6);
      const days = eachDayOfInterval({ start: sevenDaysAgo, end: today });
      
      const activityByDay: Record<string, number> = {};
      
      activityData?.forEach((item) => {
        const dayKey = format(startOfDay(new Date(item.updated_at)), "yyyy-MM-dd");
        activityByDay[dayKey] = (activityByDay[dayKey] || 0) + 1;
      });

      return days.map((day) => {
        const dayKey = format(day, "yyyy-MM-dd");
        const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
        return {
          label: format(day, "EEE"),
          fullDate: format(day, "MMM d"),
          count: activityByDay[dayKey] || 0,
          isToday,
        };
      });
    } else {
      // Monthly view - group by week
      const oneMonthAgo = subMonths(today, 1);
      const weeks = eachWeekOfInterval({ start: oneMonthAgo, end: today }, { weekStartsOn: 1 });
      
      const activityByWeek: Record<string, number> = {};
      
      activityData?.forEach((item) => {
        const weekStart = startOfWeek(new Date(item.updated_at), { weekStartsOn: 1 });
        const weekKey = format(weekStart, "yyyy-MM-dd");
        activityByWeek[weekKey] = (activityByWeek[weekKey] || 0) + 1;
      });

      const currentWeekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");

      return weeks.map((week) => {
        const weekKey = format(week, "yyyy-MM-dd");
        const isCurrentWeek = weekKey === currentWeekStart;
        return {
          label: format(week, "MMM d"),
          fullDate: `Week of ${format(week, "MMM d")}`,
          count: activityByWeek[weekKey] || 0,
          isToday: isCurrentWeek,
        };
      });
    }
  }, [activityData, viewMode]);

  const totalCount = chartData.reduce((sum, d) => sum + d.count, 0);
  const periodLength = viewMode === "weekly" ? 7 : chartData.length;
  const avgPerPeriod = totalCount > 0 ? Math.round(totalCount / periodLength) : 0;
  const maxItem = chartData.reduce((max, d) => (d.count > max.count ? d : max), chartData[0]);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  {viewMode === "weekly" ? "Weekly" : "Monthly"} Activity
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {viewMode === "weekly" ? "Last 7 days" : "Last 30 days"}
                </p>
              </div>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-7 p-0.5">
                <TabsTrigger value="weekly" className="text-xs px-2 h-6">
                  Week
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-2 h-6">
                  Month
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-bold text-primary">{totalCount}</div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-bold">{avgPerPeriod}</div>
              <div className="text-[10px] text-muted-foreground">
                {viewMode === "weekly" ? "Avg/Day" : "Avg/Week"}
              </div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-bold text-emerald-500">{maxItem?.count || 0}</div>
              <div className="text-[10px] text-muted-foreground">
                {viewMode === "weekly" ? "Best Day" : "Best Week"}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: viewMode === "weekly" ? 10 : 8, fill: 'hsl(var(--muted-foreground))' }}
                  interval={0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  width={30}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                          <p className="text-xs font-medium">{data.fullDate}</p>
                          <p className="text-sm text-primary font-bold">{data.count} activities</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isToday ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>{viewMode === "weekly" ? "Today" : "This week"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary/40" />
              <span>{viewMode === "weekly" ? "Previous days" : "Previous weeks"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeeklyProgressChart;
