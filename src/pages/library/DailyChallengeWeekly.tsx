import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Circle,
  Flame,
  Trophy,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCodingAttemptStats } from "@/hooks/useCodingAttemptStats";
import {
  useDailyChallenge,
  pickProblemForDate,
  toDateKey,
} from "@/hooks/useDailyChallenge";
import {
  useDailyLeaderboard,
  useDailyLeaderboardOptIn,
} from "@/hooks/useDailyLeaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { DailyChallengeSyncStatus } from "@/components/library/coding/DailyChallengeSyncStatus";

const buildLastNDays = (n: number) => {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(toDateKey(d));
  }
  return days;
};

const formatDate = (key: string) => {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

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

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const DailyChallengeWeekly = () => {
  const { user } = useAuth();
  const { solved } = useCodingAttemptStats();
  const daily = useDailyChallenge(solved);
  const { entries, loading: lbLoading, reload: reloadLeaderboard } = useDailyLeaderboard(50);
  const baseOptin = useDailyLeaderboardOptIn();
  const optin = useMemo(
    () => ({
      ...baseOptin,
      setOptIn: async (v: boolean, name?: string | null) => {
        await baseOptin.setOptIn(v, name);
        await reloadLeaderboard();
      },
    }),
    [baseOptin, reloadLeaderboard],
  );

  const [draftName, setDraftName] = useState<string>(optin.displayName ?? "");

  const days = useMemo(() => buildLastNDays(7), []);
  const completedDateSet = useMemo(
    () => new Set(daily.recentCompletions.map((c) => c.date)),
    [daily.recentCompletions],
  );

  const completedThisWeek = days.filter((d) => completedDateSet.has(d)).length;
  const myStreak = daily.streak;

  const myRank = useMemo(() => {
    if (!user) return null;
    const idx = entries.findIndex((e) => e.user_id === user.id);
    return idx >= 0 ? idx + 1 : null;
  }, [entries, user]);

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-5xl">
      <Helmet>
        <title>Daily Challenge — Weekly Review | Byteskill</title>
        <meta
          name="description"
          content="Review your last 7 days of coding daily challenges, track your streak, and see the opt-in daily leaderboard."
        />
      </Helmet>

      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-5"
      >
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-3 -ml-2 h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Link to="/library/problems">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to problems
          </Link>
        </Button>
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-5 w-5 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold">Daily Challenge — Weekly Review</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Your last 7 daily challenges, your current streak, and the opt-in leaderboard.
        </p>
        <div className="mt-3">
          <DailyChallengeSyncStatus
            status={daily.syncStatus}
            error={daily.syncError}
            lastSyncedAt={daily.lastSyncedAt}
            signedIn={!!user}
          />
        </div>
      </motion.header>

      {/* Summary tiles */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">This week</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{completedThisWeek}/7</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Flame className="h-3 w-3 text-amber-500" /> Streak
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{myStreak}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">All-time</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{daily.completedTotal}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Today</div>
          <div className="mt-1 flex items-center gap-1.5">
            {daily.isCompletedToday ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-semibold">Done</span>
              </>
            ) : (
              <>
                <Circle className="h-5 w-5 text-muted-foreground/60" />
                <span className="text-sm font-semibold">Pending</span>
              </>
            )}
          </div>
        </Card>
      </section>

      {/* 7-day list */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Last 7 days
        </h2>
        <Card className="divide-y divide-border/60 overflow-hidden">
          {days.map((key, idx) => {
            const problem = pickProblemForDate(key);
            const done = completedDateSet.has(key);
            const isToday = idx === 0;
            return (
              <div
                key={key}
                className="flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/30 transition-colors"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                    done
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                      : "border-border/60 bg-muted/30 text-muted-foreground/60",
                  )}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatDate(key)}
                    </span>
                    {isToday && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                        Today
                      </Badge>
                    )}
                  </div>
                  <Link
                    to={`/library/problems/${problem.slug}`}
                    className="mt-0.5 block truncate text-sm font-semibold hover:text-primary hover:underline underline-offset-2"
                  >
                    {problem.title}
                  </Link>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] hidden sm:inline-flex", difficultyClass(problem.difficulty))}
                >
                  {problem.difficulty}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] hidden sm:inline-flex",
                    done
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                      : "text-muted-foreground",
                  )}
                >
                  {done ? "Completed" : "Open"}
                </Badge>
                <Button
                  asChild
                  size="sm"
                  variant={done ? "outline" : "secondary"}
                  className="h-8 gap-1 text-xs"
                >
                  <Link
                    to={`/library/problems/${problem.slug}`}
                    aria-label={`Go to problem ${problem.title}`}
                  >
                    Go to problem
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </Card>
      </section>

      {/* Leaderboard opt-in + table */}
      <section>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            Daily leaderboard
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Opt-in only • Ranked by streak, then weekly progress
          </span>
        </div>

        {!user ? (
          <Card className="p-4 text-sm text-muted-foreground">
            <Sparkles className="inline h-4 w-4 mr-1 text-primary" />
            Sign in to opt in and appear on the leaderboard.
          </Card>
        ) : (
          <Card className="p-4 mb-3">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold flex items-center gap-2">
                  {optin.optedIn ? "You're on the leaderboard" : "Join the leaderboard"}
                  {optin.optedIn && myRank !== null && (
                    <Badge
                      variant="outline"
                      className="h-5 px-1.5 text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-500"
                    >
                      <Trophy className="h-3 w-3 mr-1" />
                      Rank #{myRank}
                    </Badge>
                  )}
                  {optin.optedIn && myRank === null && entries.length > 0 && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">
                      Unranked
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {optin.optedIn
                    ? "Other learners can see your display name and streak. Toggle off to leave anytime."
                    : "Show your daily streak and weekly progress to other learners."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Display name"
                  className="h-8 w-40 text-xs"
                  maxLength={40}
                />
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <span>{optin.optedIn ? "Enabled" : "Disabled"}</span>
                  <Switch
                    checked={optin.optedIn}
                    disabled={optin.loading}
                    onCheckedChange={(v) => optin.setOptIn(v, draftName.trim() || null)}
                    aria-label="Toggle leaderboard opt-in"
                  />
                </label>
              </div>
            </div>
          </Card>
        )}

        <Card className="overflow-hidden">
          {lbLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold">No one has opted in yet</div>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                The daily leaderboard is empty. Opt in to be the very first learner ranked here — your streak will appear instantly.
              </p>
              {user ? (
                <Button
                  size="sm"
                  className="mt-4 h-8 gap-1.5 text-xs"
                  disabled={optin.loading || optin.optedIn}
                  onClick={() => optin.setOptIn(true, draftName.trim() || null)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {optin.optedIn ? "You're opted in" : "Opt me in & be first"}
                </Button>
              ) : (
                <Button asChild size="sm" className="mt-4 h-8 gap-1.5 text-xs">
                  <Link to="/auth">
                    <Sparkles className="h-3.5 w-3.5" />
                    Sign in to opt in
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <ol className="divide-y divide-border/60">
              {entries.map((entry, idx) => {
                const linkable = !!entry.username;
                const RowContent = (
                  <>
                    <div
                      className={cn(
                        "w-6 text-center text-xs font-bold tabular-nums",
                        idx === 0 && "text-amber-500",
                        idx === 1 && "text-zinc-400",
                        idx === 2 && "text-orange-600",
                        idx > 2 && "text-muted-foreground",
                      )}
                    >
                      {idx + 1}
                    </div>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={entry.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {initials(entry.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium flex items-center gap-1.5">
                        <span className="truncate">{entry.display_name}</span>
                        {user?.id === entry.user_id && (
                          <span className="text-[10px] text-primary">(You)</span>
                        )}
                        {linkable && (
                          <span className="text-[10px] text-muted-foreground/70">
                            @{entry.username}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground tabular-nums">
                        {entry.weekly_completions}/7 this week • {entry.total_completions} all-time
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Flame className="h-4 w-4" />
                      <span className="text-sm font-bold tabular-nums">{entry.current_streak}</span>
                    </div>
                  </>
                );
                const baseClass = cn(
                  "flex items-center gap-3 p-3 sm:p-3.5",
                  user?.id === entry.user_id && "bg-primary/5",
                  linkable && "hover:bg-muted/30 transition-colors cursor-pointer",
                );
                return (
                  <li key={entry.user_id}>
                    {linkable ? (
                      <Link
                        to={`/u/${entry.username}`}
                        className={baseClass}
                        aria-label={`View ${entry.display_name}'s profile and weekly summary`}
                      >
                        {RowContent}
                      </Link>
                    ) : (
                      <div className={baseClass}>{RowContent}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </section>
    </div>
  );
};

export default DailyChallengeWeekly;
