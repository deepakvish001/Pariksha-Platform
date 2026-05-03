import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useContest } from "@/hooks/useContests";
import { useContestLeaderboard } from "@/hooks/useContestLeaderboard";
import { useContestClock } from "@/hooks/useContestClock";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowLeft, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const fmtPenalty = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const ContestLeaderboard = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: contest, isLoading } = useContest(slug);
  const { data: rows = [], isLoading: lbLoading } = useContestLeaderboard(contest?.id);
  const clock = useContestClock(contest?.starts_at, contest?.ends_at);

  if (isLoading) return <Skeleton className="mx-auto mt-10 h-96 w-full max-w-5xl" />;
  if (!contest) return <div className="p-8 text-center text-muted-foreground">Contest not found.</div>;

  const myRow = rows.find((r) => r.user_id === user?.id);

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
          {lbLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No submissions yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead className="text-right">Solved</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Penalty</TableHead>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
};

export default ContestLeaderboard;
