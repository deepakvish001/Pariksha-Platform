import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useRecentAuthEvents } from "@/hooks/admin/useAdminMisc";
import { formatDistanceToNow } from "date-fns";

export default function SecurityCenter() {
  const { data, isLoading } = useRecentAuthEvents(100);

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <div>
            <h1 className="text-xl font-semibold">Security Center</h1>
            <p className="text-sm text-muted-foreground">
              Recent auth events and security signals.
            </p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent auth events</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !data?.length ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No events.</p>
            ) : (
              <div className="divide-y divide-border/40 text-sm">
                {data.map((e) => (
                  <div key={e.id} className="grid grid-cols-[auto_auto_1fr_auto] gap-3 py-2 items-center">
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted/50">
                      {e.action || "—"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {e.payload?.actor_username || e.payload?.actor_id || "system"}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {e.ip_address || "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
