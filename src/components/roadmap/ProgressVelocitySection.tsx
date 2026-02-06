import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Calendar, Zap, BarChart3, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRoadmapProgressHistory } from "@/hooks/useRoadmapProgressHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

const ProgressVelocitySection: React.FC = () => {
  const { user } = useAuth();
  const {
    dailyProgress,
    weeklyProgress,
    monthlyProgress,
    currentWeekCount,
    lastWeekCount,
    currentMonthCount,
    weeklyTrend,
    monthlyTrend,
    averagePerDay,
    isLoading,
  } = useRoadmapProgressHistory();

  if (!user) return null;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-6xl mx-auto mb-10"
      >
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </motion.div>
    );
  }

  // Don't show if no activity
  const hasActivity = dailyProgress.some(d => d.count > 0);
  if (!hasActivity) return null;

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-emerald-500";
    if (trend < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  const maxDailyCount = Math.max(...dailyProgress.map(d => d.count), 1);
  const maxWeeklyCount = Math.max(...weeklyProgress.map(w => w.completed), 1);
  const maxMonthlyCount = Math.max(...monthlyProgress.map(m => m.completed), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="max-w-6xl mx-auto mb-10"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Progress Velocity</h3>
          <p className="text-sm text-muted-foreground">Track your learning momentum over time</p>
        </div>
      </div>

      <Card className="border-2">
        <CardContent className="p-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* This Week */}
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">This Week</span>
              </div>
              <p className="text-3xl font-bold">{currentWeekCount}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {getTrendIcon(weeklyTrend)}
                <span className={cn("text-sm font-medium", getTrendColor(weeklyTrend))}>
                  {weeklyTrend > 0 ? "+" : ""}{weeklyTrend}%
                </span>
              </div>
            </div>

            {/* Last Week */}
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Last Week</span>
              </div>
              <p className="text-3xl font-bold text-muted-foreground">{lastWeekCount}</p>
              <p className="text-xs text-muted-foreground mt-1">topics completed</p>
            </div>

            {/* This Month */}
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">This Month</span>
              </div>
              <p className="text-3xl font-bold">{currentMonthCount}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {getTrendIcon(monthlyTrend)}
                <span className={cn("text-sm font-medium", getTrendColor(monthlyTrend))}>
                  {monthlyTrend > 0 ? "+" : ""}{monthlyTrend}%
                </span>
              </div>
            </div>

            {/* Daily Average */}
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-violet-500" />
                <span className="text-sm text-muted-foreground">Daily Avg</span>
              </div>
              <p className="text-3xl font-bold">{averagePerDay}</p>
              <p className="text-xs text-muted-foreground mt-1">topics/day</p>
            </div>
          </div>

          {/* Daily Activity Chart (Last 14 days) */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Daily Activity (Last 14 days)</h4>
            <div className="flex items-end gap-1 h-20">
              {dailyProgress.map((day, index) => {
                const height = day.count > 0 ? Math.max((day.count / maxDailyCount) * 100, 10) : 5;
                const isToday = index === dailyProgress.length - 1;
                
                return (
                  <motion.div
                    key={day.date}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "flex-1 rounded-t-sm transition-colors",
                      day.count > 0 
                        ? isToday 
                          ? "bg-primary" 
                          : "bg-primary/60 hover:bg-primary/80"
                        : "bg-muted"
                    )}
                    title={`${day.date}: ${day.count} topics`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>2 weeks ago</span>
              <span>Today</span>
            </div>
          </div>

          {/* Weekly and Monthly Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Weekly Chart */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Weekly Progress</h4>
              <div className="space-y-2">
                {weeklyProgress.map((week, index) => {
                  const width = week.completed > 0 ? Math.max((week.completed / maxWeeklyCount) * 100, 5) : 0;
                  const isCurrentWeek = index === weeklyProgress.length - 1;
                  
                  return (
                    <div key={week.label} className="flex items-center gap-3">
                      <span className={cn(
                        "text-xs w-20 truncate",
                        isCurrentWeek ? "font-medium" : "text-muted-foreground"
                      )}>
                        {week.label}
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className={cn(
                            "h-full rounded-full",
                            isCurrentWeek ? "bg-primary" : "bg-primary/50"
                          )}
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs min-w-[40px] justify-center">
                        {week.completed}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Chart */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Monthly Progress</h4>
              <div className="space-y-2">
                {monthlyProgress.map((month, index) => {
                  const width = month.completed > 0 ? Math.max((month.completed / maxMonthlyCount) * 100, 5) : 0;
                  const isCurrentMonth = index === monthlyProgress.length - 1;
                  
                  return (
                    <div key={month.label} className="flex items-center gap-3">
                      <span className={cn(
                        "text-xs w-20 truncate",
                        isCurrentMonth ? "font-medium" : "text-muted-foreground"
                      )}>
                        {month.label}
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className={cn(
                            "h-full rounded-full",
                            isCurrentMonth ? "bg-amber-500" : "bg-amber-500/50"
                          )}
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs min-w-[40px] justify-center">
                        {month.completed}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Motivational message based on trend */}
          <div className="mt-6 pt-4 border-t border-border text-center text-sm text-muted-foreground">
            {weeklyTrend > 20 && (
              <span className="text-emerald-600">🚀 Amazing momentum! You're {weeklyTrend}% more productive this week!</span>
            )}
            {weeklyTrend > 0 && weeklyTrend <= 20 && (
              <span className="text-emerald-600">📈 Great progress! Keep building on this momentum!</span>
            )}
            {weeklyTrend === 0 && currentWeekCount > 0 && (
              <span>📊 Consistent progress! You're maintaining a steady pace.</span>
            )}
            {weeklyTrend < 0 && weeklyTrend >= -20 && (
              <span>💪 Slight dip this week. A small push can get you back on track!</span>
            )}
            {weeklyTrend < -20 && (
              <span>⏰ Time to refocus! Complete just one topic to rebuild momentum.</span>
            )}
            {currentWeekCount === 0 && lastWeekCount === 0 && (
              <span>🌱 Start your learning journey today! Complete your first topic.</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProgressVelocitySection;
