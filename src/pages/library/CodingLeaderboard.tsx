// Public global coding leaderboard page.
// Accessible to guests; ranks users by a weighted score that combines
// unique problems solved (weighted by difficulty) with a small speed bonus.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Crown,
  Medal,
  Trophy,
  Search,
  Users,
  Zap,
  Target,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LogIn,
  EyeOff,
  CalendarDays,
  Sun,
  Hourglass,
  ListChecks,
  Play,
  ArrowDown,
  ArrowUp,
  ArrowDownRight,
  Minus,
  User as UserIcon,
  Filter,
  Loader2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCodingLeaderboard,
  useCodingLeaderboardStats,
  useCodingLeaderboardUserRank,
  useCodingLeaderboardRankDelta,
  snapshotMyCodingLeaderboardRank,
  type CodingLeaderboardRow,
  type LeaderboardWindow,
  type LeaderboardDifficulty,
  type CodingLeaderboardRankDelta,
} from "@/hooks/useCodingLeaderboard";
import { LeaderboardUserDrawer } from "@/components/library/coding/LeaderboardUserDrawer";

const PAGE_SIZE = 50;
const VALID_WINDOWS: LeaderboardWindow[] = ["all", "week", "today"];
const VALID_DIFFICULTIES = ["easy", "medium", "hard"] as const;

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return (
    <span className="text-sm font-mono font-medium text-muted-foreground w-6 text-center">
      {rank}
    </span>
  );
}

function getRankBg(rank: number) {
  if (rank === 1)
    return "bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/5 border-yellow-500/40 hover:border-yellow-500/60";
  if (rank === 2)
    return "bg-gradient-to-r from-slate-400/10 via-slate-500/10 to-slate-400/5 border-slate-400/40 hover:border-slate-400/60";
  if (rank === 3)
    return "bg-gradient-to-r from-amber-600/10 via-orange-600/10 to-amber-600/5 border-amber-600/40 hover:border-amber-600/60";
  return "bg-card/60 backdrop-blur border-border/50 hover:border-border";
}

function formatRuntime(ms: number | null): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

// ─── Rank delta indicator ──────────────────────────────────────────────
function DeltaBadge({
  delta,
  label,
  size = "sm",
}: {
  delta: number | null | undefined;
  label: string;
  size?: "sm" | "xs";
}) {
  if (delta === null || delta === undefined) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md text-muted-foreground",
              size === "xs" ? "text-[10px] px-1" : "text-[11px] px-1.5 py-0.5",
            )}
          >
            <Minus className="h-3 w-3" />
            <span className="opacity-70">new</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>No data {label} yet — check back soon</TooltipContent>
      </Tooltip>
    );
  }
  if (delta === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md text-muted-foreground",
              size === "xs" ? "text-[10px] px-1" : "text-[11px] px-1.5 py-0.5",
            )}
          >
            <Minus className="h-3 w-3" />0
          </span>
        </TooltipTrigger>
        <TooltipContent>No change {label}</TooltipContent>
      </Tooltip>
    );
  }
  const improved = delta > 0;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md font-mono tabular-nums",
            size === "xs" ? "text-[10px] px-1" : "text-[11px] px-1.5 py-0.5",
            improved
              ? "text-emerald-500 bg-emerald-500/10"
              : "text-rose-500 bg-rose-500/10",
          )}
        >
          {improved ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {Math.abs(delta)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {improved
          ? `Climbed ${Math.abs(delta)} ${Math.abs(delta) === 1 ? "spot" : "spots"} ${label}`
          : `Dropped ${Math.abs(delta)} ${Math.abs(delta) === 1 ? "spot" : "spots"} ${label}`}
      </TooltipContent>
    </Tooltip>
  );
}

function PodiumCard({
  row,
  rank,
  onSelect,
}: {
  row: CodingLeaderboardRow;
  rank: 1 | 2 | 3;
  onSelect: (row: CodingLeaderboardRow) => void;
}) {
  const heights = { 1: "md:translate-y-0", 2: "md:translate-y-4", 3: "md:translate-y-8" };
  const orders = { 1: "md:order-2", 2: "md:order-1", 3: "md:order-3" };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08, type: "spring", stiffness: 100 }}
      className={cn("flex-1", heights[rank], orders[rank])}
    >
      <button
        type="button"
        onClick={() => onSelect(row)}
        aria-label={`View score breakdown for ${row.display_name}, rank ${rank}`}
        className={cn(
          "w-full block rounded-xl border-2 p-5 text-center transition-all hover:scale-[1.02] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          getRankBg(rank),
        )}
      >
        <div className="flex justify-center mb-3">{getRankIcon(rank)}</div>
        <Avatar className="h-16 w-16 mx-auto mb-3 ring-2 ring-background">
          <AvatarImage src={row.avatar_url ?? undefined} alt={row.display_name} />
          <AvatarFallback>
            {row.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="font-semibold truncate">{row.display_name}</p>
        {row.username && (
          <p className="text-xs text-muted-foreground truncate">@{row.username}</p>
        )}
        <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
          <p className="text-2xl font-bold tabular-nums">
            {Math.round(row.weighted_score)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Score
          </p>
          <div className="flex justify-center gap-3 text-xs text-muted-foreground pt-1">
            <span className="inline-flex items-center gap-1">
              <Target className="h-3 w-3" />
              {row.problems_solved}
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {formatRuntime(row.fastest_avg_runtime)}
            </span>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  loading: boolean;
}) {
  return (
    <Card className="bg-card/60 backdrop-blur border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="h-6 w-16 mt-1" />
            ) : (
              <p className="text-xl font-bold tabular-nums">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PodiumSkeleton({ rank }: { rank: 1 | 2 | 3 }) {
  const heights = { 1: "md:translate-y-0", 2: "md:translate-y-4", 3: "md:translate-y-8" };
  return (
    <div className={cn("flex-1", heights[rank])}>
      <div className="rounded-xl border-2 border-border/40 bg-card/40 p-5 text-center">
        <Skeleton className="h-5 w-5 rounded-full mx-auto mb-3" />
        <Skeleton className="h-16 w-16 rounded-full mx-auto mb-3" />
        <Skeleton className="h-4 w-28 mx-auto" />
        <Skeleton className="h-3 w-20 mx-auto mt-1" />
        <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
          <Skeleton className="h-7 w-16 mx-auto" />
          <Skeleton className="h-2.5 w-12 mx-auto" />
          <div className="flex justify-center gap-3 pt-1">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-stretch gap-2 rounded-lg border border-border/40 bg-card/30">
      <div className="flex-1 min-w-0 flex items-center gap-3 p-3">
        <Skeleton className="h-5 w-5 rounded-full shrink-0" />
        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="hidden sm:flex items-center gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1 text-center">
              <Skeleton className="h-3.5 w-8 mx-auto" />
              <Skeleton className="h-2.5 w-10 mx-auto" />
            </div>
          ))}
        </div>
        <Skeleton className="h-5 w-12 rounded-md" />
      </div>
      <div className="hidden md:flex items-center gap-1 px-2 border-l border-border/40">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>
    </div>
  );
}

function EmptyState({
  window,
  search,
  isAuthed,
  onClearSearch,
}: {
  window: LeaderboardWindow;
  search: string;
  isAuthed: boolean;
  onClearSearch?: () => void;
}) {
  if (search) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Search className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium text-foreground">
          No solvers match “{search}”
        </p>
        <p className="text-xs mt-1">
          Try a different username, or clear the search to see everyone.
        </p>
        {onClearSearch && (
          <Button size="sm" variant="outline" className="mt-3" onClick={onClearSearch}>
            Clear search
          </Button>
        )}
      </div>
    );
  }

  const config: Record<
    LeaderboardWindow,
    { icon: typeof Trophy; title: string; sub: string }
  > = {
    today: {
      icon: Sun,
      title: "No accepted solutions yet today",
      sub: "Be the first to log an Accepted submission today and claim the top spot.",
    },
    week: {
      icon: CalendarDays,
      title: "Quiet week so far",
      sub: "No problems have been solved this week. A fresh leaderboard is up for grabs.",
    },
    all: {
      icon: Hourglass,
      title: "Leaderboard is just getting started",
      sub: "No ranked solvers yet. Solve any problem to get on the board.",
    },
  };
  const { icon: Icon, title, sub } = config[window];

  return (
    <div className="text-center py-12">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{sub}</p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button size="sm" asChild>
          <Link to="/library/problems">Solve a problem</Link>
        </Button>
        {!isAuthed && (
          <Button size="sm" variant="outline" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Per-row jump links to runs / submissions ───
function RowQuickLinks({ row, isYou }: { row: CodingLeaderboardRow; isYou: boolean }) {
  const [pendingRuns, setPendingRuns] = useState(false);
  const [pendingSubs, setPendingSubs] = useState(false);

  const runsHref = isYou
    ? "/learn/submissions?tab=runs"
    : row.username
      ? `/u/${row.username}#runs`
      : null;
  const subsHref = isYou
    ? "/learn/submissions"
    : row.username
      ? `/u/${row.username}#submissions`
      : null;

  const runsTooltip = !runsHref
    ? "This user has no public profile"
    : isYou
      ? "Open your runs"
      : `Open ${row.display_name}'s runs (on profile)`;
  const subsTooltip = !subsHref
    ? "This user has no public profile"
    : isYou
      ? "Open your submissions"
      : `Open ${row.display_name}'s submissions (on profile)`;

  return (
    <div className="hidden md:flex items-center gap-0.5 pr-1 pl-1 border-l border-border/40 shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              asChild={!!runsHref && !pendingRuns}
              disabled={!runsHref}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={runsTooltip}
              onClick={() => {
                if (runsHref) {
                  setPendingRuns(true);
                  // Reset after a short window in case the route doesn't unmount us
                  window.setTimeout(() => setPendingRuns(false), 1200);
                }
              }}
            >
              {runsHref && !pendingRuns ? (
                <Link to={runsHref}>
                  <Play className="h-3.5 w-3.5" />
                </Link>
              ) : pendingRuns ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{runsTooltip}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              asChild={!!subsHref && !pendingSubs}
              disabled={!subsHref}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={subsTooltip}
              onClick={() => {
                if (subsHref) {
                  setPendingSubs(true);
                  window.setTimeout(() => setPendingSubs(false), 1200);
                }
              }}
            >
              {subsHref && !pendingSubs ? (
                <Link to={subsHref}>
                  <ListChecks className="h-3.5 w-3.5" />
                </Link>
              ) : pendingSubs ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ListChecks className="h-3.5 w-3.5" />
              )}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{subsTooltip}</TooltipContent>
      </Tooltip>
    </div>
  );
}

// ─── Your-rank summary card with jump-to-row + delta ───
function YourRankCard({
  loading,
  rank,
  delta,
  window,
  onJump,
  onOpenBreakdown,
}: {
  loading: boolean;
  rank: import("@/hooks/useCodingLeaderboard").CodingLeaderboardUserRank | null;
  delta: CodingLeaderboardRankDelta | null;
  window: LeaderboardWindow;
  onJump: () => void;
  onOpenBreakdown: () => void;
}) {
  const windowLabel =
    window === "today" ? "today" : window === "week" ? "this week" : "all-time";

  if (loading) {
    return (
      <Card className="bg-primary/5 border-primary/30">
        <CardContent className="p-4 flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-9 w-28" />
        </CardContent>
      </Card>
    );
  }

  if (!rank) {
    return (
      <Card className="bg-muted/30 border-dashed border-border/60">
        <CardContent className="p-4 flex items-center gap-3 flex-wrap">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
            <UserIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              You're not ranked {windowLabel} yet
            </p>
            <p className="text-xs text-muted-foreground">
              Get an Accepted submission {windowLabel === "all-time" ? "" : windowLabel} to appear on the board.
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/library/problems">Solve a problem</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const pct =
    rank.total_ranked > 0
      ? Math.max(1, Math.round((rank.rank / rank.total_ranked) * 100))
      : null;

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30">
      <CardContent className="p-4 flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-primary/40">
            <AvatarImage src={rank.avatar_url ?? undefined} alt={rank.display_name} />
            <AvatarFallback>
              {rank.display_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Badge
            variant="secondary"
            className="absolute -bottom-1 -right-1 px-1.5 h-5 text-[10px] font-mono shadow"
          >
            #{rank.rank}
          </Badge>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate">
              Your rank — {windowLabel}
            </p>
            {pct !== null && (
              <Badge variant="outline" className="text-[10px] h-4">
                Top {pct}%
              </Badge>
            )}
            <DeltaBadge delta={delta?.delta_day} label="since yesterday" />
            <DeltaBadge delta={delta?.delta_week} label="since last week" />
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {rank.problems_solved} solved · {Math.round(rank.weighted_score)} score
            {rank.fastest_avg_runtime
              ? ` · avg ${
                  rank.fastest_avg_runtime < 1000
                    ? `${Math.round(rank.fastest_avg_runtime)} ms`
                    : `${(rank.fastest_avg_runtime / 1000).toFixed(2)} s`
                }`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={onOpenBreakdown}>
            Breakdown
          </Button>
          <Button size="sm" onClick={onJump}>
            <ArrowDown className="h-3.5 w-3.5 mr-1" />
            Jump to me
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── URL <-> state helpers ─────────────────────────────────────────────
function parseWindow(v: string | null): LeaderboardWindow {
  return VALID_WINDOWS.includes(v as LeaderboardWindow)
    ? (v as LeaderboardWindow)
    : "all";
}
function parseDifficulty(v: string | null): LeaderboardDifficulty {
  return v && (VALID_DIFFICULTIES as readonly string[]).includes(v)
    ? (v as LeaderboardDifficulty)
    : null;
}
function parsePage(v: string | null): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export default function CodingLeaderboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // ─── State driven by URL ─────────────────────────────────────────────
  const window = parseWindow(searchParams.get("window"));
  const page = parsePage(searchParams.get("page"));
  const search = (searchParams.get("q") ?? "").trim();
  const difficulty = parseDifficulty(searchParams.get("diff"));
  const acceptedOnly = searchParams.get("accepted") !== "0";
  const minScoreParam = searchParams.get("minScore");
  const minScore = (() => {
    const n = Number(minScoreParam);
    return Number.isFinite(n) && n > 0 ? n : 0;
  })();

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);
  const [minScoreInput, setMinScoreInput] = useState(minScore ? String(minScore) : "");
  useEffect(() => setMinScoreInput(minScore ? String(minScore) : ""), [minScore]);

  const [drawerUser, setDrawerUser] = useState<{ id: string; rank: number } | null>(null);

  const updateParams = (
    patch: Record<string, string | null>,
    options?: { resetPage?: boolean },
  ) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (options?.resetPage) next.delete("page");
        for (const [k, v] of Object.entries(patch)) {
          if (v === null || v === "") next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: false },
    );
  };

  const { rows, loading } = useCodingLeaderboard({
    window,
    page,
    pageSize: PAGE_SIZE,
    search,
    difficulty,
    acceptedOnly,
  });
  const { stats, loading: statsLoading } = useCodingLeaderboardStats();

  // Client-side min-score filter (RPC doesn't support it).
  const filteredRows = useMemo(
    () => (minScore > 0 ? rows.filter((r) => Math.round(r.weighted_score) >= minScore) : rows),
    [rows, minScore],
  );

  // Dynamic upper bound for the min-score slider — keep it sensible relative
  // to actual data. Round up to nearest 50 for nicer ticks.
  const scoreSliderMax = useMemo(() => {
    const top = rows.reduce((m, r) => Math.max(m, Math.round(r.weighted_score)), 0);
    const padded = Math.max(top, minScore, 50);
    return Math.ceil(padded / 50) * 50;
  }, [rows, minScore]);

  const podium = useMemo(
    () => (page === 1 && !search && !difficulty ? filteredRows.slice(0, 3) : []),
    [filteredRows, page, search, difficulty],
  );
  const rest = useMemo(
    () => (page === 1 && !search && !difficulty ? filteredRows.slice(3) : filteredRows),
    [filteredRows, page, search, difficulty],
  );

  const openBreakdown = (row: CodingLeaderboardRow) =>
    setDrawerUser({ id: row.user_id, rank: row.rank });

  const { data: youRank, loading: youLoading } = useCodingLeaderboardUserRank(
    user?.id,
    window,
  );
  const { data: youDelta } = useCodingLeaderboardRankDelta(user?.id, window);

  // Snapshot the user's current rank once per session for tomorrow's delta.
  useEffect(() => {
    if (user?.id) {
      void snapshotMyCodingLeaderboardRank();
    }
  }, [user?.id]);

  const listRef = useRef<HTMLOListElement | null>(null);
  const youRowRef = useRef<HTMLLIElement | null>(null);

  const youOnPage = useMemo(
    () => (user ? rows.some((r) => r.user_id === user.id) : false),
    [rows, user],
  );

  const [pendingJump, setPendingJump] = useState(false);

  const handleJumpToMe = () => {
    if (!user || !youRank) return;
    if (!youOnPage) {
      const targetPage = Math.max(1, Math.ceil(youRank.rank / PAGE_SIZE));
      if (targetPage !== page) {
        updateParams(
          { q: null, diff: null, page: String(targetPage) },
        );
        setPendingJump(true);
        return;
      }
    }
    requestAnimationFrame(() => {
      youRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      youRowRef.current?.focus({ preventScroll: true });
    });
  };

  useEffect(() => {
    if (!pendingJump || loading) return;
    if (youRowRef.current) {
      requestAnimationFrame(() => {
        youRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        youRowRef.current?.focus({ preventScroll: true });
        setPendingJump(false);
      });
    }
  }, [pendingJump, loading, rows]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchInput.trim() || null }, { resetPage: true });
  };

  const windowLabel =
    window === "today" ? "today" : window === "week" ? "this week" : "of all time";
  const windowRangeLabel =
    window === "today" ? "Today" : window === "week" ? "Last 7 days" : "All time";
  const windowRangeSub =
    window === "today"
      ? "Accepted submissions from today (UTC)"
      : window === "week"
        ? "Accepted submissions in the last 7 days"
        : "All accepted submissions ever";

  // Pagination math — when total is unknown (server doesn't return count),
  // assume there's a next page only if the current page is full.
  const hasPrev = page > 1;
  const hasNext = rows.length === PAGE_SIZE;

  return (
    <TooltipProvider delayDuration={150}>
      <Helmet>
        <title>Coding Leaderboard — Top Problem Solvers | Parikshaa</title>
        <meta
          name="description"
          content="Global ranking of the top coding problem solvers. Weighted by problem difficulty and execution speed."
        />
      </Helmet>

      <div className="container max-w-6xl mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              Global Coding Leaderboard
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Top Problem Solvers
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Ranked by a weighted score: unique problems solved × difficulty +
            speed bonus.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Users}
            label="Participants"
            value={stats?.total_participants ?? 0}
            loading={statsLoading}
          />
          <StatCard
            icon={CheckCircle2}
            label="Accepted today"
            value={stats?.total_accepted_today ?? 0}
            loading={statsLoading}
          />
          <StatCard
            icon={Zap}
            label="Accepted this week"
            value={stats?.total_accepted_week ?? 0}
            loading={statsLoading}
          />
          <StatCard
            icon={Target}
            label="Problems with solvers"
            value={stats?.total_problems_solved ?? 0}
            loading={statsLoading}
          />
        </div>

        {/* Guest banner */}
        {!user && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <LogIn className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">
                    Sign in to compete and see your runs & submissions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your accepted problems automatically count toward your rank.
                  </p>
                </div>
              </div>
              <Button asChild size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Window tabs + search */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Tabs
              value={window}
              onValueChange={(v) =>
                updateParams({ window: v }, { resetPage: true })
              }
            >
              <TabsList>
                <TabsTrigger value="all" aria-label="All time">All time</TabsTrigger>
                <TabsTrigger value="week" aria-label="Last 7 days">Last 7 days</TabsTrigger>
                <TabsTrigger value="today" aria-label="Today">Today</TabsTrigger>
              </TabsList>
            </Tabs>
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by username"
                  className="h-9 pl-8 w-48 md:w-64"
                  aria-label="Search leaderboard"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary">
                Search
              </Button>
            </form>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1.5">
              <CalendarDays className="h-3 w-3" />
              <span className="font-semibold">{windowRangeLabel}</span>
            </Badge>
            <span className="text-xs text-muted-foreground">{windowRangeSub}</span>
          </div>
        </div>

        {/* Filter row: difficulty pills + accepted-only toggle */}
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <FilterPill
                active={difficulty === null}
                onClick={() =>
                  updateParams({ diff: null }, { resetPage: true })
                }
              >
                All difficulties
              </FilterPill>
              <FilterPill
                active={difficulty === "easy"}
                onClick={() =>
                  updateParams({ diff: "easy" }, { resetPage: true })
                }
                tone="emerald"
              >
                Easy
              </FilterPill>
              <FilterPill
                active={difficulty === "medium"}
                onClick={() =>
                  updateParams({ diff: "medium" }, { resetPage: true })
                }
                tone="amber"
              >
                Medium
              </FilterPill>
              <FilterPill
                active={difficulty === "hard"}
                onClick={() =>
                  updateParams({ diff: "hard" }, { resetPage: true })
                }
                tone="rose"
              >
                Hard
              </FilterPill>
            </div>

            <div className="ml-auto flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Label htmlFor="min-score" className="text-xs text-muted-foreground shrink-0">
                  Min score
                </Label>
                <Slider
                  aria-label="Minimum weighted score slider"
                  value={[minScore]}
                  min={0}
                  max={Math.max(100, scoreSliderMax)}
                  step={1}
                  onValueChange={(v) => {
                    const n = v[0] ?? 0;
                    setMinScoreInput(n > 0 ? String(n) : "");
                  }}
                  onValueCommit={(v) => {
                    const n = v[0] ?? 0;
                    updateParams({ minScore: n > 0 ? String(n) : null }, { resetPage: true });
                  }}
                  className="w-32"
                />
                <Input
                  id="min-score"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="0"
                  value={minScoreInput}
                  onChange={(e) => setMinScoreInput(e.target.value)}
                  onBlur={() => {
                    const n = Number(minScoreInput);
                    const next = Number.isFinite(n) && n > 0 ? String(Math.floor(n)) : null;
                    updateParams({ minScore: next }, { resetPage: true });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  className="h-8 w-20 text-xs"
                  aria-label="Minimum weighted score"
                />
                {minScore > 0 && (
                  <button
                    type="button"
                    aria-label="Clear minimum score filter"
                    onClick={() => {
                      setMinScoreInput("");
                      updateParams({ minScore: null }, { resetPage: true });
                    }}
                    className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted-foreground/20 text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Label
                    htmlFor="accepted-only"
                    className="text-xs flex items-center gap-2 cursor-pointer select-none"
                  >
                    <Switch
                      id="accepted-only"
                      checked={acceptedOnly}
                      onCheckedChange={(v) =>
                        updateParams(
                          { accepted: v ? null : "0" },
                          { resetPage: true },
                        )
                      }
                    />
                    Accepted only
                  </Label>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  When off, all submissions count toward solved totals (rank still
                  uses unique problems).
                </TooltipContent>
              </Tooltip>

              {(difficulty || !acceptedOnly || search || minScore > 0) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => {
                    setMinScoreInput("");
                    updateParams(
                      { diff: null, accepted: null, q: null, minScore: null },
                      { resetPage: true },
                    );
                  }}
                >
                  <X className="h-3 w-3 mr-1" /> Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results count summary — updates live with chips/filters */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
          <p aria-live="polite">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                
              </span>
            ) : (
              <>
                <span className="font-semibold text-foreground tabular-nums">
                  {filteredRows.length}
                </span>{" "}
                {filteredRows.length === 1 ? "solver" : "solvers"} on this page
                {minScore > 0 && (
                  <span className="opacity-80"> · score ≥ {minScore}</span>
                )}
                {difficulty && (
                  <span className="opacity-80"> · {difficulty} only</span>
                )}
                {search && (
                  <span className="opacity-80"> · matching “{search}”</span>
                )}
                {minScore > 0 && filteredRows.length < rows.length && (
                  <span className="opacity-70">
                    {" "}({rows.length - filteredRows.length} hidden by min score)
                  </span>
                )}
              </>
            )}
          </p>
          {(minScore > 0 || difficulty || search) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => {
                setMinScoreInput("");
                setSearchInput("");
                updateParams(
                  { diff: null, q: null, minScore: null },
                  { resetPage: true },
                );
              }}
            >
              <X className="h-3 w-3 mr-1" /> Clear filters
            </Button>
          )}
        </div>

        {/* Your current rank card */}
        {user && (
          <YourRankCard
            loading={youLoading}
            rank={youRank}
            delta={youDelta}
            window={window}
            onJump={handleJumpToMe}
            onOpenBreakdown={() =>
              youRank && setDrawerUser({ id: youRank.user_id, rank: youRank.rank })
            }
          />
        )}

        {/* Podium */}
        {loading && page === 1 && !search && !difficulty ? (
          <div className="flex flex-col md:flex-row gap-4">
            {[2, 1, 3].map((r) => (
              <PodiumSkeleton key={r} rank={r as 1 | 2 | 3} />
            ))}
          </div>
        ) : podium.length >= 3 ? (
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <PodiumCard row={podium[1]} rank={2} onSelect={openBreakdown} />
            <PodiumCard row={podium[0]} rank={1} onSelect={openBreakdown} />
            <PodiumCard row={podium[2]} rank={3} onSelect={openBreakdown} />
          </div>
        ) : null}

        {/* Rest of leaderboard */}
        <Card className="bg-card/40 backdrop-blur border-border/50">
          <CardContent className="p-2 md:p-4">
            {loading ? (
              <ol className="space-y-1.5 list-none p-0 m-0" aria-label="Loading leaderboard">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i}>
                    <RowSkeleton />
                  </li>
                ))}
              </ol>
            ) : rest.length === 0 && podium.length === 0 ? (
              <EmptyState
                window={window}
                search={search}
                isAuthed={!!user}
                onClearSearch={
                  search
                    ? () => updateParams({ q: null }, { resetPage: true })
                    : undefined
                }
              />
            ) : (
              <ol
                ref={listRef}
                className="space-y-1.5 list-none p-0 m-0"
                aria-label={`Leaderboard ${windowLabel}, page ${page}`}
              >
                {rest.map((row, i) => {
                  const isYou = !!user && row.user_id === user.id;
                  return (
                    <motion.li
                      key={row.user_id}
                      ref={isYou ? youRowRef : undefined}
                      tabIndex={-1}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.015, 0.3) }}
                      className="scroll-mt-24"
                    >
                      <div
                        className={cn(
                          "flex items-stretch gap-2 rounded-lg border transition-all",
                          getRankBg(row.rank),
                          isYou && "ring-2 ring-primary/40",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => openBreakdown(row)}
                          aria-label={`Open score breakdown for ${row.display_name}, rank ${row.rank}`}
                          className={cn(
                            "flex-1 min-w-0 text-left flex items-center gap-3 p-3 rounded-l-lg",
                            "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          )}
                        >
                          <div className="w-8 flex items-center justify-center shrink-0">
                            {getRankIcon(row.rank)}
                          </div>
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage
                              src={row.avatar_url ?? undefined}
                              alt={row.display_name}
                            />
                            <AvatarFallback className="text-xs">
                              {row.display_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate text-sm">
                                {row.display_name}
                              </p>
                              {isYou && (
                                <>
                                  <Badge variant="outline" className="text-[9px] h-4">
                                    You
                                  </Badge>
                                  <DeltaBadge
                                    delta={youDelta?.delta_day}
                                    label="since yesterday"
                                    size="xs"
                                  />
                                </>
                              )}
                            </div>
                            {row.username && (
                              <p className="text-xs text-muted-foreground truncate">
                                @{row.username}
                              </p>
                            )}
                          </div>

                          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-center">
                                  <p className="font-bold text-foreground text-sm">
                                    {row.problems_solved}
                                  </p>
                                  <p className="text-[9px] uppercase">Solved</p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                Unique problems with at least one Accepted submission
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-center">
                                  <p className="font-medium">
                                    {row.acceptance_rate.toFixed(0)}%
                                  </p>
                                  <p className="text-[9px] uppercase">Acc.</p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Acceptance rate</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-center">
                                  <p className="font-medium">
                                    {formatRuntime(row.fastest_avg_runtime)}
                                  </p>
                                  <p className="text-[9px] uppercase">Speed</p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                Average best runtime across solved problems
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className="ml-auto sm:ml-0 font-mono tabular-nums"
                              >
                                {Math.round(row.weighted_score)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              Weighted score: solved × difficulty (easy 1, medium 3,
                              hard 5) + small speed bonus.
                            </TooltipContent>
                          </Tooltip>
                        </button>

                        <RowQuickLinks row={row} isYou={isYou} />
                      </div>
                    </motion.li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-mono font-semibold text-foreground">{page}</span>
            {!hasNext && page > 1 ? " · last page" : ""}
            {rows.length > 0 && (
              <span className="ml-2 opacity-70">
                showing ranks {(page - 1) * PAGE_SIZE + 1}–
                {(page - 1) * PAGE_SIZE + rows.length}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrev || loading}
              onClick={() =>
                updateParams({ page: page > 2 ? String(page - 1) : null })
              }
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Badge
              variant="secondary"
              className="font-mono tabular-nums px-3 h-9 flex items-center"
              aria-label={`Page ${page}`}
            >
              {page}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext || loading}
              onClick={() => updateParams({ page: String(page + 1) })}
              aria-label="Next page"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Privacy footer */}
        <Card className="bg-muted/20 border-border/50">
          <CardContent className="p-3 flex items-center gap-3 text-xs text-muted-foreground flex-wrap justify-between">
            <span className="inline-flex items-center gap-2">
              <EyeOff className="h-3.5 w-3.5" />
              All authenticated users appear by default. You can hide yourself in
              Settings → Privacy.
            </span>
            {user && (
              <Button asChild variant="link" size="sm" className="h-auto p-0">
                <Link to="/settings">Manage privacy</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <LeaderboardUserDrawer
        open={drawerUser !== null}
        onOpenChange={(o) => !o && setDrawerUser(null)}
        userId={drawerUser?.id ?? null}
        rank={drawerUser?.rank ?? null}
        isAuthenticated={!!user}
      />
    </TooltipProvider>
  );
}

// ─── Filter pill ───────────────────────────────────────────────────────
function FilterPill({
  active,
  onClick,
  children,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "emerald" | "amber" | "rose";
}) {
  const toneActive: Record<string, string> = {
    emerald: "bg-emerald-500/15 border-emerald-500/40 text-emerald-500",
    amber: "bg-amber-500/15 border-amber-500/40 text-amber-500",
    rose: "bg-rose-500/15 border-rose-500/40 text-rose-500",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-full text-xs border transition-colors",
        active
          ? tone
            ? toneActive[tone]
            : "bg-primary/15 border-primary/40 text-primary"
          : "border-border/50 bg-background/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
