import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ShieldAlert, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Verdict = "pending" | "confirmed" | "disputed" | "inconclusive";

interface Row {
  id: string;
  session_id: string;
  contest_id: string;
  user_id: string;
  verdict: Verdict;
  reason: string | null;
  public_token: string | null;
  created_at: string;
  updated_at: string | null;
  contest_title?: string;
  candidate_name?: string;
}

const BADGE: Record<Verdict, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  confirmed: "bg-destructive/15 text-destructive border-destructive/40",
  disputed: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  inconclusive: "bg-muted/30 text-muted-foreground border-border",
};

/**
 * Reviewer queue for all auto-terminated sessions. Hard-mode auto-terminations
 * land here with verdict = "pending" until an admin confirms, marks disputed,
 * or flags inconclusive. Each row deep-links to the session forensics page
 * and to the public verifiable report via `public_token`.
 */
export default function AdminIntegrityQueue() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<Verdict | "all">("pending");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("contest_integrity_verdicts")
      .select("id, session_id, contest_id, user_id, verdict, reason, public_token, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter !== "all") q = q.eq("verdict", filter);
    const { data, error } = await q;
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      // Enrich with contest title + candidate email (best-effort)
      const list = (data ?? []) as Row[];
      const contestIds = Array.from(new Set(list.map((r) => r.contest_id)));
      const userIds = Array.from(new Set(list.map((r) => r.user_id)));
      const contestsRes = contestIds.length
        ? await supabase.from("contests").select("id, title").in("id", contestIds)
        : { data: [] as Array<{ id: string; title: string }> };
      const profilesRes = userIds.length
        ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
        : { data: [] as Array<{ user_id: string; full_name: string | null }> };
      const cMap = new Map<string, string>(
        (contestsRes.data ?? []).map((c) => [c.id, c.title] as [string, string]),
      );
      const pMap = new Map<string, string>(
        (profilesRes.data ?? []).map((p) => [p.user_id, p.full_name ?? ""] as [string, string]),
      );
      setRows(list.map((r) => ({
        ...r,
        contest_title: cMap.get(r.contest_id),
        candidate_name: pMap.get(r.user_id),
      })));
    }
    setLoading(false);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [filter]);

  const setVerdict = async (id: string, verdict: Verdict) => {
    const { error } = await supabase
      .from("contest_integrity_verdicts")
      .update({ verdict })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Marked ${verdict}`); void load(); }
  };

  const counts = (rows ?? []).reduce((acc, r) => {
    acc[r.verdict] = (acc[r.verdict] ?? 0) + 1;
    return acc;
  }, {} as Record<Verdict, number>);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <Helmet><title>Integrity Queue — Admin</title></Helmet>

      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            Integrity Queue
          </h1>
          <p className="text-sm text-muted-foreground">
            Auto-terminated sessions awaiting reviewer decision.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as Verdict | "all")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="inconclusive">Inconclusive</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["pending", "confirmed", "disputed", "inconclusive"] as Verdict[]).map((v) => (
          <Card key={v} className="border-border/60">
            <CardContent className="p-4">
              <div className="text-xs uppercase text-muted-foreground">{v}</div>
              <div className="text-2xl font-bold">{counts[v] ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {rows === null ? (
            <div className="p-6 text-center text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No sessions match this filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contest</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {r.contest_title ?? r.contest_id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                      {r.candidate_name || r.user_id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-mono">{r.reason ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={BADGE[r.verdict]}>
                        {r.verdict}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/admin/contests/sessions/${r.session_id}/forensics`}>
                            Forensics
                          </Link>
                        </Button>
                        {r.public_token && (
                          <Button asChild size="sm" variant="ghost">
                            <Link to={`/verify/${r.public_token}`} target="_blank" rel="noopener">
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </Button>
                        )}
                        {r.verdict === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => void setVerdict(r.id, "confirmed")}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void setVerdict(r.id, "disputed")}
                            >
                              Dispute
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void setVerdict(r.id, "inconclusive")}
                            >
                              Inconclusive
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
