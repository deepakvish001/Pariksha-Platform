import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ShieldAlert,
  Sparkles,
  Mic,
  ScanFace,
  RefreshCw,
  ExternalLink,
  Inbox,
} from "lucide-react";
import { format } from "date-fns";

type AdminAlertType =
  | "contest_similarity_alert"
  | "contest_viva_alert"
  | "contest_identity_alert";

interface AdminAlertRow {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> & {
    contest_id?: string;
    user_id?: string;
    user_a?: string;
    user_b?: string;
    session_id?: string;
    similarity?: number;
    verdict?: string;
    problem_slug?: string;
    rationale?: string;
    match_score?: number;
  };
  read: boolean;
  created_at: string;
}

const TYPES: { value: AdminAlertType | "all"; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All alerts", icon: <ShieldAlert className="h-3.5 w-3.5" /> },
  { value: "contest_similarity_alert", label: "Similarity", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { value: "contest_viva_alert", label: "Viva", icon: <Mic className="h-3.5 w-3.5" /> },
  { value: "contest_identity_alert", label: "Identity", icon: <ScanFace className="h-3.5 w-3.5" /> },
];

const VERDICTS = ["all", "flag", "dq", "failed", "pending"];

const verdictTone: Record<string, string> = {
  flag: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  dq: "bg-red-500/15 text-red-400 border-red-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const typeTone: Record<string, string> = {
  contest_similarity_alert: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  contest_viva_alert: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  contest_identity_alert: "bg-pink-500/15 text-pink-300 border-pink-500/30",
};

export default function AdminAlerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<string>("all");
  const [contestFilter, setContestFilter] = useState<string>("all");
  const [verdict, setVerdict] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminAlertRow | null>(null);

  const alertsQuery = useQuery({
    queryKey: ["admin-alerts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, title, message, data, read, created_at")
        .eq("user_id", user!.id)
        .in("type", [
          "contest_similarity_alert",
          "contest_viva_alert",
          "contest_identity_alert",
        ])
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AdminAlertRow[];
    },
    refetchInterval: 30_000,
  });

  const contests = useMemo(() => {
    const map = new Map<string, string>();
    (alertsQuery.data ?? []).forEach((a) => {
      const cid = a.data?.contest_id;
      if (typeof cid === "string") map.set(cid, cid);
    });
    return Array.from(map.keys());
  }, [alertsQuery.data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (alertsQuery.data ?? []).filter((a) => {
      if (type !== "all" && a.type !== type) return false;
      if (contestFilter !== "all" && a.data?.contest_id !== contestFilter) return false;
      if (verdict !== "all") {
        const v = a.data?.verdict;
        if (v !== verdict) return false;
      }
      if (q) {
        const hay = [
          a.title,
          a.message,
          a.data?.user_id,
          a.data?.user_a,
          a.data?.user_b,
          a.data?.session_id,
          a.data?.problem_slug,
          a.data?.rationale,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [alertsQuery.data, type, contestFilter, verdict, search]);

  const unread = (alertsQuery.data ?? []).filter((a) => !a.read).length;

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .in("type", [
        "contest_similarity_alert",
        "contest_viva_alert",
        "contest_identity_alert",
      ])
      .eq("read", false);
    alertsQuery.refetch();
  };

  const openDetails = async (a: AdminAlertRow) => {
    setSelected(a);
    if (!a.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", a.id);
      alertsQuery.refetch();
    }
  };

  const stats = useMemo(() => {
    const list = alertsQuery.data ?? [];
    return {
      total: list.length,
      similarity: list.filter((a) => a.type === "contest_similarity_alert").length,
      viva: list.filter((a) => a.type === "contest_viva_alert").length,
      identity: list.filter((a) => a.type === "contest_identity_alert").length,
      dq: list.filter((a) => a.data?.verdict === "dq").length,
    };
  }, [alertsQuery.data]);

  return (
    <AdminShell>
      <Helmet>
        <title>Contest Alerts | Admin</title>
      </Helmet>
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <ShieldAlert className="h-6 w-6 text-amber-400" /> Contest Alerts
            </h1>
            <p className="text-sm text-muted-foreground">
              Auto-flag and auto-DQ events from similarity, viva, and identity checks.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => alertsQuery.refetch()}
              disabled={alertsQuery.isFetching}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${alertsQuery.isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button size="sm" variant="ghost" onClick={markAllRead} disabled={!unread}>
              Mark all read ({unread})
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: "Total alerts", value: stats.total },
            { label: "Similarity", value: stats.similarity },
            { label: "Viva", value: stats.viva },
            { label: "Identity", value: stats.identity },
            { label: "Auto-DQ events", value: stats.dq },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-semibold">{s.value}</div>
            </Card>
          ))}
        </div>

        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-44" data-testid="alerts-type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      {t.icon} {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={contestFilter} onValueChange={setContestFilter}>
              <SelectTrigger className="w-56" data-testid="alerts-contest-filter">
                <SelectValue placeholder="Contest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All contests</SelectItem>
                {contests.map((cid) => (
                  <SelectItem key={cid} value={cid}>
                    {cid.slice(0, 8)}…
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={verdict} onValueChange={setVerdict}>
              <SelectTrigger className="w-40" data-testid="alerts-verdict-filter">
                <SelectValue placeholder="Verdict" />
              </SelectTrigger>
              <SelectContent>
                {VERDICTS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v === "all" ? "All verdicts" : v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search user, session, problem, rationale…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
              data-testid="alerts-search"
            />
            <div className="ml-auto text-xs text-muted-foreground">
              {filtered.length} of {alertsQuery.data?.length ?? 0}
            </div>
          </div>
        </Card>

        <Card>
          {alertsQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <Inbox className="h-8 w-8" />
              <p>No alerts match these filters.</p>
              <p className="text-xs">Auto-flagged similarity (≥85%), auto-DQ (≥95%), and identity failures will appear here in real-time.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => {
                  const score =
                    typeof a.data?.similarity === "number"
                      ? `${(a.data.similarity * 100).toFixed(1)}%`
                      : typeof a.data?.match_score === "number"
                        ? `${(a.data.match_score * 100).toFixed(1)}%`
                        : "—";
                  const v = a.data?.verdict ?? (a.type === "contest_identity_alert" ? "failed" : "—");
                  return (
                    <TableRow
                      key={a.id}
                      className={a.read ? "" : "bg-primary/5"}
                      data-testid="alert-row"
                    >
                      <TableCell className="whitespace-nowrap text-xs">
                        {format(new Date(a.created_at), "PP p")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={typeTone[a.type] ?? ""}
                        >
                          {a.type.replace("contest_", "").replace("_alert", "")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-sm font-medium">{a.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {a.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={verdictTone[v as string] ?? ""}
                        >
                          {v}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{score}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDetails(a)}
                            data-testid="alert-details-btn"
                          >
                            Details
                          </Button>
                          {a.data?.contest_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                navigate(`/admin/contests/${a.data.contest_id}/proctor`)
                              }
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Badge variant="outline" className={typeTone[selected.type] ?? ""}>
                    {selected.type.replace("contest_", "").replace("_alert", "")}
                  </Badge>
                  {selected.title}
                </SheetTitle>
                <SheetDescription>{selected.message}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">When</div>
                  <div>{format(new Date(selected.created_at), "PPP p")}</div>
                </div>
                {selected.data?.contest_id && (
                  <div>
                    <div className="text-xs text-muted-foreground">Contest</div>
                    <div className="font-mono text-xs">{selected.data.contest_id}</div>
                    <Button
                      size="sm"
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() =>
                        navigate(`/admin/contests/${selected.data.contest_id}/proctor`)
                      }
                    >
                      Open proctor view →
                    </Button>
                  </div>
                )}
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">Full payload</div>
                  <pre
                    data-testid="alert-payload-json"
                    className="max-h-96 overflow-auto rounded-md border border-border/60 bg-muted/30 p-3 text-[11px] leading-relaxed"
                  >
                    {JSON.stringify(selected.data, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
}
