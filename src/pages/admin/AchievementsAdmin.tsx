import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  ShieldCheck,
  Search as SearchIcon,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useAchievementStats,
  useRecomputeAchievements,
} from "@/hooks/admin/useAdminEngagement";
import { useBulkAchievementMutation } from "@/hooks/admin/useBulkAchievement";
import { AdminUserMultiPicker } from "@/components/admin/AdminUserMultiPicker";
import type { AdminUserHit } from "@/hooks/admin/useAdminUserSearch";
import { achievements as catalog } from "@/components/AchievementBadge";

type Action = "grant" | "revoke";

const userLabel = (u: AdminUserHit) =>
  u.full_name || u.username || u.user_id.slice(0, 8);

const AchievementsAdmin = () => {
  const { data: stats = [], isLoading } = useAchievementStats();
  const recompute = useRecomputeAchievements();
  const bulk = useBulkAchievementMutation();

  // ───────── Selection state
  const [pickedUsers, setPickedUsers] = useState<AdminUserHit[]>([]);
  const [achId, setAchId] = useState<string>("");
  const [customId, setCustomId] = useState("");

  // ───────── Achievement search/filter
  const [achQuery, setAchQuery] = useState("");
  const filteredCatalog = useMemo(() => {
    const q = achQuery.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }, [achQuery]);

  const catalogMap = useMemo(() => new Map(catalog.map((a) => [a.id, a])), []);
  const targetId = (customId.trim() || achId).trim();
  const targetMeta = catalogMap.get(targetId);

  // ───────── Per-user earned lookup (for diff preview)
  const detailQueries = useQueries({
    queries: pickedUsers.map((u) => ({
      queryKey: ["admin-user-detail", u.user_id],
      enabled: !!u.user_id,
      queryFn: async () => {
        const { data, error } = await (supabase.rpc as any)("admin_user_detail", {
          _user_id: u.user_id,
        });
        if (error) throw error;
        return data as { achievements: { achievement_id: string; earned_at: string }[] };
      },
    })),
  });
  const earnedByUser = useMemo(() => {
    const m = new Map<string, Set<string>>();
    pickedUsers.forEach((u, idx) => {
      const set = new Set(
        (detailQueries[idx]?.data?.achievements ?? []).map((a) => a.achievement_id)
      );
      m.set(u.user_id, set);
    });
    return m;
  }, [pickedUsers, detailQueries]);

  const allDetailsLoading = detailQueries.some((q) => q.isLoading);

  // Single-user shortcut: when exactly 1 user is picked, show their earned list
  const singleEarned = pickedUsers.length === 1 ? Array.from(earnedByUser.get(pickedUsers[0].user_id) ?? []) : [];

  // ───────── Diff preview (computed for the modal)
  const diff = useMemo(() => {
    if (!targetId || pickedUsers.length === 0) return null;
    const willChange: AdminUserHit[] = [];
    const noOp: AdminUserHit[] = [];
    pickedUsers.forEach((u) => {
      const earned = earnedByUser.get(u.user_id) ?? new Set();
      const has = earned.has(targetId);
      // grant changes only if NOT already earned; revoke changes only if currently earned
      const changesOnGrant = !has;
      const changesOnRevoke = has;
      // store both — modal will pick by action
      (changesOnGrant ? willChange : noOp).push(u);
      // We'll also expose a revoke-shaped diff via a getter below
    });
    // Recompute properly per action
    const grantChange = pickedUsers.filter((u) => !(earnedByUser.get(u.user_id) ?? new Set()).has(targetId));
    const grantNoOp = pickedUsers.filter((u) => (earnedByUser.get(u.user_id) ?? new Set()).has(targetId));
    const revokeChange = pickedUsers.filter((u) => (earnedByUser.get(u.user_id) ?? new Set()).has(targetId));
    const revokeNoOp = pickedUsers.filter((u) => !(earnedByUser.get(u.user_id) ?? new Set()).has(targetId));
    return { grantChange, grantNoOp, revokeChange, revokeNoOp };
  }, [pickedUsers, targetId, earnedByUser]);

  // ───────── Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<Action | null>(null);
  const openConfirm = (action: Action) => setConfirmAction(action);
  const closeConfirm = () => setConfirmAction(null);

  const canOpenGrant = !!targetId && pickedUsers.length > 0 && !bulk.isPending;
  const canOpenRevoke = !!targetId && pickedUsers.length > 0 && !bulk.isPending;

  const submitConfirmed = async () => {
    if (!confirmAction || !targetId) return;
    const userIds = (confirmAction === "grant" ? diff?.grantChange : diff?.revokeChange) ?? [];
    if (userIds.length === 0) {
      closeConfirm();
      return;
    }
    await bulk.mutateAsync({
      userIds: userIds.map((u) => u.user_id),
      achievementId: targetId,
      action: confirmAction,
    });
    closeConfirm();
  };

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-sm text-muted-foreground">
          Grant or revoke badges (single or bulk), recompute auto-earned ones, and review counts.
        </p>
      </div>

      {/* ───────── Grant / revoke for one or many users */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Grant or revoke for users</h2>
          {pickedUsers.length > 0 && (
            <Badge variant="outline" className="ml-auto gap-1">
              <Users className="h-3 w-3" /> {pickedUsers.length} selected
            </Badge>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {/* Users */}
          <div>
            <Label className="text-xs text-muted-foreground">Users (one or many)</Label>
            <div className="mt-1">
              <AdminUserMultiPicker value={pickedUsers} onChange={setPickedUsers} />
            </div>
          </div>

          {/* Achievement picker with search */}
          <div>
            <Label htmlFor="achievements-search" className="text-xs text-muted-foreground">Achievement</Label>
            <div className="relative mt-1">
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="achievements-search"
                className="pl-7"
                placeholder="Search by name, id, or description…"
                value={achQuery}
                onChange={(e) => setAchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="mt-2 h-44 rounded-md border border-border/50">
              <div className="p-1">
                {filteredCatalog.length === 0 && (
                  <p className="px-3 py-4 text-xs text-muted-foreground">No achievements match.</p>
                )}
                {filteredCatalog.map((a) => {
                  const selected = achId === a.id && !customId.trim();
                  return (
                    <button
                      key={a.id}
                      onClick={() => {
                        setAchId(a.id);
                        setCustomId("");
                      }}
                      className={
                        "flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent " +
                        (selected ? "bg-accent" : "")
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{a.name}</div>
                        <div className="truncate font-mono text-[10px] text-muted-foreground">{a.id}</div>
                      </div>
                      {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            <Input
              className="mt-2"
              placeholder="…or enter a custom achievement_id"
              value={customId}
              onChange={(e) => {
                setCustomId(e.target.value);
                if (e.target.value) setAchId("");
              }}
            />
          </div>
        </div>

        {/* Target + status hint */}
        {targetId && (
          <p className="mt-3 text-xs text-muted-foreground">
            Target: <span className="font-mono">{targetId}</span>
            {targetMeta ? <> · {targetMeta.name}</> : null}
            {pickedUsers.length > 0 && diff && (
              <>
                {" "}— {diff.grantChange.length} would receive it, {diff.revokeChange.length} currently
                have it.
              </>
            )}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={!canOpenGrant} onClick={() => openConfirm("grant")}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Grant{pickedUsers.length > 1 ? " (bulk)" : ""}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!canOpenRevoke}
            onClick={() => openConfirm("revoke")}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Revoke{pickedUsers.length > 1 ? " (bulk)" : ""}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pickedUsers.length === 0 || recompute.isPending}
            onClick={() => pickedUsers.forEach((u) => recompute.mutate(u.user_id))}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Recompute auto-earned
          </Button>
          {allDetailsLoading && pickedUsers.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> 
            </span>
          )}
        </div>

        {/* Single-user earned shortcut */}
        {pickedUsers.length === 1 && (
          <div className="mt-4 border-t border-border/50 pt-3">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              Earned by {userLabel(pickedUsers[0])} ({singleEarned.length})
            </p>
            {singleEarned.length === 0 ? (
              <p className="text-xs text-muted-foreground">None yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {singleEarned.map((id) => {
                  const meta = catalogMap.get(id);
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setAchId(id);
                        setCustomId("");
                      }}
                      className="rounded-md border border-border/50 bg-card/50 px-2 py-0.5 text-xs hover:bg-accent"
                    >
                      {meta?.name ?? id}
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
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
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
                {stats.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-muted-foreground">
                      No achievements earned yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ───────── Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(o) => !o && closeConfirm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmAction === "grant" ? (
                <>
                  <Plus className="h-4 w-4 text-primary" /> Confirm grant
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 text-destructive" /> Confirm revoke
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Review the diff below. Only users whose state will actually change are submitted.
            </DialogDescription>
          </DialogHeader>

          {confirmAction && diff && (
            <div className="space-y-3">
              <div className="rounded-md border border-border/50 bg-card/40 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Achievement</span>
                  <span className="font-mono">{targetId}</span>
                </div>
                {targetMeta && (
                  <div className="mt-1 text-muted-foreground">
                    {targetMeta.name} — {targetMeta.description}
                  </div>
                )}
              </div>

              {(() => {
                const change =
                  confirmAction === "grant" ? diff.grantChange : diff.revokeChange;
                const skip = confirmAction === "grant" ? diff.grantNoOp : diff.revokeNoOp;
                const verb = confirmAction === "grant" ? "granted to" : "revoked from";
                return (
                  <>
                    {/* Will change */}
                    <div>
                      <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Will be {verb} <Badge variant="secondary">{change.length}</Badge>
                      </div>
                      {change.length === 0 ? (
                        <p className="text-xs text-muted-foreground pl-5">Nothing to do — all selected users are already in target state.</p>
                      ) : (
                        <ScrollArea className="h-28 rounded-md border border-border/50">
                          <ul className="p-2 text-xs">
                            {change.map((u) => (
                              <li key={u.user_id} className="flex items-center justify-between gap-2 py-0.5">
                                <span className="truncate">{userLabel(u)}</span>
                                <span className="font-mono text-[10px] text-muted-foreground">{u.user_id.slice(0, 8)}</span>
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      )}
                    </div>

                    {/* Will skip */}
                    {skip.length > 0 && (
                      <div>
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                          <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          Already in target state, will skip <Badge variant="outline">{skip.length}</Badge>
                        </div>
                        <ScrollArea className="h-20 rounded-md border border-border/50">
                          <ul className="p-2 text-xs text-muted-foreground">
                            {skip.map((u) => (
                              <li key={u.user_id} className="flex items-center justify-between gap-2 py-0.5">
                                <span className="truncate">{userLabel(u)}</span>
                                <span className="font-mono text-[10px]">{u.user_id.slice(0, 8)}</span>
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                      </div>
                    )}

                    {change.length > 5 && (
                      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>
                          You're about to {confirmAction} this achievement for <strong>{change.length}</strong> users in
                          one go. Double-check the target before submitting.
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={closeConfirm} disabled={bulk.isPending}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === "revoke" ? "destructive" : "default"}
              onClick={submitConfirmed}
              disabled={bulk.isPending}
            >
              {bulk.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Applying…
                </>
              ) : confirmAction === "grant" ? (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Confirm grant
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Confirm revoke
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

export default AchievementsAdmin;
