import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminUsers, useRevokeRole } from "@/hooks/admin/useAdminControl";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";

const AdminRoles = () => {
  const { data: users = [] } = useAdminUsers("", 500);
  const revoke = useRevokeRole();
  const privileged = useMemo(
    () => users.filter((u) => u.roles?.some((r) => r === "admin" || r === "moderator")),
    [users],
  );

  return (
    <AdminShell>
      <h1 className="mb-1 text-2xl font-bold">Roles & Permissions</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Privileged users in the platform. Use the <Link to="/admin/users" className="underline">Users</Link> page to grant roles.
      </p>

      <Card className="p-4">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b border-border/50">
              <th className="px-2 py-2">User</th>
              <th className="px-2 py-2">Roles</th>
              <th className="px-2 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {privileged.map((u) => (
              <tr key={u.user_id} className="border-b border-border/30">
                <td className="px-2 py-3">
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
                <td className="px-2 py-3">
                  <div className="flex gap-1">
                    {u.roles.map((r) => <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>)}
                  </div>
                </td>
                <td className="px-2 py-3 text-right">
                  {u.roles.map((r) => (
                    <Button key={r} size="sm" variant="ghost" className="ml-1"
                      onClick={() => revoke.mutate({ userId: u.user_id, role: r as any })}>
                      <ShieldOff className="mr-1 h-3 w-3" /> Revoke {r}
                    </Button>
                  ))}
                </td>
              </tr>
            ))}
            {privileged.length === 0 && (
              <tr><td colSpan={3} className="py-12 text-center text-muted-foreground">No privileged users</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
};

export default AdminRoles;
