import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReports, useResolveReport } from "@/hooks/admin/useAdminControl";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Reports = () => {
  const [tab, setTab] = useState<"open" | "resolved" | "dismissed">("open");
  const { data = [], isLoading } = useReports(tab);
  const resolve = useResolveReport();

  return (
    <AdminShell>
      <h1 className="mb-1 text-2xl font-bold">Reports</h1>
      <p className="mb-4 text-sm text-muted-foreground">User-submitted abuse reports.</p>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="mt-4 p-4">
        {isLoading ? <p className="text-sm text-muted-foreground"></p> : (
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-border/50">
                <th className="px-2 py-2">When</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Target</th>
                <th className="px-2 py-2">Reason</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data as any[]).map((r) => (
                <tr key={r.id} className="border-b border-border/30">
                  <td className="px-2 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-2 py-3"><Badge variant="outline">{r.target_type}</Badge></td>
                  <td className="px-2 py-3 font-mono text-xs">{r.target_id}</td>
                  <td className="px-2 py-3">{r.reason}</td>
                  <td className="px-2 py-3 text-right">
                    {tab === "open" && (
                      <>
                        <Button size="sm" variant="outline" className="mr-1"
                          onClick={() => resolve.mutate({ id: r.id, status: "resolved" })}>Resolve</Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => resolve.mutate({ id: r.id, status: "dismissed" })}>Dismiss</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No reports</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </AdminShell>
  );
};

export default Reports;
