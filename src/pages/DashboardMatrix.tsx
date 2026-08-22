import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutGrid, CheckCircle2, Target, Zap, Star, Flame, Trophy, Settings2, ChevronRight, BookOpen, Play, Brain } from "lucide-react";
import { GuestProgressTeaser } from "@/components/GuestProgressTeaser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import RecentAchievements from "@/components/RecentAchievements";
import { achievements } from "@/components/AchievementBadge";
import MobileFAB from "@/components/MobileFAB";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import confetti from "canvas-confetti";
import XPGoalsCard from "@/components/XPGoalsCard";
import { cn } from "@/lib/utils";
import { PlacementReadinessCard } from "@/components/placement/PlacementReadinessCard";

// Accurate sheet definitions matching DashboardSheets
const sheetDefinitions = [
  { id: "strivers-sde-sheet", name: "Striver's SDE Sheet", total: 199, category: "DSA", route: "/learn/sheets/strivers-sde-sheet" },
  { id: "strivers-a2z-dsa", name: "Striver's A2Z DSA", total: 445, category: "DSA", route: "/learn/sheets/strivers-a2z-dsa" },
  { id: "blind-75", name: "Blind 75", total: 75, category: "DSA", route: "/learn/sheets/blind-75" },
  { id: "neetcode-150", name: "Neetcode 150", total: 150, category: "DSA", route: "/learn/sheets/neetcode-150" },
  { id: "neetcode-250", name: "NeetCode 250", total: 250, category: "DSA", route: "/learn/sheets/neetcode-250" },
  { id: "dsa-level-1", name: "Java DSA Level 1", total: 467, category: "DSA", route: "/learn/sheets/dsa-level-1" },
  { id: "dsa-level-2", name: "Java DSA Level 2", total: 309, category: "DSA", route: "/learn/sheets/dsa-level-2" },
  { id: "dsa-level-3", name: "Java DSA Level 3", total: 226, category: "DSA", route: "/learn/sheets/dsa-level-3" },
  { id: "competitive-programming", name: "Competitive Programming", total: 270, category: "CP", route: "/learn/sheets/competitive-programming" },
  { id: "acm-icpc-training", name: "ACM-ICPC Training", total: 1243, category: "CP", route: "/learn/sheets/acm-icpc-training" },
  { id: "tle-cp31-sheet", name: "TLE CP-31", total: 372, category: "CP", route: "/learn/sheets/tle-cp31-sheet" },
  { id: "sql-practice", name: "LeetCode SQL 50", total: 50, category: "SQL", route: "/learn/sheets/sql-practice" },
  { id: "adv-sql-practice", name: "Advanced SQL 50", total: 50, category: "SQL", route: "/learn/sheets/adv-sql-practice" },
  { id: "dbms-sheet", name: "DBMS Sheet", total: 124, category: "DBMS", route: "/learn/sheets/dbms-sheet" },
  { id: "cn-sheet", name: "CN Sheet", total: 115, category: "CN", route: "/learn/sheets/cn-sheet" },
  { id: "os-sheet", name: "OS Sheet", total: 135, category: "OS", route: "/learn/sheets/os-sheet" },
  { id: "striver-sd-sheet", name: "System Design", total: 97, category: "System Design", route: "/learn/sheets/striver-sd-sheet" },
];

interface SheetProgress {
  sheetId: string;
  completed: number;
  revision: number;
}

interface DailyActivity {
  date: string;
  day: string;
  count: number;
}

interface UserGoals {
  daily_target: number;
  weekly_target: number;
}

interface EarnedAchievement {
  achievement_id: string;
  earned_at: string;
}

const DashboardMatrix = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [progressData, setProgressData] = useState<Map<string, SheetProgress>>(new Map());
  const [streak, setStreak] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState<DailyActivity[]>([]);
  const [goals, setGoals] = useState<UserGoals>({ daily_target: 5, weekly_target: 25 });
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [editGoals, setEditGoals] = useState<UserGoals>({ daily_target: 5, weekly_target: 25 });
  const [lastNotifiedDaily, setLastNotifiedDaily] = useState<string | null>(null);
  const [lastNotifiedWeekly, setLastNotifiedWeekly] = useState<string | null>(null);
  const [activityHeatmap, setActivityHeatmap] = useState<{ [date: string]: number }>({});
  const [earnedAchievements, setEarnedAchievements] = useState<Map<string, string>>(new Map());
  const [totalRevision, setTotalRevision] = useState(0);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        if (user.created_at) setAccountCreatedAt(user.created_at);

        const [progressResult, goalsResult, achievementsResult] = await Promise.all([
          supabase.from("user_topic_progress").select("sheet_id, completed, is_revision, updated_at").eq("user_id", user.id),
          supabase.from("user_goals").select("daily_target, weekly_target").eq("user_id", user.id).maybeSingle(),
          supabase.from("user_achievements").select("achievement_id, earned_at").eq("user_id", user.id),
        ]);

        if (progressResult.error) throw progressResult.error;

        const progressMap = new Map<string, SheetProgress>();
        const activityDates = new Set<string>();
        const heatmapData: { [date: string]: number } = {};
        const today = new Date().toISOString().split('T')[0];
        let todayCount = 0;
        let revisionCount = 0;

        if (progressResult.data) {
          progressResult.data.forEach((row) => {
            const existing = progressMap.get(row.sheet_id) || { sheetId: row.sheet_id, completed: 0, revision: 0 };
            if (row.completed) {
              existing.completed += 1;
              const date = new Date(row.updated_at).toISOString().split('T')[0];
              activityDates.add(date);
              heatmapData[date] = (heatmapData[date] || 0) + 1;
              if (date === today) todayCount++;
            }
            if (row.is_revision) {
              existing.revision += 1;
              revisionCount++;
            }
            progressMap.set(row.sheet_id, existing);
          });
        }

        setProgressData(progressMap);
        setTodayCompleted(todayCount);
        setActivityHeatmap(heatmapData);
        setTotalRevision(revisionCount);

        // Calculate streak
        const sortedDates = Array.from(activityDates).sort().reverse();
        let currentStreak = 0;
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        for (let i = 0; i < sortedDates.length; i++) {
          const checkDate = new Date(todayDate);
          checkDate.setDate(checkDate.getDate() - i);
          const checkDateStr = checkDate.toISOString().split('T')[0];
          if (sortedDates.includes(checkDateStr)) {
            currentStreak++;
          } else if (i === 0) {
            continue;
          } else {
            break;
          }
        }
        setStreak(currentStreak);

        // Weekly activity
        const weekData: DailyActivity[] = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const count = progressResult.data?.filter(row => {
            if (!row.completed) return false;
            return new Date(row.updated_at).toISOString().split('T')[0] === dateStr;
          }).length || 0;
          weekData.push({ date: dateStr, day: dayNames[date.getDay()], count });
        }
        setWeeklyActivity(weekData);

        if (goalsResult.data) {
          setGoals(goalsResult.data);
          setEditGoals(goalsResult.data);
        }

        if (achievementsResult.data) {
          const achievementMap = new Map<string, string>();
          achievementsResult.data.forEach((a: EarnedAchievement) => achievementMap.set(a.achievement_id, a.earned_at));
          setEarnedAchievements(achievementMap);
        }

        const totalCompleted = Array.from(progressMap.values()).reduce((acc, p) => acc + p.completed, 0);
        await checkAndAwardAchievements(
          totalCompleted, currentStreak, revisionCount,
          achievementsResult.data?.map((a: EarnedAchievement) => a.achievement_id) || []
        );
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const checkAndAwardAchievements = async (
    _topicsCompleted: number, _streakDays: number, _revisionTopics: number, alreadyEarned: string[]
  ) => {
    if (!user) return;
    // Server-side validator computes eligibility from authoritative data.
    const { data: newIds, error } = await supabase.rpc("award_earned_achievements");
    if (error) {
      console.error("award_earned_achievements failed:", error);
      return;
    }
    const newAchievements = (newIds ?? []).filter((id: string) => !alreadyEarned.includes(id));
    if (newAchievements.length > 0) {
      const newMap = new Map(earnedAchievements);
      newAchievements.forEach((id: string) => newMap.set(id, new Date().toISOString()));
      setEarnedAchievements(newMap);
      newAchievements.forEach((id: string) => {
        const achievement = achievements.find(a => a.id === id);
        if (achievement) {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ["#fbbf24", "#f59e0b", "#d97706", "#10b981", "#8b5cf6"] });
          toast({ title: `🏆 Achievement Unlocked!`, description: `${achievement.name}: ${achievement.description}` });
        }
      });
    }
  };

  // Goal notifications
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekKey = getWeekKey();
    const weeklyTotal = weeklyActivity.reduce((acc, d) => acc + d.count, 0);
    if (todayCompleted >= goals.daily_target && lastNotifiedDaily !== today) {
      toast({ title: "🎉 Daily Goal Achieved!", description: `You've completed ${todayCompleted} topics today!` });
      setLastNotifiedDaily(today);
    }
    if (weeklyTotal >= goals.weekly_target && lastNotifiedWeekly !== weekKey) {
      toast({ title: "🏆 Weekly Goal Achieved!", description: `You've completed ${weeklyTotal} topics this week!` });
      setLastNotifiedWeekly(weekKey);
    }
  }, [todayCompleted, weeklyActivity, goals, lastNotifiedDaily, lastNotifiedWeekly, toast]);

  const getWeekKey = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber}`;
  };

  const handleSaveGoals = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from("user_goals").upsert({
        user_id: user.id, daily_target: editGoals.daily_target, weekly_target: editGoals.weekly_target,
      }, { onConflict: "user_id" });
      if (error) throw error;
      setGoals(editGoals);
      setGoalsModalOpen(false);
      toast({ title: "Goals Updated", description: "Your daily and weekly targets have been saved." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to save goals." });
    }
  };

  // Calculations
  const totalQuestions = sheetDefinitions.reduce((acc, s) => acc + s.total, 0);
  const totalCompleted = Array.from(progressData.values()).reduce((acc, p) => acc + p.completed, 0);
  const overallProgress = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;
  const weeklyTotal = weeklyActivity.reduce((acc, d) => acc + d.count, 0);
  const dailyProgress = goals.daily_target > 0 ? Math.min((todayCompleted / goals.daily_target) * 100, 100) : 0;
  const weeklyProgress = goals.weekly_target > 0 ? Math.min((weeklyTotal / goals.weekly_target) * 100, 100) : 0;
  const earnedCount = earnedAchievements.size;

  // Top active sheets (sheets with progress, sorted by most recently active)
  const activeSheets = useMemo(() => {
    return sheetDefinitions
      .map(s => {
        const p = progressData.get(s.id);
        return { ...s, completed: p?.completed || 0, revision: p?.revision || 0 };
      })
      .filter(s => s.completed > 0)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 6);
  }, [progressData]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-orange flex items-center justify-center">
            <LayoutGrid className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Dashboard</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Your preparation overview</p>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-7xl mx-auto">
        {!user && <GuestProgressTeaser />}

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
        >
          {[
            { label: "Total", value: totalQuestions.toLocaleString(), icon: Target, gradient: "from-primary/10 to-primary/5", border: "border-primary/20", iconColor: "text-primary", iconBg: "bg-primary/20" },
            { label: "Done", value: totalCompleted, icon: CheckCircle2, gradient: "from-emerald-500/10 to-emerald-500/5", border: "border-emerald-500/20", iconColor: "text-emerald-500", iconBg: "bg-emerald-500/20" },
            { label: "Revision", value: totalRevision, icon: Star, gradient: "from-amber-500/10 to-amber-500/5", border: "border-amber-500/20", iconColor: "text-amber-500", iconBg: "bg-amber-500/20" },
            { label: "Streak", value: `${streak}d`, icon: Flame, gradient: "from-orange-500/10 to-orange-500/5", border: "border-orange-500/20", iconColor: "text-orange-500", iconBg: "bg-orange-500/20" },
            { label: "Badges", value: `${earnedCount}/${achievements.length}`, icon: Trophy, gradient: "from-purple-500/10 to-purple-500/5", border: "border-purple-500/20", iconColor: "text-purple-500", iconBg: "bg-purple-500/20" },
            { label: "Progress", value: `${overallProgress}%`, icon: Zap, gradient: "from-blue-500/10 to-blue-500/5", border: "border-blue-500/20", iconColor: "text-blue-500", iconBg: "bg-blue-500/20" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
              <Card className={cn("bg-gradient-to-br", stat.gradient, stat.border)}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", stat.iconBg)}>
                      <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-bold leading-tight">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <PlacementReadinessCard />



        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid gap-3 grid-cols-1 sm:grid-cols-3"
        >
          <Card
            className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/library/quiz")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/library/quiz");
              }
            }}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Start a Quiz</p>
                <p className="text-xs text-muted-foreground">DSA, CS, SQL & more</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md hover:border-emerald-500/30 transition-all group"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/learn/sheets")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/learn/sheets");
              }
            }}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                <BookOpen className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Resume a Sheet</p>
                <p className="text-xs text-muted-foreground">{activeSheets.length > 0 ? `${activeSheets.length} in progress` : "Pick a sheet to start"}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
            </CardContent>
          </Card>

        </motion.div>

        {/* Goals + Weekly Activity Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Daily & Weekly Goals */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <Card className="h-full">
              <CardHeader className="px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Daily & Weekly Goals</CardTitle>
                    <CardDescription className="text-xs">Track your progress against targets</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Edit goals" onClick={() => setGoalsModalOpen(true)}>
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Today</span>
                    <span className={todayCompleted >= goals.daily_target ? "text-emerald-500 font-semibold" : "text-muted-foreground"}>
                      {todayCompleted} / {goals.daily_target}{todayCompleted >= goals.daily_target && " ✓"}
                    </span>
                  </div>
                  <Progress value={dailyProgress} className="h-2.5" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">This Week</span>
                    <span className={weeklyTotal >= goals.weekly_target ? "text-emerald-500 font-semibold" : "text-muted-foreground"}>
                      {weeklyTotal} / {goals.weekly_target}{weeklyTotal >= goals.weekly_target && " ✓"}
                    </span>
                  </div>
                  <Progress value={weeklyProgress} className="h-2.5" />
                </div>
                <p className="text-xs text-center text-muted-foreground pt-1">
                  {todayCompleted >= goals.daily_target
                    ? "🎉 Daily goal achieved!"
                    : `${goals.daily_target - todayCompleted} more to reach today's goal`}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly Activity Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardHeader className="px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Weekly Activity</CardTitle>
                    <CardDescription className="text-xs hidden sm:block">Topics completed in the last 7 days</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-sm px-2.5 py-0.5">{weeklyTotal} this week</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4">
                <div className="h-[130px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} width={25} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value} topics`, 'Completed']}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Achievements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <RecentAchievements earnedAchievements={earnedAchievements} maxDisplay={6} />
        </motion.div>

        {/* Heatmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Card>
            <CardContent className="px-4 sm:px-6 py-4">
              <CalendarHeatmap activityData={activityHeatmap} accountCreatedAt={accountCreatedAt} />
            </CardContent>
          </Card>
        </motion.div>

        {/* XP Goals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <XPGoalsCard />
        </motion.div>

        {/* Active Sheets — only show if user has progress */}
        {activeSheets.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <Card>
              <CardHeader className="px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">Your Active Sheets</CardTitle>
                      <CardDescription className="text-xs">Sheets you're currently working on</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate("/learn/sheets")}>
                    View All <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {activeSheets.map((sheet) => {
                    const progress = sheet.total > 0 ? Math.round((sheet.completed / sheet.total) * 100) : 0;
                    return (
                      <div
                        key={sheet.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer group"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(sheet.route)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(sheet.route);
                          }
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{sheet.name}</p>
                          <p className="text-xs text-muted-foreground">{sheet.completed}/{sheet.total} · {sheet.category}</p>
                          <Progress value={progress} className="h-1.5 mt-2" />
                        </div>
                        <Badge variant={progress >= 50 ? "default" : "secondary"} className="shrink-0 text-xs">{progress}%</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      {/* Goals Modal */}
      <Dialog open={goalsModalOpen} onOpenChange={setGoalsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Set Your Goals
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="daily-target">Daily Target (topics per day)</Label>
              <Input id="daily-target" type="number" min="1" max="50" value={editGoals.daily_target} onChange={(e) => setEditGoals(prev => ({ ...prev, daily_target: parseInt(e.target.value) || 1 }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-target">Weekly Target (topics per week)</Label>
              <Input id="weekly-target" type="number" min="1" max="200" value={editGoals.weekly_target} onChange={(e) => setEditGoals(prev => ({ ...prev, weekly_target: parseInt(e.target.value) || 1 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGoals}>Save Goals</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileFAB />
    </div>
  );
};

export default DashboardMatrix;
