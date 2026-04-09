import React, { useMemo, useState, useEffect } from "react";
import { CalendarClock, TrendingUp, Target, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { addDays, format, differenceInDays, subDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface ACMPaceCalculatorProps {
  sheetId: string;
  totalProblems: number;
  completedCount: number;
}

const ACMPaceCalculator: React.FC<ACMPaceCalculatorProps> = ({
  sheetId,
  totalProblems,
  completedCount,
}) => {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<{ week: string; count: number }[]>([]);
  const [targetPace, setTargetPace] = useState<string>("auto");

  useEffect(() => {
    if (!user) return;
    const fetchCompletionHistory = async () => {
      const { data } = await supabase
        .from("user_topic_progress")
        .select("completed_at")
        .eq("user_id", user.id)
        .eq("sheet_id", sheetId)
        .eq("completed", true)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: true });

      if (!data || data.length === 0) {
        setWeeklyData([]);
        return;
      }

      // Group by week
      const weeks: Record<string, number> = {};
      data.forEach((row) => {
        const d = new Date(row.completed_at!);
        const weekStart = startOfDay(subDays(d, d.getDay()));
        const key = format(weekStart, "yyyy-MM-dd");
        weeks[key] = (weeks[key] || 0) + 1;
      });

      const sorted = Object.entries(weeks)
        .map(([week, count]) => ({ week, count }))
        .sort((a, b) => a.week.localeCompare(b.week));

      setWeeklyData(sorted);
    };
    fetchCompletionHistory();
  }, [user, sheetId, completedCount]);

  const stats = useMemo(() => {
    const remaining = totalProblems - completedCount;
    if (remaining <= 0) {
      return { avgPerWeek: 0, remaining: 0, estDate: null, weeksLeft: 0, pace: 0 };
    }

    // Calculate average weekly pace from last 4 weeks
    const recentWeeks = weeklyData.slice(-4);
    const avgPerWeek =
      recentWeeks.length > 0
        ? recentWeeks.reduce((s, w) => s + w.count, 0) / recentWeeks.length
        : 0;

    const pace = targetPace === "auto" ? avgPerWeek : Number(targetPace);
    const weeksLeft = pace > 0 ? Math.ceil(remaining / pace) : Infinity;
    const estDate = pace > 0 ? addDays(new Date(), weeksLeft * 7) : null;

    return { avgPerWeek: Math.round(avgPerWeek * 10) / 10, remaining, estDate, weeksLeft, pace };
  }, [weeklyData, completedCount, totalProblems, targetPace]);

  const maxBar = Math.max(...weeklyData.map((w) => w.count), 1);

  return (
    <Card className="bg-card/50 border-border/50 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-cyan-500/40 via-primary/40 to-violet-500/40" />
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-primary/20 flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Weekly Pace Calculator</p>
              <p className="text-xs text-muted-foreground">
                {completedCount === totalProblems
                  ? "🎉 Sheet completed!"
                  : `${stats.remaining} problems remaining`}
              </p>
            </div>
          </div>
          <Select value={targetPace} onValueChange={setTargetPace}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Pace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (avg pace)</SelectItem>
              <SelectItem value="5">5 / week</SelectItem>
              <SelectItem value="10">10 / week</SelectItem>
              <SelectItem value="15">15 / week</SelectItem>
              <SelectItem value="20">20 / week</SelectItem>
              <SelectItem value="30">30 / week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-cyan-500" />
            <p className="text-lg font-bold text-foreground">{stats.avgPerWeek}</p>
            <p className="text-[11px] text-muted-foreground">Avg/week (last 4w)</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <Target className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">
              {targetPace === "auto" ? stats.avgPerWeek : targetPace}
            </p>
            <p className="text-[11px] text-muted-foreground">Target pace</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <CalendarClock className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold text-foreground">
              {stats.weeksLeft === Infinity ? "—" : `${stats.weeksLeft}w`}
            </p>
            <p className="text-[11px] text-muted-foreground">Weeks left</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
            <p className="text-lg font-bold text-foreground">
              {stats.estDate ? format(stats.estDate, "MMM yyyy") : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground">Est. completion</p>
          </div>
        </div>

        {/* Mini weekly bar chart */}
        {weeklyData.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Weekly Activity</p>
            <div className="flex items-end gap-1 h-16">
              {weeklyData.slice(-12).map((w) => (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[9px] text-muted-foreground">{w.count}</span>
                  <div
                    className="w-full rounded-sm bg-primary/70 min-h-[2px] transition-all"
                    style={{ height: `${(w.count / maxBar) * 48}px` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>{weeklyData.length > 12 ? format(new Date(weeklyData.slice(-12)[0].week), "MMM d") : format(new Date(weeklyData[0].week), "MMM d")}</span>
              <span>{format(new Date(weeklyData[weeklyData.length - 1].week), "MMM d")}</span>
            </div>
          </div>
        )}

        {weeklyData.length === 0 && completedCount === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Start solving problems to see your pace and estimated completion date.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ACMPaceCalculator;
