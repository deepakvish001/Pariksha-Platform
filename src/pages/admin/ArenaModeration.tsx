import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Flag, ShieldAlert, Check, X, Ban, Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

type ReportStatus = "pending" | "resolved" | "dismissed";
interface PlayerReport {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  admin_notes: string | null;
}
interface BlockRow {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}
interface ProfileRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const PAGE_SIZE = 20;
const REASONS = [
  "All",
  "Inappropriate behavior",
  "Cheating / unfair play",
  "Harassment",
  "Spam",
  "Impersonation",
  "Other",
];

type BulkAction =
  | { kind: "report"; status: "resolved" | "dismissed"; ids: string[] }
  | { kind: "block-remove"; ids: string[] };

export default function ArenaModeration() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"reports" | "blocks">("reports");
  const [statusTab, setStatusTab] = useState<ReportStatus>("pending");

  const [reports, setReports] = useState<PlayerReport[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileRow>>(new Map());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Filters
  const [reasonFilter, setReasonFilter] = useState<string>("All");
  const [reporterFilter, setReporterFilter] = useState("");
  const [reportedFilter, setReportedFilter] = useState("");
  const [blockerFilter, setBlockerFilter] = useState("");
  const [blockedFilter, setBlockedFilter] = useState("");

  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Selection
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());

  // Confirmation
  const [pendingBulk, setPendingBulk] = useState<BulkAction | null>(null);

  const loadProfilesFor = useCallback(
    async (ids: string[]) => {
      const missing = Array.from(new Set(ids.filter((id) => id && !profiles.has(id))));
      if (missing.length === 0) return;
      const { data } = await supabase
        .from("profiles")
        .select("user_id,full_name,avatar_url")
        .in("user_id", missing);
      setProfiles((prev) => {
        const next = new Map(prev);
        for (const p of data ?? []) next.set(p.user_id, p as ProfileRow);
        return next;
      });
    },
    [profiles],
  );

  async function resolveUserIdsByName(q: string): Promise<string[] | null> {
    const t = q.trim();
    if (!t) return null;
    const { data } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("full_name", `%${t}%`)
      .limit(50);
    return (data ?? []).map((r) => r.user_id);
  }

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const [reporterIds, reportedIds] = await Promise.all([
        resolveUserIdsByName(reporterFilter),
        resolveUserIdsByName(reportedFilter),
      ]);
      let query = supabase
        .from("player_reports" as never)
        .select("*", { count: "exact" })
        .eq("status", statusTab);

      if (reasonFilter !== "All") query = query.eq("reason", reasonFilter);
      if (reporterIds) {
        if (reporterIds.length === 0) {
          setReports([]); setTotal(0); setLoading(false); return;
        }
        query = query.in("reporter_id", reporterIds);
      }
      if (reportedIds) {
        if (reportedIds.length === 0) {
          setReports([]); setTotal(0); setLoading(false); return;
        }
        query = query.in("reported_id", reportedIds);
      }

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) toast.error(error.message);
      const rows = (data ?? []) as PlayerReport[];
      setReports(rows);
      setTotal(count ?? 0);
      await loadProfilesFor(rows.flatMap((r) => [r.reporter_id, r.reported_id]));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab, reasonFilter, reporterFilter, reportedFilter, page]);

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const [blockerIds, blockedIds] = await Promise.all([
        resolveUserIdsByName(blockerFilter),
        resolveUserIdsByName(blockedFilter),
      ]);
      let query = supabase.from("user_blocks" as never).select("*", { count: "exact" });
      if (blockerIds) {
        if (blockerIds.length === 0) {
          setBlocks([]); setTotal(0); setLoading(false); return;
        }
        query = query.in("blocker_id", blockerIds);
      }
      if (blockedIds) {
        if (blockedIds.length === 0) {
          setBlocks([]); setTotal(0); setLoading(false); return;
        }
        query = query.in("blocked_id", blockedIds);
      }

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) toast.error(error.message);
      const rows = (data ?? []) as BlockRow[];
      setBlocks(rows);
      setTotal(count ?? 0);
      await loadProfilesFor(rows.flatMap((r) => [r.blocker_id, r.blocked_id]));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockerFilter, blockedFilter, page]);

  // Reset page on tab/filter change
  useEffect(() => {
    setPage(0);
    setSelectedReports(new Set());
    setSelectedBlocks(new Set());
  }, [tab, statusTab, reasonFilter, reporterFilter, reportedFilter, blockerFilter, blockedFilter]);

  useEffect(() => {
    if (tab === "reports") loadReports();
    else loadBlocks();
  }, [tab, loadReports, loadBlocks]);

  async function resolveReport(r: PlayerReport, status: "resolved" | "dismissed") {
    if (!user) return;
    const { error } = await supabase
      .from("player_reports" as never)
      .update({
        status,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        admin_notes: notes[r.id] ?? r.admin_notes ?? null,
      } as never)
      .eq("id", r.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Report ${status}`);
      loadReports();
    }
  }

  // Bulk actions (executed after confirmation)
  async function executeBulk(action: BulkAction) {
    if (!user) return;
    if (action.kind === "report") {
      const { error } = await supabase
        .from("player_reports" as never)
        .update({
          status: action.status,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        } as never)
        .in("id", action.ids);
      if (error) toast.error(error.message);
      else {
        toast.success(`${action.ids.length} report(s) ${action.status}`);
        setSelectedReports(new Set());
        loadReports();
      }
    } else {
      const { error } = await supabase
        .from("user_blocks" as never)
        .delete()
        .in("id", action.ids);
      if (error) toast.error(error.message);
      else {
        toast.success(`Removed ${action.ids.length} block(s)`);
        setSelectedBlocks(new Set());
        loadBlocks();
      }
    }
  }

  function profileFor(id: string) {
    return profiles.get(id);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min(total, (page + 1) * PAGE_SIZE);

  const Pager = (
    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
      <span>
        {total === 0 ? "0" : `${showingFrom}–${showingTo}`} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span>Page {page + 1} / {totalPages}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1 || loading}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  const allReportsSelected = reports.length > 0 && reports.every((r) => selectedReports.has(r.id));
  const allBlocksSelected = blocks.length > 0 && blocks.every((b) => selectedBlocks.has(b.id));

  function toggleAllReports() {
    setSelectedReports((prev) => {
      if (allReportsSelected) return new Set();
      return new Set(reports.map((r) => r.id));
    });
  }
  function toggleAllBlocks() {
    setSelectedBlocks((prev) => {
      if (allBlocksSelected) return new Set();
      return new Set(blocks.map((b) => b.id));
    });
  }

  const confirmText = useMemo(() => {
    if (!pendingBulk) return "";
    if (pendingBulk.kind === "report") {
      return `${pendingBulk.status === "resolved" ? "Resolve" : "Dismiss"} ${pendingBulk.ids.length} report(s)? This cannot be undone.`;
    }
    return `Remove ${pendingBulk.ids.length} block(s)? Affected users will be able to interact again.`;
  }, [pendingBulk]);

  return (
    <AdminShell>
      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert className="h-5 w-5 text-amber-400" />
        <h1 className="text-2xl font-bold">Arena Moderation</h1>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Review reported arena players and audit user blocks.
      </p>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="reports">
            <Flag className="h-3.5 w-3.5 mr-1" /> Reports
          </TabsTrigger>
          <TabsTrigger value="blocks">
            <Ban className="h-3.5 w-3.5 mr-1" /> Blocks
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "reports" && (
        <>
          <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as ReportStatus)} className="mt-3">
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Reporter name…"
                value={reporterFilter}
                onChange={(e) => setReporterFilter(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Reported user name…"
                value={reportedFilter}
                onChange={(e) => setReportedFilter(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="bg-card/60 border border-border rounded p-2 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Bulk action bar */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Checkbox checked={allReportsSelected} onCheckedChange={toggleAllReports} aria-label="Select all" />
            <span className="text-xs text-muted-foreground">
              {selectedReports.size > 0 ? `${selectedReports.size} selected` : "Select all on page"}
            </span>
            {selectedReports.size > 0 && (
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPendingBulk({ kind: "report", status: "dismissed", ids: Array.from(selectedReports) })}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Dismiss selected
                </Button>
                <Button
                  size="sm"
                  onClick={() => setPendingBulk({ kind: "report", status: "resolved", ids: Array.from(selectedReports) })}
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Resolve selected
                </Button>
              </div>
            )}
          </div>

          <Card className="mt-3 p-4 space-y-3">
            {loading && <p className="text-sm text-muted-foreground"></p>}
            {!loading && reports.length === 0 && (
              <p className="text-sm text-muted-foreground/60">No matching {statusTab} reports.</p>
            )}
            {reports.map((r) => {
              const reporter = profileFor(r.reporter_id);
              const reported = profileFor(r.reported_id);
              const checked = selectedReports.has(r.id);
              return (
                <div key={r.id} className="rounded-lg border border-border/60 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={checked}
                        aria-label="Select report"
                        onCheckedChange={(v) => {
                          setSelectedReports((prev) => {
                            const next = new Set(prev);
                            if (v) next.add(r.id);
                            else next.delete(r.id);
                            return next;
                          });
                        }}
                      />
                      <Badge variant="outline">{r.reason}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>
                    <Badge
                      variant={r.status === "pending" ? "default" : r.status === "resolved" ? "secondary" : "outline"}
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={reported?.avatar_url ?? undefined} />
                        <AvatarFallback>{(reported?.full_name ?? "?").slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase text-muted-foreground">Reported</div>
                        <div className="truncate font-medium">{reported?.full_name ?? r.reported_id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={reporter?.avatar_url ?? undefined} />
                        <AvatarFallback>{(reporter?.full_name ?? "?").slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase text-muted-foreground">Reporter</div>
                        <div className="truncate">{reporter?.full_name ?? r.reporter_id}</div>
                      </div>
                    </div>
                  </div>
                  {r.details && (
                    <div className="rounded bg-muted/40 p-2 text-sm whitespace-pre-wrap">{r.details}</div>
                  )}
                  {r.status === "pending" ? (
                    <>
                      <Textarea
                        placeholder="Admin notes (optional)"
                        value={notes[r.id] ?? ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => resolveReport(r, "dismissed")}>
                          <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                        </Button>
                        <Button size="sm" onClick={() => resolveReport(r, "resolved")}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Resolve
                        </Button>
                      </div>
                    </>
                  ) : (
                    r.admin_notes && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Notes:</span> {r.admin_notes}
                      </div>
                    )
                  )}
                </div>
              );
            })}
            {Pager}
          </Card>
        </>
      )}

      {tab === "blocks" && (
        <>
          {/* Filters */}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Blocker name…"
                value={blockerFilter}
                onChange={(e) => setBlockerFilter(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Blocked user name…"
                value={blockedFilter}
                onChange={(e) => setBlockedFilter(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Bulk action bar */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Checkbox checked={allBlocksSelected} onCheckedChange={toggleAllBlocks} aria-label="Select all" />
            <span className="text-xs text-muted-foreground">
              {selectedBlocks.size > 0 ? `${selectedBlocks.size} selected` : "Select all on page"}
            </span>
            {selectedBlocks.size > 0 && (
              <div className="ml-auto">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setPendingBulk({ kind: "block-remove", ids: Array.from(selectedBlocks) })}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Unblock / remove selected
                </Button>
              </div>
            )}
          </div>

          <Card className="mt-3 p-4 space-y-2">
            {loading && <p className="text-sm text-muted-foreground"></p>}
            {!loading && blocks.length === 0 && (
              <p className="text-sm text-muted-foreground/60">No matching blocks.</p>
            )}
            {blocks.map((b) => {
              const blocker = profileFor(b.blocker_id);
              const blocked = profileFor(b.blocked_id);
              const checked = selectedBlocks.has(b.id);
              return (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5 text-sm">
                  <Checkbox
                    checked={checked}
                    aria-label="Select block"
                    onCheckedChange={(v) => {
                      setSelectedBlocks((prev) => {
                        const next = new Set(prev);
                        if (v) next.add(b.id);
                        else next.delete(b.id);
                        return next;
                      });
                    }}
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={blocker?.avatar_url ?? undefined} />
                      <AvatarFallback>{(blocker?.full_name ?? "?").slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{blocker?.full_name ?? b.blocker_id}</span>
                  </div>
                  <Ban className="h-3.5 w-3.5 text-red-400" />
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <span className="truncate text-right">{blocked?.full_name ?? b.blocked_id}</span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={blocked?.avatar_url ?? undefined} />
                      <AvatarFallback>{(blocked?.full_name ?? "?").slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(b.created_at).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
            {Pager}
          </Card>
        </>
      )}

      {/* Bulk confirmation */}
      <AlertDialog open={!!pendingBulk} onOpenChange={(o) => !o && setPendingBulk(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm bulk action</AlertDialogTitle>
            <AlertDialogDescription>{confirmText}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingBulk) executeBulk(pendingBulk);
                setPendingBulk(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
