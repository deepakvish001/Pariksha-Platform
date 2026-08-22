import { adminUserDrawer } from "@/hooks/admin/useAdminUserDrawerStore";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Loader2, Smartphone } from "lucide-react";
import { AdminUserPicker } from "@/components/admin/AdminUserPicker";
import type { AdminUserHit } from "@/hooks/admin/useAdminUserSearch";
import {
  useAdminNotifications,
  useSendAdminNotification,
  useAdminPushSubscriptions,
} from "@/hooks/admin/useAdminCoverage";

const NotificationsAdmin = () => {
  const [filterUser, setFilterUser] = useState<AdminUserHit | null>(null);
  const [target, setTarget] = useState<AdminUserHit | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const list = useAdminNotifications(filterUser?.user_id ?? null);
  const subs = useAdminPushSubscriptions(filterUser?.user_id ?? null);
  const send = useSendAdminNotification();

  const submit = () => {
    if (!target || !title.trim() || !message.trim()) return;
    send.mutate(
      { userId: target.user_id, title: title.trim(), message: message.trim() },
      { onSuccess: () => { setTitle(""); setMessage(""); } },
    );
  };

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Send direct notifications, audit history, and review push subscriptions.</p>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3"><Send className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Send a notification</h2></div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Recipient</Label>
            <div className="mt-1"><AdminUserPicker value={target} onChange={setTarget} /></div>
          </div>
          <div>
            <Label className="text-xs" htmlFor="notif-title">Title</Label>
            <Input id="notif-title" className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-xs" htmlFor="notif-message">Message</Label>
          <Textarea id="notif-message" className="mt-1" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
        </div>
        <Button size="sm" className="mt-3" onClick={submit} disabled={!target || !title.trim() || !message.trim() || send.isPending}>
          {send.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />} Send
        </Button>
      </Card>

      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Recent notifications</h2></div>
          <div className="w-72"><AdminUserPicker value={filterUser} onChange={setFilterUser} placeholder="Filter by user…" /></div>
        </div>
        {list.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-2 py-2">When</th><th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Type</th><th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Read</th><th className="px-2 py-2">By admin</th>
                </tr>
              </thead>
              <tbody>
                {(list.data ?? []).map((n: any) => (
                  <tr key={n.id} className="border-b border-border/30">
                    <td className="px-2 py-2 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</td>
                    <td className="px-2 py-2"><button className="text-primary hover:underline" onClick={() => adminUserDrawer.show(n.user_id)}>{n.full_name || n.username || n.user_id.slice(0, 8)}</button></td>
                    <td className="px-2 py-2"><Badge variant="outline">{n.type}</Badge></td>
                    <td className="px-2 py-2">{n.title}</td>
                    <td className="px-2 py-2">{n.read ? "✓" : "—"}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">{n.sent_by_admin ? "yes" : "—"}</td>
                  </tr>
                ))}
                {(list.data ?? []).length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No notifications.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3"><Smartphone className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Push subscriptions</h2></div>
        {subs.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-2 py-2">User</th><th className="px-2 py-2">Endpoint</th>
                  <th className="px-2 py-2">Active</th><th className="px-2 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {(subs.data ?? []).map((s: any) => (
                  <tr key={s.id} className="border-b border-border/30">
                    <td className="px-2 py-2"><button className="text-primary hover:underline" onClick={() => adminUserDrawer.show(s.user_id)}>{s.full_name || s.user_id.slice(0, 8)}</button></td>
                    <td className="px-2 py-2 font-mono text-[10px] truncate max-w-[420px]">{s.endpoint}</td>
                    <td className="px-2 py-2">{s.is_active ? "✓" : "—"}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {(subs.data ?? []).length === 0 && <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">No subscriptions.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default NotificationsAdmin;
