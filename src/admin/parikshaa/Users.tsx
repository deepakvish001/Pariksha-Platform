import { useState } from "react";
import { ShellHeader } from "./ParikshaaShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useAdminUsers,
  useGrantRole,
  useRevokeRole,
  useSuspendUser,
  useUnsuspendUser,
} from "@/hooks/admin/useAdminControl";
import { Loader2 } from "lucide-react";

export default function ParikshaaUsers() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminUsers(search, 50, 0);
  const grant = useGrantRole();
  const revoke = useRevokeRole();
  const suspend = useSuspendUser();
  const unsuspend = useUnsuspendUser();

  return (
    <>
      <ShellHeader title="Users" />
      <div className="p-6 space-y-4">
        <Input
          placeholder="Search by name, email or username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr,160px,160px,200px] px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground border-b">
            <div>User</div>
            <div>Roles</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          {isLoading ? (
            <div className="px-4 py-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> 
            </div>
          ) : (data ?? []).length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">No users found.</div>
          ) : (
            (data ?? []).map((u) => (
              <div
                key={u.user_id}
                className="grid grid-cols-[1fr,160px,160px,200px] px-4 py-3 text-sm border-b last:border-0 items-center"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{u.full_name || u.username || "—"}</div>
                  <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.roles.length === 0 ? (
                    <span className="text-xs text-muted-foreground">user</span>
                  ) : (
                    u.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">
                        {r}
                      </Badge>
                    ))
                  )}
                </div>
                <div>
                  {u.is_suspended ? (
                    <Badge variant="destructive">suspended</Badge>
                  ) : (
                    <Badge variant="outline">active</Badge>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  {u.roles.includes("admin") ? (
                    <Button size="sm" variant="ghost" onClick={() => revoke.mutate({ userId: u.user_id, role: "admin" })}>
                      Revoke admin
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => grant.mutate({ userId: u.user_id, role: "admin" })}>
                      Make admin
                    </Button>
                  )}
                  {u.is_suspended ? (
                    <Button size="sm" variant="outline" onClick={() => unsuspend.mutate(u.user_id)}>
                      Reinstate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reason = window.prompt("Reason for suspension?") ?? "";
                        if (reason) suspend.mutate({ userId: u.user_id, reason });
                      }}
                    >
                      Suspend
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
