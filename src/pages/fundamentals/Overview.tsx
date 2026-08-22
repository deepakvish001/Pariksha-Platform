import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, Code2, Target, Trophy, TrendingUp, Users, 
  Sparkles, BarChart3, Award, Flame, Clock, CheckCircle,
  Play, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { languages, languageQuestions } from "@/data/languagesData";
import { oopsConcepts, oopsQuestions } from "@/data/oopsConceptsData";
import FundamentalsLeaderboard from "@/components/library/FundamentalsLeaderboard";
import FundamentalsAnalytics from "@/components/library/FundamentalsAnalytics";
import AchievementBadge, { achievements, type Achievement } from "@/components/AchievementBadge";
import { useUserAchievements } from "@/hooks/useUserAchievements";
import FundamentalsStreakCard from "@/components/FundamentalsStreakCard";

interface ProgressStats {
  languagesCompleted: number;
  languagesTotal: number;
  oopsCompleted: number;
  oopsTotal: number;
  quizzesCompleted: number;
  avgAccuracy: number;
  totalXP: number;
}

const FundamentalsOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isEarned, getEarnedAt, getAchievementProgress } = useUserAchievements();
  const [stats, setStats] = useState<ProgressStats>({
    languagesCompleted: 0,
    languagesTotal: languageQuestions.length,
    oopsCompleted: 0,
    oopsTotal: oopsQuestions.length,
    quizzesCompleted: 0,
    avgAccuracy: 0,
    totalXP: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch topic progress for languages
        const { data: languageProgress } = await supabase
          .from("user_topic_progress")
          .select("completed")
          .eq("user_id", user.id)
          .like("sheet_id", "language-%");

        const languagesCompleted = languageProgress?.filter((p) => p.completed).length || 0;

        // Fetch topic progress for OOPs
        const { data: oopsProgress } = await supabase
          .from("user_topic_progress")
          .select("completed")
          .eq("user_id", user.id)
          .eq("sheet_id", "oops-concepts");

        const oopsCompleted = oopsProgress?.filter((p) => p.completed).length || 0;

        // Fetch quiz results for fundamentals
        const { data: quizResults } = await supabase
          .from("quiz_results")
          .select("accuracy, score")
          .eq("user_id", user.id)
          .or("quiz_type.like.language-%,quiz_type.like.oops-%");

        const quizzesCompleted = quizResults?.length || 0;
        const avgAccuracy = quizzesCompleted > 0
          ? Math.round(quizResults!.reduce((sum, r) => sum + r.accuracy, 0) / quizzesCompleted)
          : 0;

        // Fetch XP
        const { data: profile } = await supabase
          .from("user_profiles_extended")
          .select("total_xp")
          .eq("user_id", user.id)
          .maybeSingle();

        setStats({
          languagesCompleted,
          languagesTotal: languageQuestions.length,
          oopsCompleted,
          oopsTotal: oopsQuestions.length,
          quizzesCompleted,
          avgAccuracy,
          totalXP: profile?.total_xp || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // Get fundamentals achievements
  const fundamentalsAchievements = useMemo(() => {
    return achievements.filter((a) => a.requirement.type.startsWith("fundamentals"));
  }, []);

  const earnedFundamentalsCount = fundamentalsAchievements.filter((a) => isEarned(a.id)).length;

  const totalCompleted = stats.languagesCompleted + stats.oopsCompleted;
  const totalQuestions = stats.languagesTotal + stats.oopsTotal;
  const overallProgress = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Fundamentals Dashboard</h1>
              <p className="text-sm text-muted-foreground">Your progress across Languages & OOPs</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-6">
        {/* Hero Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Progress</p>
                  <p className="text-3xl font-bold">{overallProgress}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalCompleted}/{totalQuestions} topics
                  </p>
                </div>
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
              </div>
              <Progress value={overallProgress} className="mt-4 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quizzes Completed</p>
                  <p className="text-3xl font-bold">{stats.quizzesCompleted}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg accuracy: {stats.avgAccuracy}%
                  </p>
                </div>
                <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Trophy className="h-7 w-7 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                  <p className="text-3xl font-bold">{earnedFundamentalsCount}/{fundamentalsAchievements.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fundamentals badges
                  </p>
                </div>
                <div className="h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Award className="h-7 w-7 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total XP</p>
                  <p className="text-3xl font-bold">{stats.totalXP.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Keep learning!
                  </p>
                </div>
                <div className="h-14 w-14 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2"
        >
          <Card
            className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/fundamentals/language")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/fundamentals/language");
              }
            }}
          >
            <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
                    <Code2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      Programming Languages
                    </CardTitle>
                    <CardDescription>{languages.length} languages available</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">
                  {stats.languagesCompleted}/{stats.languagesTotal}
                </span>
              </div>
              <Progress 
                value={(stats.languagesCompleted / stats.languagesTotal) * 100} 
                className="h-2" 
              />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/fundamentals/oops")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/fundamentals/oops");
              }
            }}
          >
            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      OOPs Concepts
                    </CardTitle>
                    <CardDescription>{oopsConcepts.length} concepts to master</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">
                  {stats.oopsCompleted}/{stats.oopsTotal}
                </span>
              </div>
              <Progress 
                value={(stats.oopsCompleted / stats.oopsTotal) * 100} 
                className="h-2" 
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <FundamentalsStreakCard />
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Fundamentals Achievements
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/learn/achievements")}>
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {fundamentalsAchievements.map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    earned={isEarned(achievement.id)}
                    earnedAt={getEarnedAt(achievement.id)}
                    size="md"
                    showName={true}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Leaderboard and Analytics Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="leaderboard" className="space-y-4">
            <TabsList>
              <TabsTrigger value="leaderboard" className="gap-2">
                <Users className="h-4 w-4" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="leaderboard">
              <FundamentalsLeaderboard currentUserId={user?.id} type="all" />
            </TabsContent>
            
            <TabsContent value="analytics">
              <FundamentalsAnalytics type="all" />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default FundamentalsOverview;
