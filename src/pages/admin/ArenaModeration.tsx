import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Flag, ShieldAlert, Check, X, Ban, Search, ChevronLeft, ChevronRight } from "lucide-react";

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

export default function ArenaModeration() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"reports" | "blocks">("reports");
  const [statusTab, setStatusTab] = useState<ReportStatus>("pending");

  const [reports, setReports] = useState<PlayerReport[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileRow>>(new Map());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Search + pagination state
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState<string>("All");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

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

  // Resolve search query to a list of user_ids that match
  async function resolveSearchUserIds(): Promise<string[] | null> {
    const q = search.trim();
    if (!q) return null;
    const { data } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("full_name", `%${q}%`)
      .limit(50);
    return (data ?? []).map((r) => r.user_id);
  }

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const matchIds = await resolveSearchUserIds();
      let query = supabase
        .from("player_reports" as never)
        .select("*", { count: "exact" })
        .eq("status", statusTab);

      if (reasonFilter !== "All") query = query.eq("reason", reasonFilter);
      if (matchIds) {
        if (matchIds.length === 0) {
          setReports([]);
          setTotal(0);
          setLoading(false);
          return;
        }
        const list = matchIds.join(",");
        query = query.or(`reported_id.in.(${list}),reporter_id.in.(${list})`);
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
  }, [statusTab, reasonFilter, search, page]);

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const matchIds = await resolveSearchUserIds();
      let query = supabase.from("user_blocks" as never).select("*", { count: "exact" });
      if (matchIds) {
        if (matchIds.length === 0) {
          setBlocks([]);
          setTotal(0);
          setLoading(false);
          return;
        }
        const list = matchIds.join(",");
        query = query.or(`blocker_id.in.(${list}),blocked_id.in.(${list})`);
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
  }, [search, page]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [tab, statusTab, reasonFilter, search]);

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

  function profileFor(id: string) {
    return profiles.get(id);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min(total, (page + 1) * PAGE_SIZE);

  const Pager = useMemo(
    () => (
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
        <span>
          {total === 0 ? "0" : `${showingFrom}–${showingTo}`} of {total}
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span>
            Page {page + 1} / {totalPages}
          </span>
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
    ),
    [page, totalPages, total, loading, showingFrom, showingTo],
  );

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

      {/* Shared search */}
      <div className="mt-3 flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by user name (reporter, reported, blocker, blocked)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {tab === "reports" && (
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="bg-card/60 border border-border rounded p-2 text-sm"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}
      </div>

      {tab === "reports" && (
        <>
          <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as ReportStatus)} className="mt-3">
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="mt-4 p-4 space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!loading && reports.length === 0 && (
              <p className="text-sm text-muted-foreground/60">No matching {statusTab} reports.</p>
            )}
            {reports.map((r) => {
              const reporter = profileFor(r.reporter_id);
              const reported = profileFor(r.reported_id);
              return (
                <div key={r.id} className="rounded-lg border border-border/60 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{r.reason}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>
                    <Badge
                      variant={
                        r.status === "pending" ? "default" : r.status === "resolved" ? "secondary" : "outline"
                      }
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
        <Card className="mt-4 p-4 space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && blocks.length === 0 && (
            <p className="text-sm text-muted-foreground/60">No matching blocks.</p>
          )}
          {blocks.map((b) => {
            const blocker = profileFor(b.blocker_id);
            const blocked = profileFor(b.blocked_id);
            return (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5 text-sm"
              >
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
      )}
    </AdminShell>
  );
}
