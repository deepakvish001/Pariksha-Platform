import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Flame, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { DailyChallenge } from "@/hooks/useDailyChallenge";
import { DailyChallengeSyncStatus } from "@/components/library/coding/DailyChallengeSyncStatus";

interface Props {
  daily: DailyChallenge;
  className?: string;
}

const difficultyClass = (d: string) => {
  switch (d) {
    case "Easy":
      return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
    case "Medium":
      return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    case "Hard":
      return "bg-rose-500/15 text-rose-500 border-rose-500/30";
    default:
      return "";
  }
};

// Returns ms until next local midnight
const msUntilTomorrow = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
};

const formatCountdown = (ms: number) => {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
};

export const DailyChallengeCard = ({ daily, className }: Props) => {
  const { problem, isCompletedToday, streak, completedTotal } = daily;
  const countdown = formatCountdown(msUntilTomorrow());

  // Weekly progress ring: completions in the last 7 days (1/7 ... 7/7)
  // Using streak as the visible momentum signal.
  const weeklyTarget = 7;
  const weeklyDone = Math.min(streak, weeklyTarget);
  const weeklyPct = (weeklyDone / weeklyTarget) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card
        className={cn(
          "relative overflow-hidden p-4 sm:p-5 mb-4",
          "bg-gradient-to-br from-primary/10 via-card to-card",
          "border-primary/20"
        )}
      >
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: title + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Daily Challenge
              </span>
              {isCompletedToday && (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Done today
                </Badge>
              )}
            </div>

            <Link
              to={`/library/problems/${problem.slug}`}
              className="group inline-flex items-baseline gap-2 hover:underline"
            >
              <h2 className="text-lg sm:text-xl font-bold text-foreground line-clamp-1">
                {problem.title}
              </h2>
            </Link>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={cn("text-[10px]", difficultyClass(problem.difficulty))}>
                {problem.difficulty}
              </Badge>
              {problem.topics.slice(0, 3).map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="text-[10px] bg-muted/50 text-muted-foreground"
                >
                  {t}
                </Badge>
              ))}
              {problem.topics.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{problem.topics.length - 3}
                </span>
              )}
              <span className="ml-1 text-[10px] text-muted-foreground">
                Resets in {countdown}
              </span>
            </div>
          </div>

          {/* Middle: progress */}
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <Flame
                className={cn(
                  "h-5 w-5",
                  streak > 0 ? "text-amber-500" : "text-muted-foreground"
                )}
              />
              <div className="leading-tight">
                <div className="text-base font-bold text-foreground">{streak}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  day streak
                </div>
              </div>
            </div>

            <div className="hidden sm:block min-w-[140px]">
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Weekly goal
                </span>
                <span className="font-semibold text-foreground">
                  {weeklyDone}/{weeklyTarget}
                </span>
              </div>
              <Progress value={weeklyPct} className="h-1.5" />
              <div className="mt-1 text-[10px] text-muted-foreground">
                {completedTotal} all-time
              </div>
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex shrink-0 items-center gap-2">
            {!isCompletedToday && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => void daily.markCompleted()}
                disabled={daily.syncing}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark done
              </Button>
            )}
            <Button asChild size="sm" className="gap-1.5">
              <Link to={`/library/problems/${problem.slug}`}>
                {isCompletedToday ? "Review" : "Start today"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <DailyChallengeSyncStatus
            status={daily.syncStatus}
            error={daily.syncError}
            lastSyncedAt={daily.lastSyncedAt}
            signedIn={daily.syncStatus !== "idle" || !!daily.lastSyncedAt}
          />
        </div>
      </Card>
    </motion.div>
  );
};
