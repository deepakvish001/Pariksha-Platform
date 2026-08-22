import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, RotateCcw, Brain } from "lucide-react";
import { AdminUserPicker } from "@/components/admin/AdminUserPicker";
import { adminUserDrawer } from "@/hooks/admin/useAdminUserDrawerStore";
import type { AdminUserHit } from "@/hooks/admin/useAdminUserSearch";
import {
  useAdminQuizAttempts,
  useAdminQuizOverview,
  useDeleteQuizAttempt,
  useResetSrs,
} from "@/hooks/admin/useAdminCoverage";

const QuizzesAdmin = () => {
  const [user, setUser] = useState<AdminUserHit | null>(null);
  const overview = useAdminQuizOverview();
  const attempts = useAdminQuizAttempts(user?.user_id ?? null);
  const del = useDeleteQuizAttempt();
  const reset = useResetSrs();

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Quizzes & SRS</h1>
        <p className="text-sm text-muted-foreground">Inspect attempts, delete malformed sessions, and reset spaced-repetition state.</p>
      </div>

      <Card className="p-4 mb-4">
        <h2 className="text-sm font-semibold mb-3">Top quiz categories</h2>
        {overview.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-2 py-2">Type</th><th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2 text-right">Attempts</th>
                  <th className="px-2 py-2 text-right">Avg accuracy</th>
                  <th className="px-2 py-2 text-right">Avg time</th>
                </tr>
              </thead>
              <tbody>
                {(overview.data ?? []).map((r: any, i: number) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="px-2 py-2"><Badge variant="outline">{r.quiz_type}</Badge></td>
                    <td className="px-2 py-2">{r.category}</td>
                    <td className="px-2 py-2 text-right">{r.attempts}</td>
                    <td className="px-2 py-2 text-right">{Number(r.avg_accuracy).toFixed(1)}%</td>
                    <td className="px-2 py-2 text-right">{r.avg_time_sec}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="text-sm font-semibold">Recent attempts</h2>
          <div className="w-72"><AdminUserPicker value={user} onChange={setUser} placeholder="Filter by user…" /></div>
        </div>
        {user && (
          <Button size="sm" variant="outline" className="mb-3" disabled={reset.isPending}
            onClick={() => { if (confirm(`Reset ALL SRS for ${user.full_name || user.username}?`)) reset.mutate({ userId: user.user_id }); }}>
            <Brain className="h-3.5 w-3.5 mr-1" /> Reset SRS for this user
          </Button>
        )}
        {attempts.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-2 py-2">When</th><th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Type</th><th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2 text-right">Score</th>
                  <th className="px-2 py-2 text-right">Accuracy</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(attempts.data ?? []).map((q: any) => (
                  <tr key={q.id} className="border-b border-border/30">
                    <td className="px-2 py-2 text-xs text-muted-foreground">{new Date(q.completed_at).toLocaleString()}</td>
                    <td className="px-2 py-2"><button className="text-primary hover:underline" onClick={() => adminUserDrawer.show(q.user_id)}>{q.full_name || q.user_id.slice(0, 8)}</button></td>
                    <td className="px-2 py-2"><Badge variant="outline">{q.quiz_type}</Badge></td>
                    <td className="px-2 py-2">{q.category}</td>
                    <td className="px-2 py-2 text-right">{q.score}/{q.total_questions}</td>
                    <td className="px-2 py-2 text-right">{Number(q.accuracy).toFixed(1)}%</td>
                    <td className="px-2 py-2 text-right">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        aria-label="Delete attempt"
                        onClick={() => { if (confirm("Delete this attempt?")) del.mutate(q.id); }}
                        disabled={del.isPending}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {(attempts.data ?? []).length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No attempts.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default QuizzesAdmin;
