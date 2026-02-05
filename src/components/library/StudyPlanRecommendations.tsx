import { BookOpen, Target, Clock, Zap, ArrowRight, Brain, TrendingUp, Check, RotateCcw, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useWeakAreasAnalysis } from "@/hooks/useWeakAreasAnalysis";
import { useStudyPlanGoals } from "@/hooks/useStudyPlanGoals";
import { categoryConfig } from "./quiz/types";
import { useNavigate } from "react-router-dom";

interface StudyRecommendation {
  category: string;
  label: string;
  priority: "high" | "medium" | "low";
  accuracy: number;
  questionsToReview: number;
  estimatedTime: string;
  reason: string;
  action: string;
}

const StudyPlanRecommendations = () => {
  const { categoryStats, overallAccuracy, isLoading, error } = useWeakAreasAnalysis();
  const { goals, startGoal, markCompleted, resetGoal, getGoalForCategory, isLoading: goalsLoading } = useStudyPlanGoals();
  const navigate = useNavigate();

  if (isLoading || goalsLoading) {
    return (
      <Card className="bg-card/50 border-primary/20">
        <CardContent className="py-8 text-center text-muted-foreground">
          Generating your study plan...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/50 border-destructive/20">
        <CardContent className="py-8 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (categoryStats.length === 0) {
    return (
      <Card className="bg-card/50 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Study Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          Complete some quizzes to get personalized study recommendations.
        </CardContent>
      </Card>
    );
  }

  // Generate recommendations based on category stats
  const recommendations: StudyRecommendation[] = categoryStats
    .filter((stat) => stat.totalQuestions > 0)
    .map((stat) => {
      let priority: "high" | "medium" | "low";
      let reason: string;
      let action: string;
      let questionsToReview: number;

      if (stat.accuracy < 50) {
        priority = "high";
        reason = "Critical improvement needed";
        action = "Focus on fundamentals";
        questionsToReview = Math.max(20, stat.incorrectAnswers + stat.skippedAnswers);
      } else if (stat.accuracy < 70) {
        priority = "medium";
        reason = "Room for improvement";
        action = "Review weak concepts";
        questionsToReview = Math.max(15, Math.ceil((stat.incorrectAnswers + stat.skippedAnswers) * 0.8));
      } else if (stat.accuracy < 85) {
        priority = "low";
        reason = "Good progress, polish skills";
        action = "Practice advanced problems";
        questionsToReview = Math.max(10, Math.ceil(stat.incorrectAnswers * 0.5));
      } else {
        priority = "low";
        reason = "Excellent! Maintain proficiency";
        action = "Quick review sessions";
        questionsToReview = 5;
      }

      // Estimate time: ~2 min per question
      const totalMinutes = questionsToReview * 2;
      const estimatedTime = totalMinutes >= 60
        ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
        : `${totalMinutes}m`;

      return {
        category: stat.category,
        label: categoryConfig[stat.category as keyof typeof categoryConfig]?.label || stat.category,
        priority,
        accuracy: stat.accuracy,
        questionsToReview,
        estimatedTime,
        reason,
        action,
      };
    })
    .sort((a, b) => {
      // Sort by priority (high first), then by accuracy (lowest first)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.accuracy - b.accuracy;
    });

  const highPriorityCount = recommendations.filter((r) => r.priority === "high").length;
  const completedGoalsCount = goals.filter((g) => g.is_completed).length;
  const activeGoalsCount = goals.filter((g) => !g.is_completed).length;

  const handleStartGoal = async (category: string, targetQuestions: number) => {
    await startGoal(category, targetQuestions);
  };

  const handleMarkCompleted = async (category: string) => {
    await markCompleted(category);
  };

  const handleResetGoal = async (category: string) => {
    await resetGoal(category);
  };

  const handleStartPractice = (category: string) => {
    navigate("/library/quiz");
  };

  const getPriorityStyles = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return {
          badge: "bg-destructive/10 text-destructive border-destructive/30",
          border: "border-destructive/30",
          icon: "text-destructive",
        };
      case "medium":
        return {
          badge: "bg-amber-500/10 text-amber-600 border-amber-500/30",
          border: "border-amber-500/30",
          icon: "text-amber-500",
        };
      case "low":
        return {
          badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
          border: "border-emerald-500/30",
          icon: "text-emerald-500",
        };
    }
  };

  return (
    <Card className="bg-card/50 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Personalized Study Plan
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {overallAccuracy}% Overall
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
              <Target className="h-4 w-4" />
              {activeGoalsCount}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-emerald-500">
              <Check className="h-4 w-4" />
              {completedGoalsCount}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-amber-500">
              <Zap className="h-4 w-4" />
              {highPriorityCount}
            </div>
            <p className="text-xs text-muted-foreground">Priority</p>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const config = categoryConfig[rec.category as keyof typeof categoryConfig];
            const Icon = config?.icon;
            const styles = getPriorityStyles(rec.priority);
            const goal = getGoalForCategory(rec.category);
            const hasActiveGoal = goal && !goal.is_completed;
            const isGoalCompleted = goal?.is_completed;
            const progressPercent = goal ? Math.min(100, Math.round((goal.questions_practiced / goal.target_questions) * 100)) : 0;

            return (
              <div
                key={rec.category}
                className={cn(
                  "p-4 rounded-lg border bg-card/50 space-y-3",
                  isGoalCompleted ? "border-emerald-500/30 bg-emerald-500/5" : styles.border
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {Icon && <Icon className={cn("h-5 w-5 shrink-0", isGoalCompleted ? "text-emerald-500" : config?.color)} />}
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm">{rec.label}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {isGoalCompleted ? "Goal completed! 🎉" : rec.reason}
                      </p>
                    </div>
                  </div>
                  {isGoalCompleted ? (
                    <Badge className="shrink-0 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      <Check className="h-3 w-3 mr-1" />
                      Done
                    </Badge>
                  ) : (
                    <Badge className={cn("shrink-0 text-xs capitalize", styles.badge)}>
                      {rec.priority}
                    </Badge>
                  )}
                </div>

                {/* Goal Progress (if active) */}
                {hasActiveGoal && goal && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {goal.questions_practiced}/{goal.target_questions} questions
                      </span>
                      <span className="font-medium text-primary">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2 [&>div]:bg-primary" />
                  </div>
                )}

                {/* Accuracy Progress (if no active goal) */}
                {!hasActiveGoal && !isGoalCompleted && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Current Accuracy</span>
                      <span className={cn("font-medium", styles.icon)}>{rec.accuracy}%</span>
                    </div>
                    <Progress
                      value={rec.accuracy}
                      className={cn(
                        "h-1.5",
                        rec.priority === "high" && "[&>div]:bg-destructive",
                        rec.priority === "medium" && "[&>div]:bg-amber-500",
                        rec.priority === "low" && "[&>div]:bg-emerald-500"
                      )}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {!isGoalCompleted && (
                      <>
                        <span className="flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          {hasActiveGoal && goal ? `${goal.target_questions - goal.questions_practiced} left` : `${rec.questionsToReview} questions`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {rec.estimatedTime}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isGoalCompleted ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleResetGoal(rec.category)}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restart
                      </Button>
                    ) : hasActiveGoal ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-600"
                          onClick={() => handleMarkCompleted(rec.category)}
                        >
                          <Check className="h-3 w-3" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-primary hover:text-primary"
                          onClick={() => handleStartPractice(rec.category)}
                        >
                          <Play className="h-3 w-3" />
                          Practice
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 text-primary hover:text-primary"
                        onClick={() => handleStartGoal(rec.category, rec.questionsToReview)}
                      >
                        <ArrowRight className="h-3 w-3" />
                        Start Goal
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Goal Suggestion */}
        {highPriorityCount > 0 && activeGoalsCount === 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Weekly Goal Suggestion</p>
                <p className="text-xs text-muted-foreground">
                  Focus on your {highPriorityCount} high-priority {highPriorityCount === 1 ? "topic" : "topics"} first.
                  Click "Start Goal" to begin tracking your progress.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeGoalsCount > 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Keep Going!</p>
                <p className="text-xs text-muted-foreground">
                  You have {activeGoalsCount} active {activeGoalsCount === 1 ? "goal" : "goals"}. 
                  Complete quizzes to make progress, or mark goals as complete when done.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyPlanRecommendations;
