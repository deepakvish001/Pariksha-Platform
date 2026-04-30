import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EyeOff, Eye, Loader2, RefreshCw } from "lucide-react";
import {
  useAdminLeaderboard, useToggleLeaderboardHidden, useForceSnapshotLeaderboard,
} from "@/hooks/admin/useAdminEngagement";

const LeaderboardsAdmin = () => {
  const [window, setWindow] = useState<"all" | "week">("all");
  const { data = [], isLoading } = useAdminLeaderboard(window, 100);
  const toggle = useToggleLeaderboardHidden();
  const snapshot = useForceSnapshotLeaderboard();

  return (
    <AdminShell>
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Leaderboards</h1>
          <p className="text-sm text-muted-foreground">Top players, hide abusers, force snapshots.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => snapshot.mutate()} disabled={snapshot.isPending}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Snapshot now
        </Button>
      </div>

      <Tabs value={window} onValueChange={(v) => setWindow(v as any)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All time</TabsTrigger>
          <TabsTrigger value="week">This week</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2 text-right">Level</th>
                  <th className="px-2 py-2 text-right">{window === "week" ? "Weekly XP" : "Total XP"}</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((u, i) => (
                  <tr key={u.user_id} className="border-b border-border/30">
                    <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={u.avatar_url ?? undefined} />
                          <AvatarFallback>{(u.full_name ?? "?")[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{u.full_name ?? "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">@{u.username ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right">L{u.current_level}</td>
                    <td className="px-2 py-2 text-right font-mono">{window === "week" ? u.xp_this_week : u.total_xp}</td>
                    <td className="px-2 py-2">
                      {u.leaderboard_hidden ? <Badge variant="destructive">Hidden</Badge> : <Badge variant="outline">Visible</Badge>}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <Button size="sm" variant="outline"
                        onClick={() => toggle.mutate({ userId: u.user_id, hidden: !u.leaderboard_hidden })}>
                        {u.leaderboard_hidden ? <><Eye className="h-3.5 w-3.5 mr-1" />Show</> : <><EyeOff className="h-3.5 w-3.5 mr-1" />Hide</>}
                      </Button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No users.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default LeaderboardsAdmin;
