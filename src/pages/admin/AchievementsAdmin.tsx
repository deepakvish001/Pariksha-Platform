import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { useAchievementStats, useRecomputeAchievements } from "@/hooks/admin/useAdminEngagement";
import { useState } from "react";

const AchievementsAdmin = () => {
  const { data = [], isLoading } = useAchievementStats();
  const recompute = useRecomputeAchievements();
  const [userId, setUserId] = useState("");

  return (
    <AdminShell>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Achievements</h1>
          <p className="text-sm text-muted-foreground">Earned counts per badge and recompute tools.</p>
        </div>
      </div>

      <Card className="p-4 mb-4">
        <p className="text-sm font-medium mb-2">Recompute for user</p>
        <div className="flex gap-2">
          <Input placeholder="user_id (uuid)" value={userId} onChange={(e) => setUserId(e.target.value)} className="max-w-md" />
          <Button onClick={() => userId && recompute.mutate(userId)} disabled={!userId || recompute.isPending}>
            <Sparkles className="h-4 w-4 mr-1" /> Recompute
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="px-2 py-2">Achievement</th>
                  <th className="px-2 py-2 text-right">Earned</th>
                  <th className="px-2 py-2 text-right">Last earned</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.achievement_id} className="border-b border-border/30">
                    <td className="px-2 py-2 font-mono text-xs">{row.achievement_id}</td>
                    <td className="px-2 py-2 text-right">{row.earned_count}</td>
                    <td className="px-2 py-2 text-right text-xs text-muted-foreground">
                      {row.last_earned ? new Date(row.last_earned).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && <tr><td colSpan={3} className="py-12 text-center text-muted-foreground">No achievements earned yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default AchievementsAdmin;
