import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CodingProblem } from "@/data/codingProblemsData";

interface Counts {
  total: number;
  easy: number;
  medium: number;
  hard: number;
  solvedEasy: number;
  solvedMedium: number;
  solvedHard: number;
}

interface Props {
  counts: Counts;
  totalSolved: number;
  weekSolved: number;
  prevWeekSolved: number;
  continueProblem?: CodingProblem;
  /** Render skeletons in the final card layout while stats load. */
  loading?: boolean;
}

/**
 * Overall solved % is now surfaced by `TopicProgressRing` (with topic = "All"),
 * so this header focuses on the difficulty breakdown and weekly momentum to
 * avoid duplicating the same number twice on the page.
 */
export const ProblemStatsHeader = ({
  counts,
  totalSolved: _totalSolved,
  weekSolved,
  prevWeekSolved,
  continueProblem,
  loading,
}: Props) => {
  const delta = weekSolved - prevWeekSolved;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6" aria-busy="true">
        {/* Difficulty breakdown skeleton */}
        <Card className="p-5">
          <Skeleton className="h-3 w-24 mb-3" />
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </Card>

        {/* Momentum card skeleton */}
        <Card className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <Skeleton className="h-9 w-full mt-auto rounded-md" />
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
      {/* Difficulty breakdown */}
      <Card className="p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">By Difficulty</p>
        <div className="space-y-2.5">
          {[
            { label: "Easy", solved: counts.solvedEasy, total: counts.easy, color: "bg-emerald-500", text: "text-emerald-500" },
            { label: "Medium", solved: counts.solvedMedium, total: counts.medium, color: "bg-amber-500", text: "text-amber-500" },
            { label: "Hard", solved: counts.solvedHard, total: counts.hard, color: "bg-rose-500", text: "text-rose-500" },
          ].map((row) => {
            const p = row.total > 0 ? (row.solved / row.total) * 100 : 0;
            return (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={row.text}>{row.label}</span>
                  <span className="text-muted-foreground">
                    {row.solved}/{row.total}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${row.color} transition-all duration-500`} style={{ width: `${p}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Momentum + continue */}
      <Card className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold mt-1 flex items-center gap-2">
              {weekSolved}
              {delta !== 0 && (
                <span className={`text-xs font-normal flex items-center gap-0.5 ${delta > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  <TrendingUp className={`h-3 w-3 ${delta < 0 ? "rotate-180" : ""}`} />
                  {Math.abs(delta)}
                </span>
              )}
            </p>
          </div>
          <Trophy className="h-5 w-5 text-amber-500/70" />
        </div>
        {continueProblem ? (
          <Button asChild size="sm" variant="outline" className="w-full justify-between mt-auto">
            <Link to={`/library/problems/${continueProblem.slug}`}>
              <span className="truncate">Continue: {continueProblem.title}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground mt-auto">
            Solve a problem this week to start your momentum.
          </p>
        )}
      </Card>
    </div>
  );
};
