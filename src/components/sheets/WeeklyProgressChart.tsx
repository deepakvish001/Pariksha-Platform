import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Calendar, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const WeeklyProgressChart = () => {
  const { user } = useAuth();

  const { data: activityData, isLoading } = useQuery({
    queryKey: ["weekly-sheet-activity", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const sevenDaysAgo = subDays(new Date(), 6);
      
      const { data, error } = await supabase
        .from("user_topic_progress")
        .select("updated_at, completed")
        .eq("user_id", user.id)
        .gte("updated_at", sevenDaysAgo.toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const chartData = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 6);
    
    // Generate all 7 days
    const days = eachDayOfInterval({ start: sevenDaysAgo, end: today });
    
    // Count activities per day
    const activityByDay: Record<string, number> = {};
    
    activityData?.forEach((item) => {
      const dayKey = format(startOfDay(new Date(item.updated_at)), "yyyy-MM-dd");
      activityByDay[dayKey] = (activityByDay[dayKey] || 0) + 1;
    });

    return days.map((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
      return {
        day: format(day, "EEE"),
        fullDate: format(day, "MMM d"),
        count: activityByDay[dayKey] || 0,
        isToday,
      };
    });
  }, [activityData]);

  const totalThisWeek = chartData.reduce((sum, d) => sum + d.count, 0);
  const avgPerDay = totalThisWeek > 0 ? Math.round(totalThisWeek / 7) : 0;
  const maxDay = chartData.reduce((max, d) => (d.count > max.count ? d : max), chartData[0]);

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
                <CardTitle className="text-base font-semibold">Weekly Activity</CardTitle>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-bold text-primary">{totalThisWeek}</div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-bold">{avgPerDay}</div>
              <div className="text-[10px] text-muted-foreground">Avg/Day</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-bold text-emerald-500">{maxDay?.count || 0}</div>
              <div className="text-[10px] text-muted-foreground">Best Day</div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
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
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary/40" />
              <span>Previous days</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeeklyProgressChart;
