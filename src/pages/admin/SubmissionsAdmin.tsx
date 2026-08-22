import { adminUserDrawer } from "@/hooks/admin/useAdminUserDrawerStore";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Code2, Search } from "lucide-react";
import { AdminUserPicker } from "@/components/admin/AdminUserPicker";
import type { AdminUserHit } from "@/hooks/admin/useAdminUserSearch";
import {
  useAdminSubmissions,
  useAdminProblemAcceptance,
} from "@/hooks/admin/useAdminCoverage";

const SubmissionsAdmin = () => {
  const [user, setUser] = useState<AdminUserHit | null>(null);
  const [slug, setSlug] = useState("");
  const [verdict, setVerdict] = useState("");
  const list = useAdminSubmissions(user?.user_id ?? null, slug || null, verdict || null);
  const acceptance = useAdminProblemAcceptance(50);

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Code Submissions</h1>
        <p className="text-sm text-muted-foreground">Inspect submissions, verdict mix, and per-problem acceptance.</p>
      </div>

      <Card className="p-4 mb-4">
        <h2 className="text-sm font-semibold mb-3">Top problems by submissions</h2>
        {acceptance.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-2 py-2">Slug</th>
                  <th className="px-2 py-2 text-right">Total</th>
                  <th className="px-2 py-2 text-right">Accepted</th>
                  <th className="px-2 py-2 text-right">Acceptance</th>
                </tr>
              </thead>
              <tbody>
                {(acceptance.data ?? []).map((r: any) => (
                  <tr key={r.problem_slug} className="border-b border-border/30">
                    <td className="px-2 py-2 font-mono text-xs">{r.problem_slug}</td>
                    <td className="px-2 py-2 text-right">{r.total}</td>
                    <td className="px-2 py-2 text-right">{r.accepted}</td>
                    <td className="px-2 py-2 text-right">{Number(r.acceptance ?? 0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3"><Code2 className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Recent submissions</h2></div>
        <div className="grid gap-2 md:grid-cols-3 mb-3">
          <AdminUserPicker value={user} onChange={setUser} placeholder="Filter by user…" />
          <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input aria-label="Filter by problem slug" className="pl-7" placeholder="Filter by problem slug" value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
          <Input aria-label="Filter by verdict" placeholder="Verdict (e.g. accepted)" value={verdict} onChange={(e) => setVerdict(e.target.value)} />
        </div>
        {list.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-2 py-2">When</th><th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Slug</th><th className="px-2 py-2">Lang</th>
                  <th className="px-2 py-2">Verdict</th>
                  <th className="px-2 py-2 text-right">Tests</th>
                  <th className="px-2 py-2 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {(list.data ?? []).map((s: any) => (
                  <tr key={s.id} className="border-b border-border/30">
                    <td className="px-2 py-2 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="px-2 py-2"><button className="text-primary hover:underline" onClick={() => adminUserDrawer.show(s.user_id)}>{s.full_name || s.user_id.slice(0, 8)}</button></td>
                    <td className="px-2 py-2 font-mono text-xs">{s.problem_slug}</td>
                    <td className="px-2 py-2">{s.language}</td>
                    <td className="px-2 py-2">
                      <Badge variant={s.verdict === "accepted" ? "default" : "destructive"}>{s.verdict}</Badge>
                    </td>
                    <td className="px-2 py-2 text-right">{s.passed_tests}/{s.total_tests}</td>
                    <td className="px-2 py-2 text-right text-xs">{s.runtime_ms ?? "—"}ms</td>
                  </tr>
                ))}
                {(list.data ?? []).length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No submissions.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default SubmissionsAdmin;
