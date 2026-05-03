import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAdminContest, useRecomputeLeaderboard } from "@/hooks/admin/useAdminContests";
import { useContestLeaderboard } from "@/hooks/useContestLeaderboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, RefreshCw } from "lucide-react";

const fmtPenalty = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const AdminContestLeaderboard = () => {
  const { id } = useParams();
  const { data: contest } = useAdminContest(id);
  const { data, isLoading } = useContestLeaderboard(id, 1, 200);
  const rows = data?.rows ?? [];
  const recompute = useRecomputeLeaderboard();

  return (
    <>
      <Helmet><title>Leaderboard | Admin</title></Helmet>
      <div className="space-y-6 p-6">
        <Link to="/admin/contests" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All contests
        </Link>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">{contest?.title}</p>
          </div>
          <Button onClick={() => id && recompute.mutate(id)} disabled={recompute.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${recompute.isPending ? "animate-spin" : ""}`} /> Recompute
          </Button>
        </div>

        <Card>
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No submissions yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead className="text-right">Solved</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Penalty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.user_id}>
                    <TableCell className="font-mono">#{r.rank}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={r.avatar_url ?? undefined} />
                          <AvatarFallback>{(r.display_name ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{r.display_name ?? r.user_id.slice(0, 8)}</span>
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

export default AdminContestLeaderboard;
