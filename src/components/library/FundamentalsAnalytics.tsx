import React, { useEffect, useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Target, Clock, BarChart3, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import { format, subDays, startOfDay, parseISO } from "date-fns";

interface QuizResult {
  id: string;
  quiz_type: string;
  score: number;
  total_questions: number;
  accuracy: number;
  avg_time_seconds: number;
  total_time_seconds: number;
  completed_at: string;
  difficulty: string | null;
  category: string | null;
}

interface FundamentalsAnalyticsProps {
  type?: "all" | "languages" | "oops";
}

const FundamentalsAnalytics: React.FC<FundamentalsAnalyticsProps> = ({ type = "all" }) => {
  const { user } = useAuth();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        let query = supabase
          .from("quiz_results")
          .select("*")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: true });

        // Filter by quiz type
        if (type === "languages") {
          query = query.like("quiz_type", "language-%");
        } else if (type === "oops") {
          query = query.like("quiz_type", "oops-%");
        } else {
          query = query.or("quiz_type.like.language-%,quiz_type.like.oops-%");
        }

        // Date range filter
        if (dateRange === "7d") {
          query = query.gte("completed_at", subDays(new Date(), 7).toISOString());
        } else if (dateRange === "30d") {
          query = query.gte("completed_at", subDays(new Date(), 30).toISOString());
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching analytics:", error);
          return;
        }

        setResults(data || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [user, type, dateRange]);

  // Calculate stats
  const stats = useMemo(() => {
    if (results.length === 0) return null;

    const totalQuizzes = results.length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalQuestions = results.reduce((sum, r) => sum + r.total_questions, 0);
    const avgAccuracy = Math.round(results.reduce((sum, r) => sum + r.accuracy, 0) / totalQuizzes);
    const avgTimePerQ = Math.round(results.reduce((sum, r) => sum + r.avg_time_seconds, 0) / totalQuizzes);
    
    // Calculate trend (compare last 5 vs previous 5)
    const sorted = [...results].sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
    const recent = sorted.slice(0, 5);
    const previous = sorted.slice(5, 10);
    
    let trend = 0;
    if (recent.length > 0 && previous.length > 0) {
      const recentAvg = recent.reduce((sum, r) => sum + r.accuracy, 0) / recent.length;
      const previousAvg = previous.reduce((sum, r) => sum + r.accuracy, 0) / previous.length;
      trend = Math.round(recentAvg - previousAvg);
    }

    // Best streak (consecutive quizzes with 80%+ accuracy)
    let currentStreak = 0;
    let bestStreak = 0;
    sorted.forEach((r) => {
      if (r.accuracy >= 80) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return {
      totalQuizzes,
      totalScore,
      totalQuestions,
      avgAccuracy,
      avgTimePerQ,
      trend,
      bestStreak,
    };
  }, [results]);

  // Chart data - accuracy over time
  const accuracyChartData = useMemo(() => {
    if (results.length === 0) return [];

    // Group by date and calculate daily average
    const byDate = new Map<string, number[]>();
    results.forEach((r) => {
      const date = format(parseISO(r.completed_at), "MMM dd");
      const existing = byDate.get(date) || [];
      existing.push(r.accuracy);
      byDate.set(date, existing);
    });

    return Array.from(byDate.entries()).map(([date, accuracies]) => ({
      date,
      accuracy: Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length),
      quizzes: accuracies.length,
    }));
  }, [results]);

  // Chart data - by topic/language
  const topicChartData = useMemo(() => {
    if (results.length === 0) return [];

    const byTopic = new Map<string, { total: number; correct: number; count: number }>();
    results.forEach((r) => {
      // Extract topic name from quiz_type
      let topic = r.quiz_type;
      if (topic.startsWith("language-")) {
        topic = topic.replace("language-", "").charAt(0).toUpperCase() + 
                topic.replace("language-", "").slice(1);
      } else if (topic.startsWith("oops-")) {
        topic = topic.replace("oops-", "").split("-").map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(" ");
      }

      const existing = byTopic.get(topic) || { total: 0, correct: 0, count: 0 };
      existing.total += r.total_questions;
      existing.correct += r.score;
      existing.count++;
      byTopic.set(topic, existing);
    });

    return Array.from(byTopic.entries())
      .map(([topic, data]) => ({
        topic,
        accuracy: Math.round((data.correct / data.total) * 100),
        quizzes: data.count,
      }))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 8);
  }, [results]);

  if (!user) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          Sign in to view your analytics
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading analytics...
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No quiz data yet. Complete some quizzes to see your analytics!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Range Filter */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Quiz Performance Analytics
            </CardTitle>
            <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
              <TabsList>
                <TabsTrigger value="7d">7 Days</TabsTrigger>
                <TabsTrigger value="30d">30 Days</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-bold">{stats.avgAccuracy}%</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${stats.trend >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {stats.trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(stats.trend)}%
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Quizzes</p>
                <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Questions Solved</p>
                <p className="text-2xl font-bold">{stats.totalScore}/{stats.totalQuestions}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Time/Q</p>
                <p className="text-2xl font-bold">{stats.avgTimePerQ}s</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy Trend Chart */}
      {accuracyChartData.length > 1 && (
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Accuracy Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accuracyChartData}>
                  <defs>
                    <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number) => [`${value}%`, "Accuracy"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#accuracyGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic Performance Chart */}
      {topicChartData.length > 0 && (
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance by Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="topic" 
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number, name: string) => [
                      name === "accuracy" ? `${value}%` : value,
                      name === "accuracy" ? "Accuracy" : "Quizzes"
                    ]}
                  />
                  <Bar 
                    dataKey="accuracy" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FundamentalsAnalytics;
