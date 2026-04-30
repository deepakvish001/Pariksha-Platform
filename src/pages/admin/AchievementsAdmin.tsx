import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Plus, Trash2, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAchievementStats,
  useRecomputeAchievements,
  useGrantAchievement,
  useRevokeAchievement,
  useAdminUserDetail,
} from "@/hooks/admin/useAdminEngagement";
import { AdminUserPicker } from "@/components/admin/AdminUserPicker";
import type { AdminUserHit } from "@/hooks/admin/useAdminUserSearch";
import { achievements as catalog } from "@/components/AchievementBadge";

const AchievementsAdmin = () => {
  const { data: stats = [], isLoading } = useAchievementStats();
  const recompute = useRecomputeAchievements();
  const grant = useGrantAchievement();
  const revoke = useRevokeAchievement();

  const [picked, setPicked] = useState<AdminUserHit | null>(null);
  const [achId, setAchId] = useState<string>("");
  const [customId, setCustomId] = useState("");

  const detail = useAdminUserDetail(picked?.user_id ?? null);
  const earned = detail.data?.achievements ?? [];

  const catalogMap = useMemo(() => new Map(catalog.map((a) => [a.id, a])), []);
  const earnedSet = useMemo(() => new Set(earned.map((e) => e.achievement_id)), [earned]);

  const targetId = (customId.trim() || achId).trim();
  const canGrant = !!picked && !!targetId && !earnedSet.has(targetId) && !grant.isPending;
  const canRevoke = !!picked && !!targetId && earnedSet.has(targetId) && !revoke.isPending;

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-sm text-muted-foreground">Grant or revoke badges, recompute auto-earned ones, and review counts.</p>
      </div>

      {/* ───────── Grant / revoke for any user */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Grant or revoke for a user</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">User</Label>
            <div className="mt-1"><AdminUserPicker value={picked} onChange={setPicked} /></div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Achievement</Label>
            <Select value={achId} onValueChange={(v) => { setAchId(v); setCustomId(""); }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose from catalog…" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {catalog.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} <span className="text-xs text-muted-foreground">· {a.id}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="mt-2"
              placeholder="…or enter a custom achievement_id"
              value={customId}
              onChange={(e) => { setCustomId(e.target.value); if (e.target.value) setAchId(""); }}
            />
          </div>
        </div>

        {picked && targetId && (
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-mono">{targetId}</span> is{" "}
            {earnedSet.has(targetId) ? (
              <span className="text-emerald-500">already earned</span>
            ) : (
              <span>not yet earned</span>
            )} by this user.
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={!canGrant}
            onClick={() => picked && grant.mutate({ userId: picked.user_id, achievementId: targetId })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Grant
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!canRevoke}
            onClick={() => picked && revoke.mutate({ userId: picked.user_id, achievementId: targetId })}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Revoke
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!picked || recompute.isPending}
            onClick={() => picked && recompute.mutate(picked.user_id)}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Recompute auto-earned
          </Button>
        </div>

        {picked && (
          <div className="mt-4 border-t border-border/50 pt-3">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              Earned by {picked.full_name || picked.username || "this user"} ({earned.length})
            </p>
            {detail.isLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading…
              </div>
            ) : earned.length === 0 ? (
              <p className="text-xs text-muted-foreground">None yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {earned.map((e) => {
                  const meta = catalogMap.get(e.achievement_id);
                  return (
                    <button
                      key={e.achievement_id}
                      onClick={() => { setAchId(e.achievement_id); setCustomId(""); }}
                      className="rounded-md border border-border/50 bg-card/50 px-2 py-0.5 text-xs hover:bg-accent"
                      title={`Earned ${new Date(e.earned_at).toLocaleString()}`}
                    >
                      {meta?.name ?? e.achievement_id}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ───────── Stats */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3">Earned counts</h2>
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
                {stats.map((row) => {
                  const meta = catalogMap.get(row.achievement_id);
                  return (
                    <tr key={row.achievement_id} className="border-b border-border/30">
                      <td className="px-2 py-2">
                        <div className="font-medium">{meta?.name ?? row.achievement_id}</div>
                        <div className="font-mono text-xs text-muted-foreground">{row.achievement_id}</div>
                      </td>
                      <td className="px-2 py-2 text-right">{row.earned_count}</td>
                      <td className="px-2 py-2 text-right text-xs text-muted-foreground">
                        {row.last_earned ? new Date(row.last_earned).toLocaleString() : "—"}
                      </td>
                    </tr>
                  );
                })}
                {stats.length === 0 && <tr><td colSpan={3} className="py-12 text-center text-muted-foreground">No achievements earned yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default AchievementsAdmin;
