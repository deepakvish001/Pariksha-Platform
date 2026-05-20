import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { RefreshCw, Copy, Smartphone, ScrollText } from "lucide-react";
import { toast } from "sonner";

type Status = "all" | "pending" | "paired" | "disconnected" | "expired" | "closed";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "paired", label: "Paired" },
  { value: "disconnected", label: "Disconnected" },
  { value: "expired", label: "Expired" },
  { value: "closed", label: "Closed" },
];

const STATUS_TONE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  paired: "bg-emerald-500/15 text-emerald-600 border-emerald-500/40",
  disconnected: "bg-amber-500/15 text-amber-600 border-amber-500/40",
  expired: "bg-amber-500/15 text-amber-600 border-amber-500/40",
  closed: "bg-slate-500/15 text-slate-500 border-slate-500/40",
};

const fmt = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString() : "—";

export default function SideCamPairings() {
  const [status, setStatus] = useState<Status>("all");
  const [search, setSearch] = useState("");
  const [openAttempt, setOpenAttempt] = useState<string | null>(null);

  const events = useQuery({
    queryKey: ["admin-sidecam-events", openAttempt],
    enabled: !!openAttempt,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attempt_events")
        .select("id, kind, payload, created_at")
        .eq("attempt_id", openAttempt!)
        .like("kind", "side_eye_%")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-sidecam-pairings", status],
    queryFn: async () => {
      let q = supabase
        .from("assessment_side_camera_pairings")
        .select(
          "id, attempt_id, status, pair_code, created_at, paired_at, last_seen_at, closed_at, updated_at",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 15000,
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter(
      (r) =>
        r.attempt_id.toLowerCase().includes(term) ||
        r.pair_code.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term),
    );
  }, [data, search]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    (data ?? []).forEach((r) => (acc[r.status] = (acc[r.status] ?? 0) + 1));
    return acc;
  }, [data]);

  const copy = async (text: string, label = "Copied") => {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  };

  return (
    <AdminShell>
      <Helmet>
        <title>Third Eye Pairings · Admin</title>
        <meta name="description" content="Inspect Third Eye phone pairings across assessments — filter by status and review timestamps." />
      </Helmet>

      <div className="space-y-4">
        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Third Eye Pairings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Phone pairings for assessment attempts. Updated every 15 s.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </header>

        <Card className="p-4 flex flex-wrap items-center gap-3">
          <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search attempt id, pair code, pairing id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md flex-1 min-w-[200px]"
          />
          <div className="flex flex-wrap gap-1.5 ml-auto text-xs">
            {(["pending","paired","disconnected","expired","closed"] as const).map((s) => (
              <Badge key={s} variant="outline" className={STATUS_TONE[s]}>
                {s}: {counts[s] ?? 0}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempt ID</TableHead>
                  <TableHead>Pair code</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Paired</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead className="text-right">Audit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                      No pairings match this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_TONE[r.status] ?? ""}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => copy(r.attempt_id, "Attempt ID copied")}
                          className="font-mono text-xs hover:text-primary inline-flex items-center gap-1"
                          title="Copy attempt id"
                        >
                          {r.attempt_id.slice(0, 8)}…{r.attempt_id.slice(-4)}
                          <Copy className="h-3 w-3 opacity-50" />
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-xs tracking-widest">{r.pair_code}</TableCell>
                      <TableCell className="text-xs">{fmt(r.created_at)}</TableCell>
                      <TableCell className="text-xs">{fmt(r.paired_at)}</TableCell>
                      <TableCell className="text-xs">{fmt(r.last_seen_at)}</TableCell>
                      <TableCell className="text-xs">{fmt(r.closed_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
        <p className="text-[11px] text-muted-foreground">
          Showing up to 500 most recent pairings. Refine with the status filter.
        </p>
      </div>
    </AdminShell>
  );
}
