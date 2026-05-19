import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, RefreshCw, Download, Share2, Trophy, Loader2, ExternalLink,
  Sparkles, LayoutGrid, List, Briefcase, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { ShareDialog } from "./ShareDialog";
import { QuickSharePopover } from "./QuickSharePopover";
import { StudentMetricsDrawer } from "./StudentMetricsDrawer";

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

type SortKey = "score" | "assessment" | "offers" | "engagement";

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

function scoreStroke(score: number) {
  if (score >= 80) return "hsl(152 76% 50%)";
  if (score >= 60) return "hsl(38 92% 55%)";
  if (score >= 40) return "hsl(20 90% 55%)";
  return "hsl(var(--muted-foreground))";
}

function rankAccent(rank: number | null | undefined) {
  if (rank === 1) return "from-amber-400/30 to-amber-600/10 text-amber-300 border-amber-400/40";
  if (rank === 2) return "from-zinc-300/25 to-zinc-500/10 text-zinc-200 border-zinc-300/40";
  if (rank === 3) return "from-orange-400/25 to-orange-700/10 text-orange-300 border-orange-400/40";
  return "from-[hsl(var(--muted))]/30 to-[hsl(var(--muted))]/10 text-muted-foreground border-[hsl(var(--border))]/60";
}

function StatusBadge({ r }: { r: Ranking }) {
  if (r.is_multi_offer) return <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">Multi-offer</Badge>;
  if (r.is_placed) return <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[10px]">Placed</Badge>;
  if (r.shortlisted_count > 0) return <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">Shortlisted</Badge>;
  return <Badge variant="outline" className="text-[10px]">Unplaced</Badge>;
}

function initials(name: string | null, email: string) {
  const base = (name || email).trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ScoreDonut({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const r = 28;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="hsl(var(--muted))" strokeOpacity="0.25" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={scoreStroke(score)} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-lg font-semibold tabular-nums ${scoreColor(score)}`}>{Math.round(score)}</div>
        <div className="text-[9px] text-muted-foreground -mt-0.5">/100</div>
      </div>
    </div>
  );
}

function MiniBar({ label, value, tone }: { label: string; value: number; tone: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(v)}</span>
      </div>
      <div className="h-1 rounded-full bg-[hsl(var(--muted))]/40 overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function RankingsTab({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const sp = (k: string, fallback: string) => searchParams.get(k) ?? fallback;

  const [search, setSearch] = useState(() => sp("q", ""));
  const [debouncedSearch, setDebouncedSearch] = useState(() => sp("q", "").trim());
  const [batch, setBatch] = useState<string>(() => sp("batch", "all"));
  const [branch, setBranch] = useState<string>(() => sp("branch", "all"));
  const [section, setSection] = useState<string>(() => sp("section", "all"));
  const [driveId, setDriveId] = useState<string>(() => sp("drive", "all"));
  const [status, setStatus] = useState<string>(() => sp("status", "all"));
  const [minScore, setMinScore] = useState<string>(() => sp("min", "0"));
  const [sortKey, setSortKey] = useState<SortKey>(() => (sp("sort", "score") as SortKey));
  const [view, setView] = useState<"cards" | "table">(() => {
    const fromUrl = searchParams.get("view");
    if (fromUrl === "cards" || fromUrl === "table") return fromUrl;
    if (typeof window === "undefined") return "cards";
    return (localStorage.getItem("placements.rankings.view") as "cards" | "table") || "cards";
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareTarget, setShareTarget] = useState<
    | { kind: "profile"; studentId: string; studentName: string }
    | { kind: "shortlist"; studentIds: string[] }
    | null
  >(null);
  const [drawerStudent, setDrawerStudent] = useState<Ranking | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Scroll preservation: snapshot Y before filter/sort/view changes,
  // restore after the resulting data/layout update so the viewport stays put.
  const scrollRestoreRef = useRef<number | null>(null);
  const preserveScroll = () => {
    scrollRestoreRef.current = window.scrollY;
  };
  const withPreserve = <T,>(fn: (v: T) => void) => (v: T) => {
    preserveScroll();
    fn(v);
  };

  useEffect(() => {
    localStorage.setItem("placements.rankings.view", view);
  }, [view]);

  // Sync filter/sort/view state into URL so views are shareable
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const set = (k: string, v: string, def: string) => {
      if (v && v !== def) next.set(k, v); else next.delete(k);
    };
    set("q", debouncedSearch, "");
    set("batch", batch, "all");
    set("branch", branch, "all");
    set("section", section, "all");
    set("drive", driveId, "all");
    set("status", status, "all");
    set("min", minScore, "0");
    set("sort", sortKey, "score");
    set("view", view, "cards");
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, batch, branch, section, driveId, status, minScore, sortKey, view]);


  const PAGE_SIZE = 50;
  const [page, setPage] = useState(() => Math.max(1, Number(sp("page", "1")) || 1));

  // Reset to page 1 whenever filters/sort change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, batch, branch, section, driveId, status, minScore, sortKey]);

  // Persist page in URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (page > 1) next.set("page", String(page)); else next.delete("page");
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filters = useMemo(() => {
    const f: Record<string, string | number> = {};
    if (debouncedSearch) f.search = debouncedSearch;
    if (batch !== "all") f.batch_year = Number(batch);
    if (branch !== "all") f.branch = branch;
    if (section !== "all") f.section = section;
    if (status !== "all") f.status = status;
    if (Number(minScore) > 0) f.min_score = Number(minScore);
    return f;
  }, [debouncedSearch, batch, branch, section, status, minScore]);

  // Drives list (small)
  const { data: drives } = useQuery({
    queryKey: ["placement_drives_list", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("placement_drives" as any)
        .select("id,title,status")
        .eq("org_id", orgId)
        .order("opens_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return ((data || []) as unknown) as { id: string; title: string; status: string }[];
    },
  });

  // Students for the selected drive (used as a server-side filter)
  const { data: driveStudentIds } = useQuery({
    queryKey: ["drive_applications_students", driveId],
    enabled: driveId !== "all",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drive_applications" as any)
        .select("student_id")
        .eq("drive_id", driveId);
      if (error) throw error;
      return (data || []).map((r: any) => r.student_id as string);
    },
  });

  const studentIdsParam = driveId !== "all" ? (driveStudentIds ?? []) : null;
  const driveReady = driveId === "all" || driveStudentIds !== undefined;

  // Distinct filter values (branches/batches/sections) — independent of page
  const { data: filterValues } = useQuery({
    queryKey: ["placement_rankings_filter_values", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("placement_rankings_filter_values" as any, { _org_id: orgId });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as
        | { branches: string[]; batches: number[]; sections: string[] }
        | null;
      return row || { branches: [], batches: [], sections: [] };
    },
  });
  const branches = filterValues?.branches || [];
  const batches = filterValues?.batches || [];
  const sections = filterValues?.sections || [];

  // Total count for current filters (drives total + pagination)
  const { data: totalCount } = useQuery({
    queryKey: ["placement_rankings_count", orgId, filters, studentIdsParam],
    enabled: driveReady,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("placement_rankings_count" as any, {
        _org_id: orgId,
        _filters: filters,
        _student_ids: studentIdsParam,
      });
      if (error) throw error;
      return Number(data) || 0;
    },
  });

  // Current page of rankings — true server-side pagination + sort
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["placement_rankings", orgId, filters, studentIdsParam, sortKey, page],
    enabled: driveReady,
    queryFn: async (): Promise<Ranking[]> => {
      const { data, error } = await supabase.rpc("placement_rankings" as any, {
        _org_id: orgId,
        _filters: filters,
        _limit: PAGE_SIZE,
        _offset: (page - 1) * PAGE_SIZE,
        _sort: sortKey,
        _student_ids: studentIdsParam,
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
      qc.invalidateQueries({ queryKey: ["placement_rankings_count"] });
    },
    onError: (e: any) => toast.error(e?.message || "Recompute failed"),
  });

  const engagementOf = (r: Ranking) =>
    Math.min(100, (r.applications_count + 2 * r.shortlisted_count + 4 * r.offers_count) * 8);

  // Server returns the page already filtered/sorted — render as-is
  const visible = data || [];
  const rendered = visible;

  // Map of branch counts for the current page (used only for display hint)
  const branchTotals = useMemo(() => {
    const m = new Map<string, number>();
    visible.forEach((r) => {
      if (!r.branch) return;
      m.set(r.branch, (m.get(r.branch) || 0) + 1);
    });
    return m;
  }, [visible]);

  const orgTotal = totalCount ?? 0;
  const filteredCount = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / PAGE_SIZE));
  const avgScore = visible.length
    ? visible.reduce((s, r) => s + r.score, 0) / visible.length
    : 0;
  const topScorer = visible[0];

  const toggleAll = () => {
    if (!visible.length) return;
    if (selected.size === visible.length) setSelected(new Set());
    else setSelected(new Set(visible.map((r) => r.student_id)));
  };

  const [exporting, setExporting] = useState(false);
  const exportCsv = async () => {
    if (!filteredCount) return;
    setExporting(true);
    try {
      const all: Ranking[] = [];
      const BATCH = 200;
      for (let off = 0; off < filteredCount; off += BATCH) {
        const { data, error } = await supabase.rpc("placement_rankings" as any, {
          _org_id: orgId,
          _filters: filters,
          _limit: BATCH,
          _offset: off,
          _sort: sortKey,
          _student_ids: studentIdsParam,
        });
        if (error) throw error;
        all.push(...((data || []) as Ranking[]));
        if (!data || (data as any[]).length < BATCH) break;
      }
      const headers = ["Rank", "Name", "Email", "Roll", "Branch", "Batch", "Section", "Score", "Assessments", "AvgScore", "Integrity", "Apps", "Shortlisted", "Offers", "Status"];
      const rows = all.map((r, i) => [
        r.rank_in_org ?? i + 1,
        r.full_name ?? "",
        r.email,
        r.roll_number ?? "",
        r.branch ?? "",
        r.batch_year ?? "",
        r.section ?? "",
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
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    preserveScroll();
    setSearch(""); setBatch("all"); setBranch("all"); setSection("all");
    setDriveId("all"); setStatus("all"); setMinScore("0"); setSortKey("score");
  };

  // Restore captured scroll position once the new layout has rendered.
  useLayoutEffect(() => {
    if (scrollRestoreRef.current == null) return;
    const y = scrollRestoreRef.current;
    scrollRestoreRef.current = null;
    // Two rAFs: wait for paint after layout so taller/shorter lists settle first.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        window.scrollTo({ top: Math.min(y, maxY), behavior: "auto" });
      });
    });
  }, [data, view]);


  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <GlassCard className="p-3 sm:p-4 sticky top-0 z-10">
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
            <SelectTrigger className="h-8 w-[120px]"><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              {batches.map((b) => <SelectItem key={b} value={String(b)}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Branch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="h-8 w-[110px]"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={driveId} onValueChange={setDriveId}>
            <SelectTrigger className="h-8 w-[170px]">
              <Briefcase className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Drive" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All drives</SelectItem>
              {(drives || []).map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All students</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="multi">Multi-offer</SelectItem>
              <SelectItem value="unplaced">Unplaced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={minScore} onValueChange={setMinScore}>
            <SelectTrigger className="h-8 w-[120px]"><SelectValue placeholder="Min score" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any score</SelectItem>
              <SelectItem value="40">≥ 40</SelectItem>
              <SelectItem value="60">≥ 60</SelectItem>
              <SelectItem value="80">≥ 80 (top)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Sort: Score</SelectItem>
              <SelectItem value="assessment">Sort: Assessment</SelectItem>
              <SelectItem value="offers">Sort: Offers</SelectItem>
              <SelectItem value="engagement">Sort: Engagement</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <div className="inline-flex rounded-md border border-[hsl(var(--border))]/60 overflow-hidden">
              <button
                onClick={() => setView("cards")}
                className={`h-8 px-2 ${view === "cards" ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]" : "text-muted-foreground"}`}
                aria-label="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("table")}
                className={`h-8 px-2 ${view === "table" ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]" : "text-muted-foreground"}`}
                aria-label="Table view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button size="sm" variant="ghost" onClick={clearFilters} className="h-8">Clear</Button>
            <Button size="sm" variant="outline" onClick={() => recompute.mutate()} disabled={recompute.isPending}>
              <Sparkles className={`h-4 w-4 mr-1.5 ${recompute.isPending ? "animate-spin" : ""}`} />
              Recompute
            </Button>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={!filteredCount || exporting}>
              {exporting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}CSV
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

      {/* Header strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassCard className="p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Filtered</div>
            <div className="text-xl font-semibold tabular-nums">
              {filteredCount} <span className="text-xs text-muted-foreground font-normal">of {orgTotal}</span>
            </div>
          </div>
          <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]/70" />
        </GlassCard>
        <GlassCard className="p-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Avg score</div>
            <div className={`text-xl font-semibold tabular-nums ${scoreColor(avgScore)}`}>{avgScore.toFixed(1)}</div>
          </div>
          <div className="text-xs text-muted-foreground">across filter</div>
        </GlassCard>
        <GlassCard className="p-3 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Top scorer</div>
            <div className="text-sm font-semibold truncate">
              {topScorer ? (topScorer.full_name || topScorer.email) : "—"}
            </div>
            {topScorer && (
              <div className={`text-xs ${scoreColor(topScorer.score)}`}>{Math.round(topScorer.score)} · {topScorer.branch ?? "—"}</div>
            )}
          </div>
          <Trophy className="h-5 w-5 text-amber-400" />
        </GlassCard>
      </div>

      {/* Body */}
      {isLoading ? (
        view === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <GlassCard key={i} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-12 rounded-md" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Skeleton className="h-20 w-20 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 3 }).map((__, j) => (
                    <div key={j} className="space-y-1">
                      <Skeleton className="h-2.5 w-12" />
                      <Skeleton className="h-1 w-full rounded-full" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-3 w-32" />
                  <div className="flex gap-1">
                    <Skeleton className="h-7 w-16 rounded-md" />
                    <Skeleton className="h-7 w-16 rounded-md" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--muted))]/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {["", "#", "Student", "Branch · Batch", "Score", "Assess", "Avg %", "Integrity", "Apps", "Offers", "Status", "Actions"].map((h, i) => (
                    <th key={i} className={`px-3 py-2 font-medium ${i >= 4 && i <= 9 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-[hsl(var(--border))]/40">
                    <td className="px-3 py-2"><Skeleton className="h-4 w-4 rounded" /></td>
                    <td className="px-3 py-2"><Skeleton className="h-3 w-5" /></td>
                    <td className="px-3 py-2">
                      <Skeleton className="h-3.5 w-36 mb-1" />
                      <Skeleton className="h-3 w-28" />
                    </td>
                    <td className="px-3 py-2"><Skeleton className="h-3 w-24" /></td>
                    <td className="px-3 py-2"><Skeleton className="ml-auto h-3.5 w-8" /></td>
                    <td className="px-3 py-2"><Skeleton className="ml-auto h-3 w-6" /></td>
                    <td className="px-3 py-2"><Skeleton className="ml-auto h-3 w-8" /></td>
                    <td className="px-3 py-2"><Skeleton className="ml-auto h-3 w-8" /></td>
                    <td className="px-3 py-2"><Skeleton className="ml-auto h-3 w-6" /></td>
                    <td className="px-3 py-2"><Skeleton className="ml-auto h-3 w-6" /></td>
                    <td className="px-3 py-2"><Skeleton className="h-4 w-16 rounded-full" /></td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <Skeleton className="h-7 w-7 rounded-md" />
                        <Skeleton className="h-7 w-7 rounded-md" />
                        <Skeleton className="h-7 w-7 rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )
      ) : !visible.length ? (
        (() => {
          const hasFilters =
            !!debouncedSearch ||
            batch !== "all" || branch !== "all" || section !== "all" ||
            driveId !== "all" || status !== "all" || Number(minScore) > 0;
          const hasAnyData = (data?.length || 0) > 0;
          return (
            <GlassCard className="p-10 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-[hsl(var(--muted))]/40 grid place-items-center">
                {hasAnyData
                  ? <Search className="h-5 w-5 text-muted-foreground" />
                  : <Trophy className="h-5 w-5 text-amber-400/80" />}
              </div>
              <div className="text-sm font-medium">
                {hasAnyData ? "No students match these filters" : "Leaderboard is empty"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                {hasAnyData
                  ? "Try adjusting or clearing the filters above to see more candidates."
                  : "Run Recompute to score your students and build the placement leaderboard."}
              </div>
              <div className="mt-4 inline-flex gap-2">
                {hasFilters && hasAnyData && (
                  <Button size="sm" variant="outline" onClick={clearFilters}>Clear filters</Button>
                )}
                {!hasAnyData && (
                  <Button size="sm" onClick={() => recompute.mutate()} disabled={recompute.isPending}>
                    <Sparkles className={`h-4 w-4 mr-1.5 ${recompute.isPending ? "animate-spin" : ""}`} />
                    Recompute scores
                  </Button>
                )}
              </div>
            </GlassCard>
          );
        })()
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {rendered.map((r, i) => {
            const displayRank = r.rank_in_org ?? i + 1;
            const branchTotal = r.branch ? branchTotals.get(r.branch) || 0 : 0;
            const pct = orgTotal ? Math.max(1, Math.round((displayRank / orgTotal) * 100)) : null;
            const isSelected = selected.has(r.student_id);
            const engagement = engagementOf(r);
            return (
              <GlassCard
                key={r.student_id}
                className={`p-4 transition-colors ${isSelected ? "ring-1 ring-[hsl(var(--primary))]/60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`inline-flex items-center gap-1 rounded-md border bg-gradient-to-br px-2 py-0.5 text-[11px] font-semibold tabular-nums ${rankAccent(displayRank)}`}>
                    {displayRank <= 3 && <Trophy className="h-3 w-3" />}
                    #{displayRank}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge r={r} />
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(v) => {
                        const next = new Set(selected);
                        if (v) next.add(r.student_id); else next.delete(r.student_id);
                        setSelected(next);
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ScoreDonut score={r.score} />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/b2b/placements/students/${r.student_id}`}
                      className="block font-medium truncate hover:underline"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] grid place-items-center text-[10px] font-semibold">
                          {initials(r.full_name, r.email)}
                        </span>
                        <span className="truncate">{r.full_name || r.email}</span>
                      </span>
                    </Link>
                    <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                      {r.roll_number ? `${r.roll_number} · ` : ""}{r.email}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground truncate">
                      {r.branch ?? "—"}
                      {r.batch_year ? ` · ${r.batch_year}` : ""}
                      {r.section ? ` · Sec ${r.section}` : ""}
                    </div>
                    <div className="mt-2 space-y-0.5 text-[11px]">
                      <div className="text-muted-foreground">
                        <span className="text-foreground font-medium">#{displayRank}</span> of {orgTotal} in org
                        {pct !== null && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-[hsl(var(--primary))]/12 text-[hsl(var(--primary))] px-1.5 py-px text-[10px] font-medium">
                            Top {pct}%
                          </span>
                        )}
                      </div>
                      {r.branch && r.rank_in_branch && (
                        <div className="text-muted-foreground">
                          <span className="text-foreground font-medium">#{r.rank_in_branch}</span> of {branchTotal} in {r.branch}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniBar
                    label="Assess"
                    value={r.avg_assessment_score ?? 0}
                    tone="bg-[hsl(var(--primary))]"
                  />
                  <MiniBar
                    label="Integrity"
                    value={r.avg_integrity ?? 0}
                    tone="bg-emerald-400"
                  />
                  <MiniBar
                    label="Engagement"
                    value={engagement}
                    tone="bg-amber-400"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex gap-3 tabular-nums">
                    <span>Apps <span className="text-foreground">{r.applications_count}</span></span>
                    <span>Short <span className="text-foreground">{r.shortlisted_count}</span></span>
                    <span>Offers <span className="text-foreground">{r.offers_count}</span></span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => setDrawerStudent(r)}
                    >
                      <BarChart3 className="h-3.5 w-3.5 mr-1" />
                      Metrics
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      <Link to={`/b2b/placements/students/${r.student_id}`}>
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Profile
                      </Link>
                    </Button>
                    <QuickSharePopover
                      orgId={orgId}
                      studentId={r.student_id}
                      studentName={r.full_name || r.email}
                      onOpenFullDialog={() => setShareTarget({ kind: "profile", studentId: r.student_id, studentName: r.full_name || r.email })}
                    />

                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--muted))]/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 w-8">
                    <Checkbox
                      checked={!!visible.length && selected.size === visible.length}
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
                {rendered.map((r, i) => (
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
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => setDrawerStudent(r)}
                          title="View metrics"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-7 px-2">
                          <Link to={`/b2b/placements/students/${r.student_id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <QuickSharePopover
                          orgId={orgId}
                          studentId={r.student_id}
                          studentName={r.full_name || r.email}
                          onOpenFullDialog={() => setShareTarget({ kind: "profile", studentId: r.student_id, studentName: r.full_name || r.email })}
                          trigger={
                            <Button size="sm" variant="ghost" className="h-7 px-2">
                              <Share2 className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {!isLoading && filteredCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 py-2 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {filteredCount === 0
              ? "No results"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredCount)} of ${filteredCount}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
            >
              Previous
            </Button>
            <span className="tabular-nums">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isFetching}
            >
              Next
            </Button>
          </div>
        </div>
      )}



      {shareTarget && (
        <ShareDialog
          orgId={orgId}
          target={shareTarget}
          onClose={() => setShareTarget(null)}
        />
      )}

      <StudentMetricsDrawer
        open={!!drawerStudent}
        onOpenChange={(v) => { if (!v) setDrawerStudent(null); }}
        ranking={drawerStudent}
        onShare={(r) => {
          setShareTarget({ kind: "profile", studentId: r.student_id, studentName: r.full_name || r.email });
        }}
      />
    </div>
  );
}
