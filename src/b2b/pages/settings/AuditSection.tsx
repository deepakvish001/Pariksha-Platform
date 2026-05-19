import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { History, Download, RefreshCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AuditRow {
  id: string;
  org_id: string;
  actor_id: string | null;
  action: string;
  target: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface Props {
  orgId: string;
}

const PAGE_SIZE = 50;

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function toCsv(rows: AuditRow[]): string {
  const head = ["created_at", "action", "target", "actor_id", "metadata"].join(",");
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const body = rows
    .map((r) =>
      [
        r.created_at,
        r.action,
        r.target ?? "",
        r.actor_id ?? "",
        JSON.stringify(r.metadata ?? {}),
      ]
        .map(esc)
        .join(","),
    )
    .join("\n");
  return `${head}\n${body}`;
}

export function AuditSection({ orgId }: Props) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["b2b", "audit", orgId],
    queryFn: async (): Promise<AuditRow[]> => {
      const { data, error } = await supabase
        .from("b2b_org_audit")
        .select("id, org_id, actor_id, action, target, metadata, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });

  const actions = useMemo(() => {
    const s = new Set<string>();
    (data ?? []).forEach((r) => s.add(r.action));
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      if (!q) return true;
      return (
        r.action.toLowerCase().includes(q) ||
        (r.target ?? "").toLowerCase().includes(q) ||
        JSON.stringify(r.metadata ?? {}).toLowerCase().includes(q)
      );
    });
  }, [data, search, actionFilter]);

  const visible = filtered.slice(0, PAGE_SIZE);

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="b2b-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <History className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <h2 className="text-sm font-semibold">Audit log</h2>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
          Read-only record of changes to this organization. Showing the most recent 500 entries.
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, target or metadata"
              className="pl-8 h-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="text-xs text-[hsl(var(--muted-foreground))] py-8 text-center">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="text-xs text-[hsl(var(--muted-foreground))] py-8 text-center">
            No audit entries yet. Actions you take in settings and team management will show up here.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-[hsl(var(--border))]">
            <table className="w-full text-xs">
              <thead className="bg-[hsl(var(--muted))]/40 text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="text-left font-medium px-3 py-2 w-[110px]">When</th>
                  <th className="text-left font-medium px-3 py-2 w-[180px]">Action</th>
                  <th className="text-left font-medium px-3 py-2">Target</th>
                  <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">Details</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-t border-[hsl(var(--border))]">
                    <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]" title={new Date(r.created_at).toLocaleString()}>
                      {formatRelative(r.created_at)}
                    </td>
                    <td className="px-3 py-2 font-mono">{r.action}</td>
                    <td className="px-3 py-2 truncate max-w-[200px]" title={r.target ?? ""}>
                      {r.target ?? <span className="text-[hsl(var(--muted-foreground))]">—</span>}
                    </td>
                    <td className="px-3 py-2 text-[hsl(var(--muted-foreground))] hidden sm:table-cell">
                      <code className="text-[10px] break-all">
                        {r.metadata && Object.keys(r.metadata).length > 0 ? JSON.stringify(r.metadata) : "—"}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > PAGE_SIZE && (
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2">
            Showing the most recent {PAGE_SIZE} of {filtered.length} matches — use the CSV export for the full list.
          </p>
        )}
      </div>
    </div>
  );
}
