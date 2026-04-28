import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
}

export const ProblemStatsHeader = ({
  counts,
  totalSolved,
  weekSolved,
  prevWeekSolved,
  continueProblem,
}: Props) => {
  const pct = counts.total > 0 ? Math.round((totalSolved / counts.total) * 100) : 0;
  const delta = weekSolved - prevWeekSolved;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
      {/* Progress card */}
      <Card className="p-5 relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9155" fill="none" className="stroke-muted" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                className="stroke-primary transition-all duration-700"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${pct}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{pct}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Your Progress</p>
            <p className="text-2xl font-bold mt-1">
              {totalSolved}
              <span className="text-base text-muted-foreground">/{counts.total}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">problems solved</p>
          </div>
        </div>
      </Card>

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
