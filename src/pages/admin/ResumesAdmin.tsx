import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ExternalLink, FileText } from "lucide-react";
import { AdminUserPicker } from "@/components/admin/AdminUserPicker";
import type { AdminUserHit } from "@/hooks/admin/useAdminUserSearch";
import { useAdminResumes, useAdminResumeStats, useDeleteResume } from "@/hooks/admin/useAdminCoverage";

const ResumesAdmin = () => {
  const [user, setUser] = useState<AdminUserHit | null>(null);
  const stats = useAdminResumeStats();
  const list = useAdminResumes(user?.user_id ?? null);
  const del = useDeleteResume();

  const s = stats.data ?? {};

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Resumes</h1>
        <p className="text-sm text-muted-foreground">AI analyses, downloads, and per-user usage.</p>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-4">
        {[
          { label: "Total analyses", value: s.analyses_total ?? "—" },
          { label: "Last 30d", value: s.analyses_30d ?? "—" },
          { label: "Avg score", value: s.avg_score ?? "—" },
          { label: "Total downloads", value: s.downloads_total ?? "—" },
        ].map((k) => (
          <Card key={k.label} className="p-3">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="text-xl font-bold mt-1">{k.value}</div>
          </Card>
        ))}
      </div>

      {Array.isArray(s.top_templates) && s.top_templates.length > 0 && (
        <Card className="p-4 mb-4">
          <h2 className="text-sm font-semibold mb-2">Top downloaded templates</h2>
          <div className="flex flex-wrap gap-2">
            {s.top_templates.map((t: any, i: number) => (
              <div key={i} className="rounded-md border border-border/50 px-2 py-1 text-xs">
                {t.name} <span className="text-muted-foreground">· {t.downloads}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Analyses</h2></div>
          <div className="w-72"><AdminUserPicker value={user} onChange={setUser} placeholder="Filter by user…" /></div>
        </div>
        {list.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-2 py-2">When</th><th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">File</th>
                  <th className="px-2 py-2 text-right">Overall</th>
                  <th className="px-2 py-2 text-right">ATS</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(list.data ?? []).map((r: any) => (
                  <tr key={r.id} className="border-b border-border/30">
                    <td className="px-2 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-2 py-2"><button className="text-primary hover:underline" onClick={() => adminUserDrawer.show(r.user_id)}>{r.full_name || r.user_id.slice(0, 8)}</button></td>
                    <td className="px-2 py-2 truncate max-w-[280px]">{r.file_name}</td>
                    <td className="px-2 py-2 text-right">{r.overall_score ?? "—"}</td>
                    <td className="px-2 py-2 text-right">{r.ats_score ?? "—"}</td>
                    <td className="px-2 py-2 text-right space-x-1">
                      {r.file_url && (
                        <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                          <a href={r.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => { if (confirm("Delete this analysis and its file?")) del.mutate(r.id); }}
                        disabled={del.isPending}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {(list.data ?? []).length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No analyses.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default ResumesAdmin;
