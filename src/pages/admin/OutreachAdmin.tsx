import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, EyeOff, Mail, Search } from "lucide-react";
import { useAdminOutreach, useAdminOutreachStats, useSetOutreachHidden } from "@/hooks/admin/useAdminCoverage";
import { adminUserDrawer } from "@/hooks/admin/useAdminUserDrawerStore";

const OutreachAdmin = () => {
  const [q, setQ] = useState("");
  const stats = useAdminOutreachStats();
  const list = useAdminOutreach(q || null);
  const set = useSetOutreachHidden();

  const s = stats.data ?? {};

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Cold Outreach</h1>
        <p className="text-sm text-muted-foreground">User-created templates, copy analytics, and moderation.</p>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-4">
        {[
          { label: "Templates", value: s.templates_total ?? "—" },
          { label: "Total copies", value: s.copies_total ?? "—" },
          { label: "Copies (30d)", value: s.copies_30d ?? "—" },
          { label: "Hidden", value: s.hidden_count ?? "—" },
        ].map((k) => (
          <Card key={k.label} className="p-3">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="text-xl font-bold mt-1">{k.value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Custom templates</h2></div>
          <div className="relative w-72"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="pl-7" placeholder="Search title or body…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        {list.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-2 py-2">Title</th><th className="px-2 py-2">Owner</th>
                  <th className="px-2 py-2">Platform</th><th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2 text-right">Copies</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(list.data ?? []).map((t: any) => (
                  <tr key={t.id} className="border-b border-border/30">
                    <td className="px-2 py-2 truncate max-w-[300px]">{t.title}</td>
                    <td className="px-2 py-2"><button className="text-primary hover:underline" onClick={() => adminUserDrawer.show(t.user_id)}>{t.full_name || t.user_id.slice(0, 8)}</button></td>
                    <td className="px-2 py-2"><Badge variant="outline">{t.platform}</Badge></td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">{t.category}</td>
                    <td className="px-2 py-2 text-right">{t.copies}</td>
                    <td className="px-2 py-2 text-right">
                      {t.hidden ? (
                        <Button size="sm" variant="outline" disabled={set.isPending}
                          onClick={() => set.mutate({ templateId: t.id, hidden: false })}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> Unhide
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled={set.isPending}
                          onClick={() => { const r = prompt("Reason (optional)") ?? undefined; set.mutate({ templateId: t.id, hidden: true, reason: r }); }}>
                          <EyeOff className="h-3.5 w-3.5 mr-1 text-destructive" /> Hide
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {(list.data ?? []).length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No templates.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default OutreachAdmin;
