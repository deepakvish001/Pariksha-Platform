import { AlertTriangle, TrendingDown, TrendingUp, Target, Clock, CheckCircle, XCircle, SkipForward } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWeakAreasAnalysis } from "@/hooks/useWeakAreasAnalysis";
import { categoryConfig } from "./quiz/types";

const WeakAreasAnalysis = () => {
  const { categoryStats, overallAccuracy, weakestCategory, strongestCategory, isLoading, error } =
    useWeakAreasAnalysis();

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-primary/20">
        <CardContent className="py-8 text-center text-muted-foreground">
          Analyzing your performance...
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
            <Target className="h-5 w-5 text-primary" />
            Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          Complete some quizzes to see your performance analysis here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Performance Analysis
          <Badge variant="outline" className="ml-auto">
            {overallAccuracy}% Overall
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weak/Strong Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {weakestCategory && categoryStats.find(s => s.category === weakestCategory) && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Needs Practice</p>
                <p className="font-medium text-sm truncate">
                  {categoryConfig[weakestCategory as keyof typeof categoryConfig]?.label || weakestCategory}
                </p>
                <p className="text-xs text-destructive">
                  {categoryStats.find(s => s.category === weakestCategory)?.accuracy}% accuracy
                </p>
              </div>
            </div>
          )}
          {strongestCategory && categoryStats.find(s => s.category === strongestCategory) && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Strongest Area</p>
                <p className="font-medium text-sm truncate">
                  {categoryConfig[strongestCategory as keyof typeof categoryConfig]?.label || strongestCategory}
                </p>
                <p className="text-xs text-emerald-600">
                  {categoryStats.find(s => s.category === strongestCategory)?.accuracy}% accuracy
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          {categoryStats.map((stat) => {
            const config = categoryConfig[stat.category as keyof typeof categoryConfig];
            const Icon = config?.icon;
            const isWeak = stat.accuracy < 60;
            const isStrong = stat.accuracy >= 80;

            return (
              <div key={stat.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className={cn("h-4 w-4", config?.color)} />}
                    <span className="font-medium text-sm">{config?.label || stat.category}</span>
                    {isWeak && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0">
                        <AlertTriangle className="h-3 w-3 mr-0.5" />
                        Weak
                      </Badge>
                    )}
                    {isStrong && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs px-1.5 py-0">
                        Strong
                      </Badge>
                    )}
                  </div>
                  <span
                    className={cn(
                      "font-bold text-sm",
                      isWeak ? "text-destructive" : isStrong ? "text-emerald-500" : "text-foreground"
                    )}
                  >
                    {stat.accuracy}%
                  </span>
                </div>
                <Progress
                  value={stat.accuracy}
                  className={cn(
                    "h-2",
                    isWeak && "[&>div]:bg-destructive",
                    isStrong && "[&>div]:bg-emerald-500"
                  )}
                />
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    {stat.correctAnswers} correct
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-destructive" />
                    {stat.incorrectAnswers} wrong
                  </span>
                  <span className="flex items-center gap-1">
                    <SkipForward className="h-3 w-3" />
                    {stat.skippedAnswers} skipped
                  </span>
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock className="h-3 w-3" />
                    {stat.avgTimeSeconds}s avg
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeakAreasAnalysis;
