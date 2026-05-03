import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminUsers, useRevokeRole } from "@/hooks/admin/useAdminControl";
import { broadcastAdminChange } from "@/hooks/admin/useAdminRealtimeSync";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ShieldOff, RefreshCw, Crown, Shield, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleAuditLog } from "@/components/admin/RoleAuditLog";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<string, { className: string; icon: React.ReactNode }> = {
  owner:     { className: "bg-amber-500/15 text-amber-300 border-amber-500/30",   icon: <Crown className="mr-1 h-3 w-3" /> },
  admin:     { className: "bg-primary/15 text-primary border-primary/30",         icon: <Shield className="mr-1 h-3 w-3" /> },
  moderator: { className: "bg-sky-500/15 text-sky-300 border-sky-500/30",         icon: <Sparkles className="mr-1 h-3 w-3" /> },
  user:      { className: "bg-muted text-muted-foreground border-border",         icon: null },
};

const ROLE_ORDER = ["owner", "admin", "moderator", "user"];
const sortRoles = (roles: string[]) =>
  [...roles].sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));

const AdminRoles = () => {
  const qc = useQueryClient();
  const { data: users = [], refetch, isFetching } = useAdminUsers("", 500);
  const revoke = useRevokeRole();

  // Refetch on mount so changes from other tabs/sessions show up immediately.
  useEffect(() => { refetch(); }, [refetch]);

  // Postgres realtime on user_roles — RLS-respecting (only admins/owners see all rows;
  // others see only their own). Updates roll in without a manual refresh.
  useEffect(() => {
    const channel = supabase
      .channel("admin-roles-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => {
          qc.invalidateQueries({ queryKey: ["admin-users"] });
          qc.invalidateQueries({ queryKey: ["admin-role-audit"] });
          broadcastAdminChange();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const privileged = useMemo(
    () => users.filter((u) => u.roles?.some((r) => r === "owner" || r === "admin" || r === "moderator")),
    [users],
  );

  return (
    <AdminShell>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-1 h-3 w-3", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Privileged users in the platform. Use the <Link to="/admin/users" className="underline">Users</Link> page to grant roles.
        Updates appear live as roles change.
      </p>

      <Card className="mb-6 p-4">
        <div className="overflow-hidden rounded-md border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Roles</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {privileged.map((u) => {
                const sorted = sortRoles(u.roles ?? []);
                return (
                  <tr key={u.user_id} className="border-t border-border/30 transition-colors hover:bg-muted/20">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={u.avatar_url ?? undefined} />
                          <AvatarFallback>{(u.full_name ?? "?")[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{u.full_name ?? u.username ?? "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {sorted.map((r) => {
                          const s = ROLE_STYLES[r] ?? ROLE_STYLES.user;
                          return (
                            <Badge key={r} variant="outline" className={cn("border", s.className)}>
                              {s.icon}{r}
                            </Badge>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {sorted
                        .filter((r) => r !== "user")
                        .map((r) => (
                          <Button
                            key={r}
                            size="sm"
                            variant="ghost"
                            className="ml-1"
                            onClick={() => revoke.mutate({ userId: u.user_id, role: r as any })}
                          >
                            <ShieldOff className="mr-1 h-3 w-3" /> Revoke {r}
                          </Button>
                        ))}
                    </td>
                  </tr>
                );
              })}
              {privileged.length === 0 && (
                <tr><td colSpan={3} className="py-12 text-center text-muted-foreground">No privileged users</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RoleAuditLog />
    </AdminShell>
  );
};

export default AdminRoles;
