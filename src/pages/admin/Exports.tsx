import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { exportAdminUsers, exportAdminSubmissions } from "@/hooks/admin/useAdminControl";
import { toCSV, downloadCSV } from "@/lib/admin/csv";
import { toast } from "@/hooks/use-toast";

const Exports = () => {
  const [userLimit, setUserLimit] = useState(5000);
  const [subDays, setSubDays] = useState(30);
  const [subLimit, setSubLimit] = useState(10000);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<any[]>, filename: string) => {
    setBusy(key);
    try {
      const rows = await fn();
      if (!rows.length) {
        toast({ title: "Nothing to export", description: "Query returned 0 rows" });
        return;
      }
      downloadCSV(filename, toCSV(rows));
      toast({ title: "Exported", description: `${rows.length} rows downloaded` });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminShell>
      <h1 className="mb-4 text-2xl font-bold">Data Exports</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Download flat CSV snapshots of platform data for analysis or backup.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 font-semibold">Users</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Email, profile, XP, level, suspension state, and roles.
          </p>
          <div className="mb-3">
            <Label className="text-xs">Max rows</Label>
            <Input
              type="number" min={1} max={50000} value={userLimit}
              onChange={(e) => setUserLimit(Number(e.target.value))}
            />
          </div>
          <Button
            onClick={() => run("users", () => exportAdminUsers(userLimit), `users-${Date.now()}.csv`)}
            disabled={busy === "users"}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {busy === "users" ? "Exporting…" : "Export Users CSV"}
          </Button>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 font-semibold">Code Submissions</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            All submissions within the time window with verdict and runtime stats.
          </p>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Days</Label>
              <Input type="number" min={1} max={365} value={subDays}
                onChange={(e) => setSubDays(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Max rows</Label>
              <Input type="number" min={1} max={100000} value={subLimit}
                onChange={(e) => setSubLimit(Number(e.target.value))} />
            </div>
          </div>
          <Button
            onClick={() => run("subs", () => exportAdminSubmissions(subDays, subLimit), `submissions-${Date.now()}.csv`)}
            disabled={busy === "subs"}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {busy === "subs" ? "Exporting…" : "Export Submissions CSV"}
          </Button>
        </Card>
      </div>
    </AdminShell>
  );
};

export default Exports;
