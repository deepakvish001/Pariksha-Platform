import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutGrid, CheckCircle2, Target, Zap, Star, Loader2, Flame, Trophy, Settings2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import AchievementBadge, { achievements } from "@/components/AchievementBadge";

// Sheet definitions with total counts
const sheetDefinitions = [
  {
    id: "machine-learning",
    name: "Machine Learning",
    total: 26,
    topics: ["Linear Algebra", "Calculus", "Probability", "ML Fundamentals"],
    route: "/dashboard/sheets/machine-learning",
  },
  {
    id: "strivers-sde-sheet",
    name: "Striver's SDE Sheet",
    total: 191,
    topics: ["Arrays", "Linked Lists", "Trees", "Graphs", "DP"],
    route: "/dashboard/sheets/strivers-sde-sheet",
  },
  {
    id: "love-babbar-450",
    name: "Love Babbar 450",
    total: 450,
    topics: ["Arrays", "Strings", "Trees", "Graphs", "DP"],
    route: "/dashboard/sheets/love-babbar-450",
  },
  {
    id: "neetcode-150",
    name: "Neetcode 150",
    total: 150,
    topics: ["Arrays", "Two Pointers", "Stack", "Binary Search"],
    route: "/dashboard/sheets/neetcode-150",
  },
  {
    id: "sql-practice",
    name: "SQL Practice",
    total: 75,
    topics: ["Basics", "Joins", "Subqueries", "Window Functions"],
    route: "/dashboard/sheets/sql-practice",
  },
  {
    id: "system-design",
    name: "System Design",
    total: 25,
    topics: ["HLD", "LLD", "Databases", "Caching"],
    route: "/dashboard/sheets/system-design",
  },
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

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  completed_count: number;
  revision_count: number;
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [goals, setGoals] = useState<UserGoals>({ daily_target: 5, weekly_target: 25 });
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [editGoals, setEditGoals] = useState<UserGoals>({ daily_target: 5, weekly_target: 25 });
  const [lastNotifiedDaily, setLastNotifiedDaily] = useState<string | null>(null);
  const [lastNotifiedWeekly, setLastNotifiedWeekly] = useState<string | null>(null);
  const [activityHeatmap, setActivityHeatmap] = useState<{ [date: string]: number }>({});
  const [earnedAchievements, setEarnedAchievements] = useState<Map<string, string>>(new Map());
  const [totalRevision, setTotalRevision] = useState(0);
  const [heatmapRange, setHeatmapRange] = useState<3 | 6 | 12>(12);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all data in parallel
        const [progressResult, goalsResult, leaderboardResult, achievementsResult] = await Promise.all([
          supabase
            .from("user_topic_progress")
            .select("sheet_id, completed, is_revision, updated_at")
            .eq("user_id", user.id),
          supabase
            .from("user_goals")
            .select("daily_target, weekly_target")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("leaderboard_view")
            .select("*"),
          supabase
            .from("user_achievements")
            .select("achievement_id, earned_at")
            .eq("user_id", user.id)
        ]);

        if (progressResult.error) throw progressResult.error;

        // Process progress data
        const progressMap = new Map<string, SheetProgress>();
        const activityDates = new Set<string>();
        const heatmapData: { [date: string]: number } = {};
        const today = new Date().toISOString().split('T')[0];
        let todayCount = 0;
        let revisionCount = 0;
        
        if (progressResult.data) {
          progressResult.data.forEach((row) => {
            const existing = progressMap.get(row.sheet_id) || { 
              sheetId: row.sheet_id, 
              completed: 0, 
              revision: 0 
            };
            
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

        // Calculate weekly activity
        const weekData: DailyActivity[] = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const count = progressResult.data?.filter(row => {
            if (!row.completed) return false;
            const rowDate = new Date(row.updated_at).toISOString().split('T')[0];
            return rowDate === dateStr;
          }).length || 0;

          weekData.push({
            date: dateStr,
            day: dayNames[date.getDay()],
            count
          });
        }
        setWeeklyActivity(weekData);

        // Set goals
        if (goalsResult.data) {
          setGoals(goalsResult.data);
          setEditGoals(goalsResult.data);
        }

        // Set leaderboard
        if (leaderboardResult.data) {
          setLeaderboard(leaderboardResult.data as LeaderboardEntry[]);
        }

        // Set earned achievements
        if (achievementsResult.data) {
          const achievementMap = new Map<string, string>();
          achievementsResult.data.forEach((a: EarnedAchievement) => {
            achievementMap.set(a.achievement_id, a.earned_at);
          });
          setEarnedAchievements(achievementMap);
        }

        // Check for new achievements
        const totalCompleted = Array.from(progressMap.values()).reduce((acc, p) => acc + p.completed, 0);
        await checkAndAwardAchievements(
          totalCompleted, 
          currentStreak, 
          revisionCount, 
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
    topicsCompleted: number,
    streakDays: number,
    revisionTopics: number,
    alreadyEarned: string[]
  ) => {
    if (!user) return;

    const newAchievements: string[] = [];
    
    for (const achievement of achievements) {
      if (alreadyEarned.includes(achievement.id)) continue;
      
      let earned = false;
      switch (achievement.requirement.type) {
        case 'topics_completed':
          earned = topicsCompleted >= achievement.requirement.value;
          break;
        case 'streak_days':
          earned = streakDays >= achievement.requirement.value;
          break;
        case 'revision_topics':
          earned = revisionTopics >= achievement.requirement.value;
          break;
      }
      
      if (earned) {
        newAchievements.push(achievement.id);
      }
    }

    // Save new achievements to database
    if (newAchievements.length > 0) {
      const inserts = newAchievements.map(id => ({
        user_id: user.id,
        achievement_id: id,
      }));

      const { error } = await supabase
        .from("user_achievements")
        .insert(inserts);

      if (!error) {
        // Update local state
        const newMap = new Map(earnedAchievements);
        newAchievements.forEach(id => {
          newMap.set(id, new Date().toISOString());
        });
        setEarnedAchievements(newMap);

        // Show notification for each new achievement
        newAchievements.forEach(id => {
          const achievement = achievements.find(a => a.id === id);
          if (achievement) {
            toast({
              title: `🏆 Achievement Unlocked!`,
              description: `${achievement.name}: ${achievement.description}`,
            });
          }
        });
      }
    }
  };

  // Check for goal achievements and show notifications
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekKey = getWeekKey();
    const weeklyTotal = weeklyActivity.reduce((acc, d) => acc + d.count, 0);

    if (todayCompleted >= goals.daily_target && lastNotifiedDaily !== today) {
      toast({
        title: "🎉 Daily Goal Achieved!",
        description: `You've completed ${todayCompleted} topics today. Great work!`,
      });
      setLastNotifiedDaily(today);
    }

    if (weeklyTotal >= goals.weekly_target && lastNotifiedWeekly !== weekKey) {
      toast({
        title: "🏆 Weekly Goal Achieved!",
        description: `You've completed ${weeklyTotal} topics this week. Amazing progress!`,
      });
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
      const { error } = await supabase
        .from("user_goals")
        .upsert({
          user_id: user.id,
          daily_target: editGoals.daily_target,
          weekly_target: editGoals.weekly_target,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;

      setGoals(editGoals);
      setGoalsModalOpen(false);
      toast({
        title: "Goals Updated",
        description: "Your daily and weekly targets have been saved.",
      });
    } catch (error) {
      console.error("Failed to save goals:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save goals. Please try again.",
      });
    }
  };

  // Calculate totals
  const totalQuestions = sheetDefinitions.reduce((acc, sheet) => acc + sheet.total, 0);
  const totalCompleted = Array.from(progressData.values()).reduce((acc, p) => acc + p.completed, 0);
  const overallProgress = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;
  const weeklyTotal = weeklyActivity.reduce((acc, d) => acc + d.count, 0);
  const dailyProgress = goals.daily_target > 0 ? Math.min((todayCompleted / goals.daily_target) * 100, 100) : 0;
  const weeklyProgress = goals.weekly_target > 0 ? Math.min((weeklyTotal / goals.weekly_target) * 100, 100) : 0;
  const userRank = leaderboard.findIndex(entry => entry.user_id === user?.id) + 1;
  const earnedCount = earnedAchievements.size;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Progress Matrix</h1>
              <p className="text-sm text-muted-foreground">Track your preparation across topics</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 md:p-8 space-y-8">
        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{totalQuestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Done</p>
                  <p className="text-xl font-bold">{totalCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revision</p>
                  <p className="text-xl font-bold">{totalRevision}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Streak</p>
                  <p className="text-xl font-bold">{streak}d</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Badges</p>
                  <p className="text-xl font-bold">{earnedCount}/{achievements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="text-xl font-bold">{overallProgress}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Achievements</CardTitle>
                  <CardDescription>{earnedCount} of {achievements.length} unlocked</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                {achievements.map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    earned={earnedAchievements.has(achievement.id)}
                    earnedAt={earnedAchievements.get(achievement.id)}
                    size="md"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calendar Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-end gap-1 mb-4">
                {([3, 6, 12] as const).map((range) => (
                  <Button
                    key={range}
                    variant={heatmapRange === range ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setHeatmapRange(range)}
                    className="h-7 px-3 text-xs"
                  >
                    {range === 12 ? '1 Year' : `${range}M`}
                  </Button>
                ))}
              </div>
              <CalendarHeatmap activityData={activityHeatmap} months={heatmapRange} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Goals and Activity Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Goals Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Daily & Weekly Goals</CardTitle>
                    <CardDescription>Track your progress against targets</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setGoalsModalOpen(true)}>
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Today's Progress</span>
                    <span className={todayCompleted >= goals.daily_target ? "text-green-500 font-semibold" : "text-muted-foreground"}>
                      {todayCompleted} / {goals.daily_target} topics
                      {todayCompleted >= goals.daily_target && " ✓"}
                    </span>
                  </div>
                  <Progress value={dailyProgress} className="h-3" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">This Week's Progress</span>
                    <span className={weeklyTotal >= goals.weekly_target ? "text-green-500 font-semibold" : "text-muted-foreground"}>
                      {weeklyTotal} / {goals.weekly_target} topics
                      {weeklyTotal >= goals.weekly_target && " ✓"}
                    </span>
                  </div>
                  <Progress value={weeklyProgress} className="h-3" />
                </div>

                <div className="text-center pt-2">
                  {todayCompleted >= goals.daily_target ? (
                    <p className="text-sm text-green-500 font-medium">🎉 Daily goal achieved!</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {goals.daily_target - todayCompleted} more to reach today's goal
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Weekly Activity</CardTitle>
                    <CardDescription>Topics completed in the last 7 days</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {weeklyTotal} this week
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis 
                        dataKey="day" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value} topics`, 'Completed']}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Leaderboard</CardTitle>
                    <CardDescription>Top performers</CardDescription>
                  </div>
                </div>
                {userRank > 0 && (
                  <Badge variant="outline" className="text-base px-3 py-1">
                    Your Rank: #{userRank}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Complete topics to appear on the leaderboard!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.slice(0, 10).map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                        entry.user_id === user?.id 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                        index === 2 ? 'bg-orange-600/20 text-orange-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatar_url || undefined} />
                        <AvatarFallback>
                          {entry.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {entry.full_name || 'Anonymous'}
                          {entry.user_id === user?.id && <span className="text-primary ml-2">(You)</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.completed_count} completed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{entry.completed_count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sheetDefinitions.map((sheet, index) => {
            const sheetProgress = progressData.get(sheet.id);
            const completed = sheetProgress?.completed || 0;
            const revision = sheetProgress?.revision || 0;
            const progress = sheet.total > 0 ? Math.round((completed / sheet.total) * 100) : 0;
            
            return (
              <motion.div
                key={sheet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Card 
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(sheet.route)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{sheet.name}</CardTitle>
                      <Badge variant={progress >= 50 ? "default" : "secondary"}>
                        {progress}%
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span>{completed} of {sheet.total}</span>
                      {revision > 0 && (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-3 w-3 fill-current" />
                          {revision}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={progress} className="h-2" />
                    <div className="flex flex-wrap gap-2">
                      {sheet.topics.map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Goals Settings Modal */}
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
              <Input
                id="daily-target"
                type="number"
                min="1"
                max="50"
                value={editGoals.daily_target}
                onChange={(e) => setEditGoals(prev => ({ ...prev, daily_target: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-target">Weekly Target (topics per week)</Label>
              <Input
                id="weekly-target"
                type="number"
                min="1"
                max="200"
                value={editGoals.weekly_target}
                onChange={(e) => setEditGoals(prev => ({ ...prev, weekly_target: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGoals}>
              Save Goals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardMatrix;
