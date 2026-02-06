import React from "react";
import { motion } from "framer-motion";
import { Flame, Calendar, Trophy, Target, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRoadmapStreak } from "@/hooks/useRoadmapStreak";
import { Skeleton } from "@/components/ui/skeleton";

interface RoadmapStreakCardProps {
  className?: string;
  compact?: boolean;
}

const RoadmapStreakCard: React.FC<RoadmapStreakCardProps> = ({ 
  className,
  compact = false 
}) => {
  const {
    currentStreak,
    longestStreak,
    todayCompleted,
    totalDaysActive,
    thisWeekDays,
    isLoading,
  } = useRoadmapStreak();

  const weeklyGoal = 5;
  const weeklyProgress = Math.min((thisWeekDays / weeklyGoal) * 100, 100);

  const getStreakMilestone = (streak: number) => {
    if (streak >= 30) return { label: "🗺️ Explorer!", color: "text-purple-500" };
    if (streak >= 14) return { label: "🚀 Pathfinder", color: "text-pink-500" };
    if (streak >= 7) return { label: "📍 Navigator", color: "text-emerald-500" };
    if (streak >= 3) return { label: "🧭 Wayfinder", color: "text-blue-500" };
    return { label: "🌱 Starting Out", color: "text-green-500" };
  };

  const milestone = getStreakMilestone(currentStreak);

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                currentStreak > 0 
                  ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                  : "bg-muted"
              )}>
                <Flame className={cn(
                  "h-6 w-6",
                  currentStreak > 0 ? "text-white" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentStreak}</p>
                <p className="text-sm text-muted-foreground">day roadmap streak</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {todayCompleted ? (
                <Badge variant="default" className="bg-emerald-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Done today
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Complete a topic
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("overflow-hidden glass-card transition-all duration-200 hover:shadow-lg hover:shadow-primary/5", className)}>
        <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-purple-500" />
          Roadmap Progress Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Streak Display */}
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className={cn(
              "h-28 w-28 rounded-full flex flex-col items-center justify-center",
              currentStreak > 0 
                ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30" 
                : "bg-muted"
            )}>
              <span className={cn(
                "text-4xl font-bold",
                currentStreak > 0 ? "text-white" : "text-muted-foreground"
              )}>
                {currentStreak}
              </span>
              <span className={cn(
                "text-xs",
                currentStreak > 0 ? "text-white/80" : "text-muted-foreground"
              )}>
                {currentStreak === 1 ? "day" : "days"}
              </span>
            </div>
            {currentStreak >= 7 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg"
              >
                <span className="text-lg">🗺️</span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Milestone Badge */}
        <div className="text-center">
          <Badge variant="secondary" className={cn("text-sm", milestone.color)}>
            {milestone.label}
          </Badge>
          {!todayCompleted && currentStreak > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Complete a roadmap topic today to keep your streak!
            </p>
          )}
          {todayCompleted && (
            <p className="text-xs text-emerald-500 mt-2 flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3" />
              You've made progress today!
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Trophy className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
            <p className="text-lg font-bold">{longestStreak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold">{totalDaysActive}</p>
            <p className="text-xs text-muted-foreground">Total Days</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Target className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
            <p className="text-lg font-bold">{thisWeekDays}/{weeklyGoal}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Weekly Goal</span>
            <span className="font-medium">{thisWeekDays} of {weeklyGoal} days</span>
          </div>
          <Progress value={weeklyProgress} className="h-2" />
          {weeklyProgress >= 100 && (
            <p className="text-xs text-emerald-500 text-center">
              🎉 Weekly goal achieved!
            </p>
          )}
        </div>

        {/* Motivational message */}
        <p className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
          {currentStreak === 0 && "Complete a roadmap topic to start your streak! 🚀"}
          {currentStreak === 1 && "Great start on your journey! Keep exploring! 💪"}
          {currentStreak >= 2 && currentStreak < 7 && "You're building momentum! Don't stop now! 🔥"}
          {currentStreak >= 7 && currentStreak < 30 && "One week strong! You're a true navigator! 🧭"}
          {currentStreak >= 30 && "Legendary explorer! You're unstoppable! 🏆"}
        </p>
      </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoadmapStreakCard;
