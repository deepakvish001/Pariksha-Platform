import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, RefreshCw, Download, Share2, Trophy, Loader2, ExternalLink, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { ShareDialog } from "./ShareDialog";

type Ranking = {
  student_id: string;
  full_name: string | null;
  email: string;
  roll_number: string | null;
  branch: string | null;
  batch_year: number | null;
  section: string | null;
  score: number;
  rank_in_org: number | null;
  rank_in_branch: number | null;
  assessments_taken: number;
  avg_assessment_score: number | null;
  avg_integrity: number | null;
  applications_count: number;
  shortlisted_count: number;
  offers_count: number;
  is_placed: boolean;
  is_multi_offer: boolean;
  scores: Record<string, number>;
};

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[hsl(var(--border))]/70 bg-gradient-to-br from-[hsl(var(--card))]/80 to-[hsl(var(--card))]/40 backdrop-blur-xl ${className}`}>
      <div className="relative">{children}</div>
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-orange-400";
  return "text-muted-foreground";
}

function StatusBadge({ r }: { r: Ranking }) {
  if (r.is_multi_offer) return <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">Multi-offer</Badge>;
  if (r.is_placed) return <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[10px]">Placed</Badge>;
  if (r.shortlisted_count > 0) return <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">Shortlisted</Badge>;
  return <Badge variant="outline" className="text-[10px]">Unplaced</Badge>;
}

export function RankingsTab({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState<string>("all");
  const [branch, setBranch] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [minScore, setMinScore] = useState<string>("0");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareTarget, setShareTarget] = useState<
    | { kind: "profile"; studentId: string; studentName: string }
    | { kind: "shortlist"; studentIds: string[] }
    | null
  >(null);

  const filters = useMemo(() => {
    const f: Record<string, string | number> = {};
    if (search.trim()) f.search = search.trim();
    if (batch !== "all") f.batch_year = Number(batch);
    if (branch !== "all") f.branch = branch;
    if (status !== "all") f.status = status;
    if (Number(minScore) > 0) f.min_score = Number(minScore);
    return f;
  }, [search, batch, branch, status, minScore]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["placement_rankings", orgId, filters],
    queryFn: async (): Promise<Ranking[]> => {
      const { data, error } = await supabase.rpc("placement_rankings" as any, {
        _org_id: orgId,
        _filters: filters,
        _limit: 500,
        _offset: 0,
      });
      if (error) throw error;
      return (data || []) as Ranking[];
    },
  });

  const recompute = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("placement_recompute_scores" as any, { _org_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Scores recomputed");
      qc.invalidateQueries({ queryKey: ["placement_rankings"] });
    },
    onError: (e: any) => toast.error(e?.message || "Recompute failed"),
  });

  const branches = useMemo(() => {
    const s = new Set<string>();
    (data || []).forEach((r) => r.branch && s.add(r.branch));
    return Array.from(s).sort();
  }, [data]);
  const batches = useMemo(() => {
    const s = new Set<number>();
    (data || []).forEach((r) => r.batch_year && s.add(r.batch_year));
    return Array.from(s).sort();
  }, [data]);

  const toggleAll = () => {
    if (!data) return;
    if (selected.size === data.length) setSelected(new Set());
    else setSelected(new Set(data.map((r) => r.student_id)));
  };

  const exportCsv = () => {
    if (!data?.length) return;
    const headers = ["Rank", "Name", "Email", "Roll", "Branch", "Batch", "Score", "Assessments", "AvgScore", "Integrity", "Apps", "Shortlisted", "Offers", "Status"];
    const rows = data.map((r) => [
      r.rank_in_org ?? "",
      r.full_name ?? "",
      r.email,
      r.roll_number ?? "",
      r.branch ?? "",
      r.batch_year ?? "",
      r.score,
      r.assessments_taken,
      r.avg_assessment_score?.toFixed(1) ?? "",
      r.avg_integrity?.toFixed(1) ?? "",
      r.applications_count,
      r.shortlisted_count,
      r.offers_count,
      r.is_multi_offer ? "Multi-offer" : r.is_placed ? "Placed" : r.shortlisted_count ? "Shortlisted" : "Unplaced",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `placement-rankings-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <GlassCard className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, roll"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 w-[220px]"
            />
          </div>
          <Select value={batch} onValueChange={setBatch}>
            <SelectTrigger className="h-8 w-[130px]"><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              {batches.map((b) => <SelectItem key={b} value={String(b)}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger className="h-8 w-[150px]"><SelectValue placeholder="Branch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All students</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="multi">Multi-offer</SelectItem>
              <SelectItem value="unplaced">Unplaced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={minScore} onValueChange={setMinScore}>
            <SelectTrigger className="h-8 w-[130px]"><SelectValue placeholder="Min score" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any score</SelectItem>
              <SelectItem value="40">≥ 40</SelectItem>
              <SelectItem value="60">≥ 60</SelectItem>
              <SelectItem value="80">≥ 80 (top)</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => recompute.mutate()} disabled={recompute.isPending}>
              <Sparkles className={`h-4 w-4 mr-1.5 ${recompute.isPending ? "animate-spin" : ""}`} />
              Recompute
            </Button>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={!data?.length}>
              <Download className="h-4 w-4 mr-1.5" />CSV
            </Button>
            <Button
              size="sm"
              disabled={selected.size === 0}
              onClick={() => setShareTarget({ kind: "shortlist", studentIds: Array.from(selected) })}
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              Share {selected.size > 0 ? `(${selected.size})` : "shortlist"}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--muted))]/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 w-8">
                  <Checkbox
                    checked={!!data?.length && selected.size === data.length}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="text-left px-3 py-2 font-medium w-12">#</th>
                <th className="text-left px-3 py-2 font-medium">Student</th>
                <th className="text-left px-3 py-2 font-medium">Branch · Batch</th>
                <th className="text-right px-3 py-2 font-medium">Score</th>
                <th className="text-right px-3 py-2 font-medium">Assess</th>
                <th className="text-right px-3 py-2 font-medium">Avg %</th>
                <th className="text-right px-3 py-2 font-medium">Integrity</th>
                <th className="text-right px-3 py-2 font-medium">Apps</th>
                <th className="text-right px-3 py-2 font-medium">Offers</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-right px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={12} className="px-3 py-10 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </td></tr>
              ) : !data?.length ? (
                <tr><td colSpan={12} className="px-3 py-10 text-center text-muted-foreground">
                  No students yet. Add students to your org or click <strong>Recompute</strong> to build the leaderboard.
                </td></tr>
              ) : data.map((r, i) => (
                <tr key={r.student_id} className="border-t border-[hsl(var(--border))]/40 hover:bg-[hsl(var(--muted))]/10">
                  <td className="px-3 py-2">
                    <Checkbox
                      checked={selected.has(r.student_id)}
                      onCheckedChange={(v) => {
                        const next = new Set(selected);
                        if (v) next.add(r.student_id); else next.delete(r.student_id);
                        setSelected(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-xs">
                    {r.rank_in_org ?? i + 1}
                    {i < 3 && <Trophy className="inline h-3 w-3 ml-1 text-amber-400" />}
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/b2b/placements/students/${r.student_id}`} className="hover:underline">
                      <div className="font-medium truncate max-w-[200px]">{r.full_name || r.email}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {r.roll_number ? `${r.roll_number} · ` : ""}{r.email}
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {r.branch ?? "—"} {r.batch_year ? `· ${r.batch_year}` : ""}
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold tabular-nums ${scoreColor(r.score)}`}>
                    {r.score.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.assessments_taken}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-xs">{r.avg_assessment_score?.toFixed(0) ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-xs">{r.avg_integrity?.toFixed(0) ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-xs">{r.applications_count}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-xs">{r.offers_count}</td>
                  <td className="px-3 py-2"><StatusBadge r={r} /></td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <Button asChild size="sm" variant="ghost" className="h-7 px-2">
                        <Link to={`/b2b/placements/students/${r.student_id}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => setShareTarget({ kind: "profile", studentId: r.student_id, studentName: r.full_name || r.email })}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {shareTarget && (
        <ShareDialog
          orgId={orgId}
          target={shareTarget}
          onClose={() => setShareTarget(null)}
        />
      )}
    </div>
  );
}
