// Drawer surfacing a per-user breakdown of leaderboard score:
// difficulty mix, score components, runtime stats, fastest solves.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
}

function formatRuntime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

const DIFF_META = {
  easy: { label: "Easy", color: "text-emerald-500", bg: "bg-emerald-500", weight: 1 },
  medium: { label: "Medium", color: "text-amber-500", bg: "bg-amber-500", weight: 3 },
  hard: { label: "Hard", color: "text-rose-500", bg: "bg-rose-500", weight: 5 },
} as const;

type DiffKey = keyof typeof DIFF_META;

export function LeaderboardUserDrawer({ open, onOpenChange, userId, rank }: Props) {
  const [data, setData] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
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
  }, [open, userId]);

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
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {error}
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

                {/* Runtime stats */}
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

                {/* Top fastest solves */}
                {data.fastest_problems && data.fastest_problems.length > 0 && (
                  <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Top 5 fastest solves</h3>
                    </div>
                    <ol className="space-y-1.5 list-none p-0 m-0">
                      {data.fastest_problems.map((p, i) => {
                        const meta = DIFF_META[(p.difficulty as DiffKey)] ?? DIFF_META.medium;
                        return (
                          <li key={`${p.problem_slug}-${i}`}>
                            <Link
                              to={`/library/problems/${p.problem_slug}`}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors group"
                            >
                              <span className="w-5 text-center text-xs font-mono text-muted-foreground">
                                {i + 1}
                              </span>
                              <span className="text-sm flex-1 truncate group-hover:text-primary transition-colors">
                                {p.problem_slug}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] h-5", meta.color, "border-current/30")}
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
