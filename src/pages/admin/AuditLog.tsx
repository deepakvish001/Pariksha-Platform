import { AdminShell } from "@/components/admin/AdminShell";
import { useAuditLog } from "@/hooks/useAdminProblems";
import { Card } from "@/components/ui/card";

const AuditLog = () => {
  const { data: rows = [], isLoading } = useAuditLog();
  return (
    <AdminShell>
      <h1 className="mb-4 text-2xl font-bold">Audit Log</h1>
      <Card className="p-4">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">No actions yet.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
                <div>
                  <span className="font-medium">{r.action}</span>{" "}
                  <span className="text-muted-foreground">on</span>{" "}
                  <span className="font-mono text-xs">{r.entity_slug ?? "—"}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  by {r.actor_id?.slice(0, 8)}… · {new Date(r.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminShell>
  );
};

export default AuditLog;
