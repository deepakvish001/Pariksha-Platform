// Drawer surfacing a per-user breakdown of leaderboard score:
// difficulty mix, score components, runtime stats, fastest solves.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Trophy,
  Target,
  Zap,
  Gauge,
  TrendingUp,
  Clock,
  ExternalLink,
  Sparkles,
  Calendar,
  Lock,
  LogIn,
  ArrowUpDown,
  BarChart3,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface FastestProblem {
  problem_slug: string;
  difficulty: string;
  runtime_ms: number;
}

interface Breakdown {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  problems_solved: number;
  total_accepted: number;
  total_submissions: number;
  acceptance_rate: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  easy_score: number;
  medium_score: number;
  hard_score: number;
  speed_bonus: number;
  weighted_score: number;
  fastest_runtime_ms: number | null;
  slowest_runtime_ms: number | null;
  avg_runtime_ms: number | null;
  fastest_problems: FastestProblem[];
  last_accepted_at: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  rank: number | null;
  isAuthenticated?: boolean;
}

function formatRuntime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

const DIFF_META = {
  easy: { label: "Easy", color: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500/40", chip: "bg-emerald-500/10", weight: 1 },
  medium: { label: "Medium", color: "text-amber-500", bg: "bg-amber-500", border: "border-amber-500/40", chip: "bg-amber-500/10", weight: 3 },
  hard: { label: "Hard", color: "text-rose-500", bg: "bg-rose-500", border: "border-rose-500/40", chip: "bg-rose-500/10", weight: 5 },
} as const;

type DiffKey = keyof typeof DIFF_META;
type SortKey = "runtime" | "difficulty" | "title";
type SortDir = "asc" | "desc";

function DrawerSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Breakdown">
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border/60">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="rounded-xl border border-border/60 p-4 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
        <Separator className="bg-border/40" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border/60 p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
      <div className="rounded-xl border border-border/60 p-4 space-y-2">
        <Skeleton className="h-4 w-40" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function AnonymousGate({ rank }: { rank: number | null }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/40 p-6 text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Sign in to see full breakdown</h3>
          <p className="text-xs text-muted-foreground mt-1.5">
            Detailed score components, runtime stats, and top fastest solves are
            available for signed-in members.
          </p>
        </div>
        {rank !== null && (
          <Badge variant="secondary" className="font-mono text-[10px]">
            Currently ranked #{rank}
          </Badge>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <Button asChild size="sm" className="w-full">
            <Link to="/auth">
              <LogIn className="h-3.5 w-3.5 mr-1.5" />
              Sign in to view breakdown
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="w-full">
            <Link to="/library/problems/leaderboard">
              Continue browsing leaderboard
            </Link>
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-center text-muted-foreground">
        Join Parikshaa to track your own weighted score, speed bonus, and rank.
      </p>
    </div>
  );
}

export function LeaderboardUserDrawer({
  open,
  onOpenChange,
  userId,
  rank,
  isAuthenticated = true,
}: Props) {
  const [data, setData] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("runtime");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    if (!open || !userId) return;
    if (!isAuthenticated) {
      // Anonymous users: skip RPC entirely, show gate.
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    (async () => {
      const { data: rows, error } = await supabase.rpc(
        "get_coding_leaderboard_user_breakdown" as never,
        { _user_id: userId } as never,
      );
      if (cancelled) return;
      if (error) {
        setError(error.message);
        toast.error("Couldn't load breakdown", {
          description: error.message,
        });
      } else if (rows && (rows as Breakdown[]).length > 0) {
        setData((rows as Breakdown[])[0]);
      } else {
        setError("This user has hidden their leaderboard details.");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId, isAuthenticated]);

  const sortedFastest = useMemo(() => {
    if (!data?.fastest_problems) return [];
    const arr = [...data.fastest_problems];
    const diffOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "runtime") cmp = (a.runtime_ms ?? 0) - (b.runtime_ms ?? 0);
      else if (sortKey === "difficulty")
        cmp = (diffOrder[a.difficulty] ?? 1) - (diffOrder[b.difficulty] ?? 1);
      else cmp = a.problem_slug.localeCompare(b.problem_slug);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [data?.fastest_problems, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(k === "runtime" ? "asc" : "asc");
    }
  };

  const renderDifficultyBar = (key: DiffKey, count: number, total: number) => {
    const meta = DIFF_META[key];
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className={cn("font-medium", meta.color)}>{meta.label}</span>
          <span className="tabular-nums text-muted-foreground">
            {count} <span className="opacity-60">× {meta.weight} = {count * meta.weight}</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn("h-full rounded-full", meta.bg)}
          />
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col gap-0"
      >
        <SheetHeader className="p-5 pb-3 border-b border-border/50 space-y-0">
          <SheetTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Score Breakdown
          </SheetTitle>
          <SheetDescription className="text-xs">
            How this rank is built — by difficulty, speed, and consistency.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-5">
            {!isAuthenticated ? (
              <AnonymousGate rank={rank} />
            ) : loading ? (
              <DrawerSkeleton />
            ) : error ? (
              <div className="space-y-3 py-8">
                <p className="text-center text-sm text-muted-foreground">
                  {error}
                </p>
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Trigger refetch by toggling open via parent isn't trivial;
                      // re-run effect by clearing state then setting.
                      if (userId) {
                        setError(null);
                        setLoading(true);
                        supabase
                          .rpc(
                            "get_coding_leaderboard_user_breakdown" as never,
                            { _user_id: userId } as never,
                          )
                          .then(({ data: rows, error }) => {
                            if (error) {
                              setError(error.message);
                              toast.error("Retry failed", {
                                description: error.message,
                              });
                            } else if (rows && (rows as Breakdown[]).length > 0) {
                              setData((rows as Breakdown[])[0]);
                            } else {
                              setError(
                                "This user has hidden their leaderboard details.",
                              );
                            }
                            setLoading(false);
                          });
                      }
                    }}
                  >
                    Try again
                  </Button>
                </div>
              </div>
            ) : data ? (
              <>
                {/* Identity card */}
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card/40">
                  <Avatar className="h-12 w-12 ring-2 ring-background">
                    <AvatarImage src={data.avatar_url ?? undefined} alt={data.display_name} />
                    <AvatarFallback>
                      {data.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{data.display_name}</p>
                      {rank !== null && (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          #{rank}
                        </Badge>
                      )}
                    </div>
                    {data.username && (
                      <p className="text-xs text-muted-foreground truncate">
                        @{data.username}
                      </p>
                    )}
                  </div>
                  {data.username && (
                    <Button asChild size="sm" variant="outline" className="shrink-0">
                      <Link to={`/u/${data.username}`}>
                        Profile <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Headline metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <MetricTile
                    icon={Sparkles}
                    label="Score"
                    value={Math.round(data.weighted_score).toString()}
                    accent
                  />
                  <MetricTile
                    icon={Target}
                    label="Solved"
                    value={data.problems_solved.toString()}
                  />
                  <MetricTile
                    icon={TrendingUp}
                    label="Accepted"
                    value={`${data.acceptance_rate.toFixed(0)}%`}
                    sublabel={`${data.total_accepted}/${data.total_submissions}`}
                  />
                </div>

                {/* Difficulty breakdown pills */}
                <div className="grid grid-cols-3 gap-2">
                  {(["easy", "medium", "hard"] as DiffKey[]).map((k) => {
                    const meta = DIFF_META[k];
                    const count =
                      k === "easy"
                        ? data.easy_solved
                        : k === "medium"
                          ? data.medium_solved
                          : data.hard_solved;
                    const score =
                      k === "easy"
                        ? data.easy_score
                        : k === "medium"
                          ? data.medium_score
                          : data.hard_score;
                    return (
                      <div
                        key={k}
                        className={cn(
                          "rounded-xl border p-3 text-center space-y-0.5",
                          meta.border,
                          meta.chip,
                        )}
                      >
                        <p className={cn("text-[10px] uppercase tracking-wider font-semibold", meta.color)}>
                          {meta.label}
                        </p>
                        <p className="text-lg font-bold tabular-nums leading-tight">
                          {count}
                        </p>
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          +{Number(score).toFixed(0)} pts
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Score breakdown */}
                <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Weighted score formula</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    solved × difficulty (easy 1, medium 3, hard 5) + speed bonus
                  </p>
                  <Separator className="bg-border/40" />
                  <div className="space-y-3">
                    {renderDifficultyBar("easy", data.easy_solved, data.problems_solved)}
                    {renderDifficultyBar("medium", data.medium_solved, data.problems_solved)}
                    {renderDifficultyBar("hard", data.hard_solved, data.problems_solved)}
                  </div>
                  <Separator className="bg-border/40" />
                  <ScoreLine
                    label="Easy points"
                    value={data.easy_score}
                    color={DIFF_META.easy.color}
                  />
                  <ScoreLine
                    label="Medium points"
                    value={data.medium_score}
                    color={DIFF_META.medium.color}
                  />
                  <ScoreLine
                    label="Hard points"
                    value={data.hard_score}
                    color={DIFF_META.hard.color}
                  />
                  <ScoreLine
                    label="Speed bonus"
                    value={data.speed_bonus}
                    icon={Zap}
                    color="text-sky-500"
                  />
                  <Separator className="bg-border/40" />
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-sm">Total weighted score</span>
                    <span className="tabular-nums text-base">
                      {data.weighted_score.toFixed(2)}
                    </span>
                  </div>
                </section>

                {/* Runtime stats with mini bar chart */}
                <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-sky-500" />
                    <h3 className="text-sm font-semibold">Runtime stats</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <RuntimeTile
                      label="Fastest"
                      value={formatRuntime(data.fastest_runtime_ms)}
                      tone="text-emerald-500"
                    />
                    <RuntimeTile
                      label="Average"
                      value={formatRuntime(
                        data.avg_runtime_ms !== null
                          ? Number(data.avg_runtime_ms)
                          : null,
                      )}
                      tone="text-foreground"
                    />
                    <RuntimeTile
                      label="Slowest"
                      value={formatRuntime(data.slowest_runtime_ms)}
                      tone="text-amber-500"
                    />
                  </div>

                  {/* Mini bar chart */}
                  <RuntimeBarChart
                    fastest={data.fastest_runtime_ms}
                    average={
                      data.avg_runtime_ms !== null
                        ? Number(data.avg_runtime_ms)
                        : null
                    }
                    slowest={data.slowest_runtime_ms}
                  />

                  {data.avg_runtime_ms !== null && data.slowest_runtime_ms ? (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Speed efficiency
                      </p>
                      <Progress
                        value={Math.max(
                          0,
                          Math.min(
                            100,
                            ((2000 - Number(data.avg_runtime_ms)) / 2000) * 100,
                          ),
                        )}
                        className="h-1.5"
                      />
                    </div>
                  ) : null}
                </section>

                {/* Top fastest solves — sortable */}
                {data.fastest_problems && data.fastest_problems.length > 0 && (
                  <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">Top 5 fastest solves</h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            <ArrowUpDown className="h-3 w-3 mr-1" />
                            Sort
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleSort("runtime")}>
                            Runtime {sortKey === "runtime" && (sortDir === "asc" ? "↑" : "↓")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleSort("difficulty")}>
                            Difficulty {sortKey === "difficulty" && (sortDir === "asc" ? "↑" : "↓")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleSort("title")}>
                            Title {sortKey === "title" && (sortDir === "asc" ? "↑" : "↓")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span>#</span>
                      <span>Problem</span>
                      <span>Difficulty</span>
                      <span className="text-right">Runtime</span>
                    </div>
                    <ol className="space-y-1.5 list-none p-0 m-0">
                      {sortedFastest.map((p, i) => {
                        const meta = DIFF_META[(p.difficulty as DiffKey)] ?? DIFF_META.medium;
                        return (
                          <li key={`${p.problem_slug}-${i}`}>
                            <Link
                              to={`/library/problems/${p.problem_slug}`}
                              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors group"
                            >
                              <span className="w-5 text-center text-xs font-mono text-muted-foreground">
                                {i + 1}
                              </span>
                              <span className="text-sm truncate group-hover:text-primary transition-colors">
                                {p.problem_slug}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] h-5", meta.color, meta.border)}
                              >
                                {meta.label}
                              </Badge>
                              <span className="text-xs font-mono tabular-nums text-muted-foreground w-14 text-right">
                                {formatRuntime(p.runtime_ms)}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                )}

                {data.last_accepted_at && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Last accepted{" "}
                    {formatDistanceToNow(new Date(data.last_accepted_at), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </>
            ) : null}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-center",
        accent
          ? "border-primary/40 bg-primary/5"
          : "border-border/60 bg-card/40",
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 mx-auto mb-1",
          accent ? "text-primary" : "text-muted-foreground",
        )}
      />
      <p className="text-base font-bold tabular-nums leading-tight">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {sublabel && (
        <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
          {sublabel}
        </p>
      )}
    </div>
  );
}

function ScoreLine({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon?: typeof Zap;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={cn("inline-flex items-center gap-1.5", color)}>
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      <span className="font-mono tabular-nums">+{Number(value).toFixed(2)}</span>
    </div>
  );
}

function RuntimeTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-2.5 text-center">
      <p className={cn("text-sm font-semibold tabular-nums", tone)}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </p>
    </div>
  );
}

function RuntimeBarChart({
  fastest,
  average,
  slowest,
}: {
  fastest: number | null;
  average: number | null;
  slowest: number | null;
}) {
  const values = [
    { key: "fastest", label: "Fastest", value: fastest, color: "bg-emerald-500" },
    { key: "average", label: "Average", value: average, color: "bg-sky-500" },
    { key: "slowest", label: "Slowest", value: slowest, color: "bg-amber-500" },
  ];
  const max = Math.max(
    ...values.map((v) => (typeof v.value === "number" ? v.value : 0)),
    1,
  );
  const hasAny = values.some((v) => typeof v.value === "number" && v.value > 0);
  if (!hasAny) return null;

  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <BarChart3 className="h-3 w-3 text-muted-foreground" />
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Runtime distribution
        </p>
      </div>
      <div className="space-y-1.5">
        {values.map((v) => {
          const pct =
            typeof v.value === "number" && v.value > 0
              ? Math.max(4, (v.value / max) * 100)
              : 0;
          return (
            <div key={v.key} className="flex items-center gap-2">
              <span className="w-14 text-[10px] text-muted-foreground">
                {v.label}
              </span>
              <div className="flex-1 h-3 rounded-sm bg-muted/50 overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={cn("h-full rounded-sm", v.color)}
                />
              </div>
              <span className="w-14 text-right text-[10px] font-mono tabular-nums text-muted-foreground">
                {formatRuntime(v.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
