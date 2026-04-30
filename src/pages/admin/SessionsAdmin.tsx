import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldAlert, LogOut } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminUserPicker } from "@/components/admin/AdminUserPicker";
import type { AdminUserHit } from "@/hooks/admin/useAdminUserSearch";
import { useForceLogout } from "@/hooks/admin/useAdminCoverage";
import { adminUserDrawer } from "@/hooks/admin/useAdminUserDrawerStore";

const useSessionInvalidations = () =>
  useQuery({
    queryKey: ["admin-session-invalidations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_session_invalidations" as any)
        .select("id, user_id, reason, created_at, acknowledged_at, created_by")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

const SessionsAdmin = () => {
  const list = useSessionInvalidations();
  const force = useForceLogout();
  const [user, setUser] = useState<AdminUserHit | null>(null);
  const [reason, setReason] = useState("");

  return (
    <AdminShell>
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold"><ShieldAlert className="h-5 w-5" /> Sessions & Force Logout</h1>
      <p className="mb-4 text-sm text-muted-foreground">Invalidate any user's session. Clients pick this up and sign out on their next request.</p>

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-semibold">Force a user to log out</h2>
        <div className="grid gap-2 md:grid-cols-[300px_1fr_auto]">
          <AdminUserPicker value={user} onChange={setUser} placeholder="Pick a user…" />
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (audited)" />
          <Button
            disabled={!user || force.isPending}
            onClick={() => user && force.mutate({ userId: user.user_id, reason: reason || "admin" }, { onSuccess: () => setReason("") })}
          ><LogOut className="mr-1 h-4 w-4" /> Force logout</Button>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Recent invalidations</h2>
        {list.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : !list.data?.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No invalidations recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-2 py-2">When</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Reason</th>
                  <th className="px-2 py-2">Acknowledged</th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((row) => (
                  <tr key={row.id} className="border-b border-border/30">
                    <td className="px-2 py-2 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="px-2 py-2">
                      <button className="text-primary hover:underline" onClick={() => adminUserDrawer.show(row.user_id)}>
                        {row.user_id.slice(0, 8)}…
                      </button>
                    </td>
                    <td className="px-2 py-2">{row.reason ?? "—"}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">
                      {row.acknowledged_at ? new Date(row.acknowledged_at).toLocaleString() : "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default SessionsAdmin;
