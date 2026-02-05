import React from "react";
import { motion } from "framer-motion";
import { Flame, Calendar, Trophy, Target, CheckCircle, Clock, Snowflake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFundamentalsStreak } from "@/hooks/useFundamentalsStreak";
import { useStreakFreeze } from "@/hooks/useStreakFreeze";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FundamentalsStreakCardProps {
  className?: string;
  compact?: boolean;
}

const FundamentalsStreakCard: React.FC<FundamentalsStreakCardProps> = ({ 
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
  } = useFundamentalsStreak();

  const {
    canUseFreeze,
    daysUntilNextFreeze,
    useStreakFreeze: activateStreakFreeze,
    isLoading: freezeLoading,
  } = useStreakFreeze();

  const weeklyGoal = 5;
  const weeklyProgress = Math.min((thisWeekDays / weeklyGoal) * 100, 100);

  const getStreakMilestone = (streak: number) => {
    if (streak >= 30) return { label: "🔥 On Fire!", color: "text-orange-500" };
    if (streak >= 14) return { label: "⚡ Unstoppable", color: "text-yellow-500" };
    if (streak >= 7) return { label: "💪 Consistent", color: "text-emerald-500" };
    if (streak >= 3) return { label: "🌱 Growing", color: "text-green-500" };
    return { label: "🚀 Getting Started", color: "text-blue-500" };
  };

  const milestone = getStreakMilestone(currentStreak);

  const showStreakBroken = !todayCompleted && currentStreak === 0;

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
                  ? "bg-gradient-to-br from-orange-500 to-red-500" 
                  : "bg-muted"
              )}>
                <Flame className={cn(
                  "h-6 w-6",
                  currentStreak > 0 ? "text-white" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentStreak}</p>
                <p className="text-sm text-muted-foreground">day streak</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showStreakBroken && canUseFreeze && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={activateStreakFreeze}
                      disabled={freezeLoading}
                    >
                      <Snowflake className="h-4 w-4 text-blue-500" />
                      Restore
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Use your weekly streak freeze to restore your streak</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {todayCompleted ? (
                <Badge variant="default" className="bg-emerald-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Done today
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Practice today
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Fundamentals Study Streak
          </span>
          {canUseFreeze && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-blue-500 border-blue-500/30 gap-1">
                  <Snowflake className="h-3 w-3" />
                  1 Freeze Available
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>You can restore a broken streak once per week</p>
              </TooltipContent>
            </Tooltip>
          )}
          {!canUseFreeze && daysUntilNextFreeze > 0 && (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              <Snowflake className="h-3 w-3" />
              {daysUntilNextFreeze}d until freeze
            </Badge>
          )}
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
                ? "bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30" 
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
                <span className="text-lg">🔥</span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Milestone Badge */}
        <div className="text-center">
          <Badge variant="secondary" className={cn("text-sm", milestone.color)}>
            {milestone.label}
          </Badge>
          {showStreakBroken && canUseFreeze && (
            <div className="mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={activateStreakFreeze}
                disabled={freezeLoading}
              >
                <Snowflake className="h-4 w-4 text-blue-500" />
                Use Streak Freeze
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Restore your streak (1 use per week)
              </p>
            </div>
          )}
          {!todayCompleted && currentStreak > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Complete a topic today to keep your streak!
            </p>
          )}
          {todayCompleted && (
            <p className="text-xs text-emerald-500 mt-2 flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3" />
              You've studied today!
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
      </CardContent>
    </Card>
  );
};

export default FundamentalsStreakCard;
