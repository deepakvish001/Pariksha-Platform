// Public global coding leaderboard page.
// Accessible to guests; ranks users by a weighted score that combines
// unique problems solved (weighted by difficulty) with a small speed bonus.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  type CodingLeaderboardRow,
  type LeaderboardWindow,
} from "@/hooks/useCodingLeaderboard";
import { LeaderboardUserDrawer } from "@/components/library/coding/LeaderboardUserDrawer";

const PAGE_SIZE = 50;

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

export default function CodingLeaderboard() {
  const { user } = useAuth();
  const [window, setWindow] = useState<LeaderboardWindow>("all");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [drawerUser, setDrawerUser] = useState<{ id: string; rank: number } | null>(null);

  const { rows, loading } = useCodingLeaderboard({
    window,
    page,
    pageSize: PAGE_SIZE,
    search,
  });
  const { stats, loading: statsLoading } = useCodingLeaderboardStats();

  const podium = useMemo(
    () => (page === 1 && !search ? rows.slice(0, 3) : []),
    [rows, page, search],
  );
  const rest = useMemo(
    () => (page === 1 && !search ? rows.slice(3) : rows),
    [rows, page, search],
  );

  const openBreakdown = (row: CodingLeaderboardRow) =>
    setDrawerUser({ id: row.user_id, rank: row.rank });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Helmet>
        <title>Coding Leaderboard — Top Problem Solvers | Byteskill</title>
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Tabs
            value={window}
            onValueChange={(v) => {
              setWindow(v as LeaderboardWindow);
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">All-time</TabsTrigger>
              <TabsTrigger value="week">This week</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
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

        {/* Podium */}
        {loading && page === 1 && !search ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
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
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : rest.length === 0 && podium.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No ranked solvers yet for this window.</p>
                {user && (
                  <p className="text-xs mt-1">
                    Solve a problem to claim the top spot!
                  </p>
                )}
              </div>
            ) : (
              <ol className="space-y-1.5 list-none p-0 m-0">
                {rest.map((row, i) => (
                  <motion.li
                    key={row.user_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  >
                    <Link
                      to={row.username ? `/u/${row.username}` : "#"}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        "hover:bg-muted/30",
                        getRankBg(row.rank),
                        user && row.user_id === user.id && "ring-2 ring-primary/40",
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate text-sm">
                            {row.display_name}
                          </p>
                          {user && row.user_id === user.id && (
                            <Badge variant="outline" className="text-[9px] h-4">
                              You
                            </Badge>
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
                    </Link>
                  </motion.li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Page {page}
            {rows.length === PAGE_SIZE ? "" : " (last page)"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={rows.length < PAGE_SIZE || loading}
              onClick={() => setPage((p) => p + 1)}
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
    </TooltipProvider>
  );
}
