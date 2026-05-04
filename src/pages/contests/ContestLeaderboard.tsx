import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useContest } from "@/hooks/useContests";
import { useContestLeaderboard, useMyContestLeaderboardRow } from "@/hooks/useContestLeaderboard";
import { useContestClock } from "@/hooks/useContestClock";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowLeft, Radio, ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

const fmtPenalty = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const TrustCell = ({ score, risk }: { score: number | null | undefined; risk: string | null | undefined }) => {
  if (score == null) return <span className="text-xs text-muted-foreground">—</span>;
  const tone =
    risk === "low" ? "border-emerald-400/40 text-emerald-400"
    : risk === "medium" ? "border-amber-400/40 text-amber-400"
    : "border-red-400/50 text-red-400";
  const Icon = risk === "low" ? ShieldCheck : risk === "medium" ? ShieldAlert : ShieldX;
  return (
    <Badge variant="outline" className={cn("gap-1 font-mono", tone)}>
      <Icon className="h-3 w-3" /> {score}
    </Badge>
  );
};

const ContestLeaderboard = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: contest, isLoading } = useContest(slug);
  const [page, setPage] = useState(1);
  const {
    data,
    isLoading: lbLoading,
    isFetching: lbFetching,
    error: lbError,
    refetch,
  } = useContestLeaderboard(contest?.id, page, PAGE_SIZE);
  const { data: myRow } = useMyContestLeaderboardRow(contest?.id, user?.id);
  const clock = useContestClock(contest?.starts_at, contest?.ends_at);

  if (isLoading) return <Skeleton className="mx-auto mt-10 h-96 w-full max-w-5xl" />;
  if (!contest) return <div className="p-8 text-center text-muted-foreground">Contest not found.</div>;

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Helmet>
        <title>{contest.title} — Leaderboard</title>
      </Helmet>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
        <Link to={`/contests/${contest.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to contest
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{contest.title} — Leaderboard</h1>
            <p className="text-sm text-muted-foreground">{clock.label}</p>
          </div>
          {clock.phase === "live" && (
            <Badge className="gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Radio className="h-3 w-3 animate-pulse" /> Live
            </Badge>
          )}
        </div>

        {myRow && (
          <Card className="border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">#{myRow.rank}</span>
                <span className="text-muted-foreground">Your rank</span>
              </div>
              <div className="flex gap-6 text-sm">
                <span><strong>{myRow.problems_solved}</strong> solved</span>
                <span><strong>{myRow.total_points}</strong> pts</span>
                <span>{fmtPenalty(myRow.total_penalty_seconds)} penalty</span>
              </div>
            </div>
          </Card>
        )}

        <Card>
          {lbError ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Failed to load leaderboard. {(lbError as Error).message}
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : lbLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No submissions yet.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead className="text-right">Solved</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Penalty</TableHead>
                    <TableHead className="text-right">Trust</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.user_id} className={cn(r.user_id === user?.id && "bg-primary/5")}>
                      <TableCell className="font-mono font-semibold">
                        {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={r.avatar_url ?? undefined} />
                            <AvatarFallback>{(r.display_name ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{r.display_name ?? "Anonymous"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{r.problems_solved}</TableCell>
                      <TableCell className="text-right font-semibold">{r.total_points}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{fmtPenalty(r.total_penalty_seconds)}</TableCell>
                      <TableCell className="text-right">
                        <TrustCell score={r.trust_score} risk={r.trust_risk} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between gap-3 border-t border-border/50 px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                  {lbFetching && <span className="ml-2 italic">updating…</span>}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1 || lbFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <span className="text-muted-foreground">Page {page} / {pageCount}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= pageCount || lbFetching}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
};

export default ContestLeaderboard;
