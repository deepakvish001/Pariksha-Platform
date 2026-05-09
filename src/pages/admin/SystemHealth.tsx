import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Activity, Users, FileCode2, Zap, Sparkles, ScrollText, Flag, HardDrive } from "lucide-react";
import { useSystemHealth, useAdminStorageStats } from "@/hooks/admin/useAdminControl";

const fmtBytes = (n: number) => {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
};

const Stat = ({ icon: Icon, label, value, hint }: any) => (
  <Card className="p-4">
    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
    <div className="text-2xl font-semibold">{value ?? "—"}</div>
    {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
  </Card>
);

const SystemHealth = () => {
  const { data: h, isLoading } = useSystemHealth();
  const { data: storage } = useAdminStorageStats();

  return (
    <AdminShell>
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
        <Activity className="h-5 w-5 text-primary" /> System Health
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Live snapshot of platform activity. Auto-refreshes every 30s.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground"></p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat icon={Users} label="Users (total)" value={h?.users_total} hint={`+${h?.users_24h ?? 0} in 24h`} />
            <Stat icon={FileCode2} label="Coding problems" value={h?.problems_total} />
            <Stat icon={Zap} label="Submissions" value={h?.submissions_total} hint={`+${h?.submissions_24h ?? 0} in 24h`} />
            <Stat icon={Sparkles} label="AI content items" value={h?.ai_content_total} />
            <Stat icon={ScrollText} label="Audit events (24h)" value={h?.audit_24h} />
            <Stat icon={Flag} label="Open reports" value={h?.reports_open} />
          </div>

          <h2 className="mb-2 mt-8 flex items-center gap-2 text-lg font-semibold">
            <HardDrive className="h-4 w-4" /> Storage usage
          </h2>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-4 py-2">Bucket</th>
                  <th className="px-4 py-2">Objects</th>
                  <th className="px-4 py-2">Size</th>
                </tr>
              </thead>
              <tbody>
                {(storage ?? []).map((b) => (
                  <tr key={b.bucket_id} className="border-b border-border/30">
                    <td className="px-4 py-2 font-mono text-xs">{b.bucket_id}</td>
                    <td className="px-4 py-2">{Number(b.object_count).toLocaleString()}</td>
                    <td className="px-4 py-2">{fmtBytes(Number(b.total_bytes))}</td>
                  </tr>
                ))}
                {(storage ?? []).length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">No data</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </AdminShell>
  );
};

export default SystemHealth;
