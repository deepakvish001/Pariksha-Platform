import React, { useEffect, useState } from "react";
import { Trophy, Medal, Clock, Target, Crown, Users, Code2, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_quizzes: number;
  total_score: number;
  total_questions: number;
  avg_accuracy: number;
  best_accuracy: number;
}

interface FundamentalsLeaderboardProps {
  currentUserId?: string;
  type?: "all" | "languages" | "oops";
}

const FundamentalsLeaderboard: React.FC<FundamentalsLeaderboardProps> = ({ 
  currentUserId, 
  type = "all" 
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"all" | "week" | "today">("all");
  const [typeFilter, setTypeFilter] = useState(type);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("quiz_results")
          .select("user_id, score, total_questions, accuracy, completed_at, quiz_type");

        // Filter by quiz type
        if (typeFilter === "languages") {
          query = query.like("quiz_type", "language-%");
        } else if (typeFilter === "oops") {
          query = query.like("quiz_type", "oops-%");
        } else {
          // All fundamentals - both language and oops
          query = query.or("quiz_type.like.language-%,quiz_type.like.oops-%");
        }

        // Time filter
        if (timeFilter === "today") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          query = query.gte("completed_at", today.toISOString());
        } else if (timeFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          query = query.gte("completed_at", weekAgo.toISOString());
        }

        const { data: results, error } = await query;

        if (error) {
          console.error("Error fetching leaderboard:", error);
          return;
        }

        // Aggregate by user
        const userStats = new Map<string, {
          total_quizzes: number;
          total_score: number;
          total_questions: number;
          accuracies: number[];
        }>();

        results?.forEach((r) => {
          const existing = userStats.get(r.user_id) || {
            total_quizzes: 0,
            total_score: 0,
            total_questions: 0,
            accuracies: [],
          };
          existing.total_quizzes++;
          existing.total_score += r.score;
          existing.total_questions += r.total_questions;
          existing.accuracies.push(r.accuracy);
          userStats.set(r.user_id, existing);
        });

        // Fetch profile info
        const userIds = Array.from(userStats.keys());
        if (userIds.length === 0) {
          setEntries([]);
          setIsLoading(false);
          return;
        }

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

        // Build leaderboard entries
        const leaderboardEntries: LeaderboardEntry[] = Array.from(userStats.entries())
          .map(([userId, stats]) => ({
            user_id: userId,
            full_name: profileMap.get(userId)?.full_name || "Anonymous",
            avatar_url: profileMap.get(userId)?.avatar_url || null,
            total_quizzes: stats.total_quizzes,
            total_score: stats.total_score,
            total_questions: stats.total_questions,
            avg_accuracy: Math.round(stats.accuracies.reduce((a, b) => a + b, 0) / stats.accuracies.length),
            best_accuracy: Math.max(...stats.accuracies),
          }))
          .sort((a, b) => {
            // Sort by avg accuracy first, then by total quizzes
            if (b.avg_accuracy !== a.avg_accuracy) return b.avg_accuracy - a.avg_accuracy;
            return b.total_quizzes - a.total_quizzes;
          })
          .slice(0, 20);

        setEntries(leaderboardEntries);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeFilter, typeFilter]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-amber-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-slate-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm text-muted-foreground font-medium w-5 text-center">{index + 1}</span>;
  };

  const getTypeLabel = () => {
    switch (typeFilter) {
      case "languages": return "Languages";
      case "oops": return "OOPs";
      default: return "Fundamentals";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
            {getTypeLabel()} Quiz Champions
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {entries.length} players
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type Filter */}
        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 gap-1">
              <BookOpen className="h-3 w-3" />
              All
            </TabsTrigger>
            <TabsTrigger value="languages" className="flex-1 gap-1">
              <Code2 className="h-3 w-3" />
              Languages
            </TabsTrigger>
            <TabsTrigger value="oops" className="flex-1 gap-1">
              <Target className="h-3 w-3" />
              OOPs
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Time Filter */}
        <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as typeof timeFilter)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All Time</TabsTrigger>
            <TabsTrigger value="week" className="flex-1">This Week</TabsTrigger>
            <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
          </TabsList>
        </Tabs>

        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No quiz results yet. Be the first to compete!
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {entries.map((entry, index) => (
              <div
                key={entry.user_id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  entry.user_id === currentUserId
                    ? "bg-primary/10 border-primary/30"
                    : "bg-muted/30 border-border/50",
                  index < 3 && "border-amber-500/30"
                )}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index)}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {entry.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm">
                    {entry.full_name}
                    {entry.user_id === currentUserId && (
                      <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.total_quizzes} quizzes · {entry.total_score}/{entry.total_questions} correct
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <Target className="h-3 w-3 text-primary" />
                    {entry.avg_accuracy}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Best: {entry.best_accuracy}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FundamentalsLeaderboard;
