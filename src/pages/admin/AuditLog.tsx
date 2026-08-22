import { useState, useMemo } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useFilteredAuditLog, useAuditEntityTypes } from "@/hooks/admin/useAdminControl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, RefreshCw } from "lucide-react";
import { downloadCSV, toCSV } from "@/lib/admin/csv";

const PAGE_SIZE = 50;

const AuditLog = () => {
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);

  const filters = useMemo(() => ({
    actor: actor.trim() || null,
    action: action.trim() || null,
    entityType: entityType === "all" ? null : entityType,
    from: from ? new Date(from).toISOString() : null,
    to: to ? new Date(to).toISOString() : null,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }), [actor, action, entityType, from, to, page]);

  const { data: rows = [], isLoading, refetch, isFetching } = useFilteredAuditLog(filters);
  const { data: entityTypes = [] } = useAuditEntityTypes();
  const total = rows[0]?.total_count ?? 0;

  const handleExport = () => {
    const csv = toCSV(rows.map((r) => ({
      created_at: r.created_at,
      actor_name: r.actor_name,
      actor_id: r.actor_id,
      action: r.action,
      entity_type: r.entity_type,
      entity_slug: r.entity_slug,
    })));
    downloadCSV(`audit-log-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!rows.length}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div>
            <Label className="text-xs" htmlFor="audit-action">Action contains</Label>
            <Input id="audit-action" value={action} onChange={(e) => { setAction(e.target.value); setPage(0); }} placeholder="save_problem" />
          </div>
          <div>
            <Label className="text-xs" htmlFor="audit-entity-type">Entity type</Label>
            <Select value={entityType} onValueChange={(v) => { setEntityType(v); setPage(0); }}>
              <SelectTrigger id="audit-entity-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {entityTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs" htmlFor="audit-actor">Actor ID</Label>
            <Input id="audit-actor" value={actor} onChange={(e) => { setActor(e.target.value); setPage(0); }} placeholder="uuid" />
          </div>
          <div>
            <Label className="text-xs" htmlFor="audit-from">From</Label>
            <Input id="audit-from" type="datetime-local" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} />
          </div>
          <div>
            <Label className="text-xs" htmlFor="audit-to">To</Label>
            <Input id="audit-to" type="datetime-local" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        {isLoading ? (
          <p className="text-muted-foreground"></p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">No matching entries.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.action}</span>
                    {r.entity_type && (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">{r.entity_type}</span>
                    )}
                    {r.entity_slug && (
                      <span className="font-mono text-xs text-muted-foreground">{r.entity_slug}</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    by {r.actor_name} · {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {total > 0 ? `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, Number(total))} of ${total}` : ""}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</Button>
            <Button variant="outline" size="sm"
              disabled={(page + 1) * PAGE_SIZE >= Number(total)}
              onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>
    </AdminShell>
  );
};

export default AuditLog;
