import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Network, LayoutGrid, TrendingUp, Trophy, 
  Award, Sparkles, BarChart3, Users, ArrowRight,
  Layers, Database, Server, Cloud
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ProgressStats {
  hldCompleted: number;
  hldTotal: number;
  lldCompleted: number;
  lldTotal: number;
  quizzesCompleted: number;
  avgAccuracy: number;
  totalXP: number;
}

const SystemDesignOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProgressStats>({
    hldCompleted: 0,
    hldTotal: 6, // Static count from HLD topics
    lldCompleted: 0,
    lldTotal: 6, // Static count from LLD topics
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
        // Fetch topic progress for HLD
        const { data: hldProgress } = await supabase
          .from("user_topic_progress")
          .select("completed")
          .eq("user_id", user.id)
          .eq("sheet_id", "hld");

        const hldCompleted = hldProgress?.filter((p) => p.completed).length || 0;

        // Fetch topic progress for LLD
        const { data: lldProgress } = await supabase
          .from("user_topic_progress")
          .select("completed")
          .eq("user_id", user.id)
          .eq("sheet_id", "lld");

        const lldCompleted = lldProgress?.filter((p) => p.completed).length || 0;

        // Fetch quiz results for system design
        const { data: quizResults } = await supabase
          .from("quiz_results")
          .select("accuracy, score")
          .eq("user_id", user.id)
          .or("quiz_type.like.hld-%,quiz_type.like.lld-%");

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
          hldCompleted,
          hldTotal: 6,
          lldCompleted,
          lldTotal: 6,
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

  const totalCompleted = stats.hldCompleted + stats.lldCompleted;
  const totalQuestions = stats.hldTotal + stats.lldTotal;
  const overallProgress = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">System Design Dashboard</h1>
              <p className="text-sm text-muted-foreground">Your progress across HLD & LLD</p>
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
                  <p className="text-sm text-muted-foreground">HLD Topics</p>
                  <p className="text-3xl font-bold">{stats.hldCompleted}/{stats.hldTotal}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    System architecture
                  </p>
                </div>
                <div className="h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Cloud className="h-7 w-7 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">LLD Topics</p>
                  <p className="text-3xl font-bold">{stats.lldCompleted}/{stats.lldTotal}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Design patterns
                  </p>
                </div>
                <div className="h-14 w-14 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Database className="h-7 w-7 text-purple-500" />
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
            onClick={() => navigate("/system-design/hld")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/system-design/hld");
              }
            }}
          >
            <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
                    <Network className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      High Level Design
                    </CardTitle>
                    <CardDescription>System architecture & scalability</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">
                  {stats.hldCompleted}/{stats.hldTotal}
                </span>
              </div>
              <Progress 
                value={(stats.hldCompleted / stats.hldTotal) * 100} 
                className="h-2" 
              />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/system-design/lld")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/system-design/lld");
              }
            }}
          >
            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                    <LayoutGrid className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      Low Level Design
                    </CardTitle>
                    <CardDescription>OO design & patterns</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">
                  {stats.lldCompleted}/{stats.lldTotal}
                </span>
              </div>
              <Progress 
                value={(stats.lldCompleted / stats.lldTotal) * 100} 
                className="h-2" 
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Topics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Quick Start Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { title: "Scalability", type: "HLD", difficulty: "Advanced", icon: TrendingUp },
                  { title: "Load Balancing", type: "HLD", difficulty: "Intermediate", icon: Network },
                  { title: "Caching", type: "HLD", difficulty: "Intermediate", icon: Database },
                  { title: "Design Patterns", type: "LLD", difficulty: "Intermediate", icon: Layers },
                  { title: "SOLID Principles", type: "LLD", difficulty: "Intermediate", icon: LayoutGrid },
                  { title: "Class Diagrams", type: "LLD", difficulty: "Basic", icon: Server },
                ].map((topic, index) => (
                  <Card
                    key={topic.title}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/system-design/${topic.type.toLowerCase()}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/system-design/${topic.type.toLowerCase()}`);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <topic.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{topic.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{topic.type}</Badge>
                            <Badge 
                              variant={topic.difficulty === "Advanced" ? "destructive" : topic.difficulty === "Intermediate" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {topic.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default SystemDesignOverview;
