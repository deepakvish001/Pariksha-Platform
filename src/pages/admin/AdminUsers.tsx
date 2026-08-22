import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useAdminUsers, useGrantRole, useRevokeRole, useSuspendUser, useUnsuspendUser,
} from "@/hooks/admin/useAdminControl";
import { ShieldCheck, ShieldOff, Ban, RotateCcw, Search, Loader2, UserCog } from "lucide-react";
import { adminUserDrawer } from "@/hooks/admin/useAdminUserDrawerStore";

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const { data: users = [], isLoading } = useAdminUsers(search);
  const grant = useGrantRole();
  const revoke = useRevokeRole();
  const suspend = useSuspendUser();
  const unsuspend = useUnsuspendUser();

  return (
    <AdminShell>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">Search, grant roles, suspend accounts.</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Roles</th>
                  <th className="px-2 py-2">Level / XP</th>
                  <th className="px-2 py-2">Last active</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isAdmin = u.roles?.includes("admin");
                  const isMod = u.roles?.includes("moderator");
                  return (
                    <tr key={u.user_id} className="border-b border-border/30">
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.avatar_url ?? undefined} />
                            <AvatarFallback>{(u.full_name ?? u.email ?? "?")[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{u.full_name || u.username || "Unnamed"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.length ? u.roles.map((r) => (
                            <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>
                          )) : <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-xs">
                        L{u.current_level ?? 1} · {u.total_xp ?? 0} XP
                      </td>
                      <td className="px-2 py-3 text-xs text-muted-foreground">
                        {u.last_active_at ? new Date(u.last_active_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-2 py-3">
                        {u.is_suspended
                          ? <Badge variant="destructive">Suspended</Badge>
                          : <Badge variant="outline">Active</Badge>}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => adminUserDrawer.show(u.user_id)} title="Open detail">
                            <UserCog className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => isAdmin
                              ? revoke.mutate({ userId: u.user_id, role: "admin" })
                              : grant.mutate({ userId: u.user_id, role: "admin" })}
                            aria-label={isAdmin ? "Revoke admin" : "Make admin"}
                          >
                            {isAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                            <span className="ml-1 hidden sm:inline">{isAdmin ? "Revoke admin" : "Make admin"}</span>
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => isMod
                              ? revoke.mutate({ userId: u.user_id, role: "moderator" })
                              : grant.mutate({ userId: u.user_id, role: "moderator" })}
                          >{isMod ? "Revoke mod" : "Make mod"}</Button>
                          {u.is_suspended ? (
                            <Button size="sm" variant="outline" onClick={() => unsuspend.mutate(u.user_id)}>
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="destructive"
                              onClick={() => {
                                const reason = prompt("Reason for suspension?") ?? "";
                                if (reason) suspend.mutate({ userId: u.user_id, reason });
                              }}>
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default AdminUsers;
