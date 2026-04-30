import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarClock, X, Plus } from "lucide-react";
import {
  useScheduledBroadcasts,
  useScheduleBroadcast,
  useCancelScheduledBroadcast,
} from "@/hooks/admin/useAdminCoverage";

import { supabase } from "@/integrations/supabase/client";

const ScheduledBroadcastsAdmin = () => {
  const list = useScheduledBroadcasts(false);
  const schedule = useScheduleBroadcast();
  const cancel = useCancelScheduledBroadcast();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [minXp, setMinXp] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [when, setWhen] = useState<string>(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMilliseconds(0); d.setSeconds(0);
    return d.toISOString().slice(0, 16);
  });

  const buildFilter = () => {
    const f: Record<string, unknown> = {};
    if (minXp.trim() && !Number.isNaN(Number(minXp))) f.min_xp = Number(minXp);
    if (role.trim()) f.role = role.trim();
    return f;
  };

  const preview = async () => {
    setPreviewing(true);
    try {
      const f = buildFilter();
      let q = supabase.from("profiles").select("user_id", { count: "exact", head: true });
      if (typeof f.min_xp === "number") q = q.gte("total_xp", f.min_xp);
      if (f.role === "admin") {
        const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
        const ids = (roles ?? []).map((r: any) => r.user_id);
        if (!ids.length) { setPreviewCount(0); return; }
        q = q.in("user_id", ids);
      }
      const { count } = await q;
      setPreviewCount(count ?? 0);
    } finally { setPreviewing(false); }
  };

  const submit = () => {
    if (!title.trim() || !message.trim()) return;
    schedule.mutate(
      {
        title: title.trim(), message: message.trim(),
        scheduledFor: new Date(when).toISOString(),
        targetFilter: buildFilter(),
      },
      { onSuccess: () => { setTitle(""); setMessage(""); setPreviewCount(null); } },
    );
  };

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Scheduled Broadcasts</h1>
        <p className="text-sm text-muted-foreground">Queue announcements to be delivered at a future time.</p>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3"><Plus className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Schedule a new broadcast</h2></div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs">Title</Label>
            <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
          <div>
            <Label className="text-xs">Send at</Label>
            <Input className="mt-1" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-xs">Message</Label>
          <Textarea className="mt-1" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <Label className="text-xs">Min total XP (optional)</Label>
            <Input className="mt-1" type="number" min={0} value={minXp} onChange={(e) => { setMinXp(e.target.value); setPreviewCount(null); }} placeholder="e.g. 500" />
          </div>
          <div>
            <Label className="text-xs">Role (optional)</Label>
            <Input className="mt-1" value={role} onChange={(e) => { setRole(e.target.value); setPreviewCount(null); }} placeholder="e.g. admin" />
          </div>
          <div className="flex items-end gap-2">
            <Button size="sm" variant="outline" onClick={preview} disabled={previewing}>
              {previewing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Preview targets
            </Button>
            {previewCount !== null && <span className="text-xs text-muted-foreground">~{previewCount} recipients</span>}
          </div>
        </div>
        <Button size="sm" className="mt-3" onClick={submit} disabled={!title.trim() || !message.trim() || schedule.isPending}>
          <CalendarClock className="h-3.5 w-3.5 mr-1" /> Schedule
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">A cron-driven worker delivers due broadcasts every minute.</p>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3">Queue</h2>
        {list.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-2 py-2">Scheduled for</th><th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2 text-right">Recipients</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(list.data ?? []).map((b: any) => {
                  const status = b.cancelled_at ? "cancelled" : b.sent_at ? "sent" : "pending";
                  return (
                    <tr key={b.id} className="border-b border-border/30">
                      <td className="px-2 py-2 text-xs text-muted-foreground">{new Date(b.scheduled_for).toLocaleString()}</td>
                      <td className="px-2 py-2 truncate max-w-[300px]">{b.title}</td>
                      <td className="px-2 py-2">
                        <Badge variant={status === "sent" ? "default" : status === "pending" ? "secondary" : "outline"}>{status}</Badge>
                      </td>
                      <td className="px-2 py-2 text-right">{b.recipient_count ?? "—"}</td>
                      <td className="px-2 py-2 text-right">
                        {status === "pending" && (
                          <Button size="sm" variant="ghost" onClick={() => cancel.mutate(b.id)} disabled={cancel.isPending}>
                            <X className="h-3.5 w-3.5 mr-1 text-destructive" /> Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(list.data ?? []).length === 0 && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No scheduled broadcasts.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default ScheduledBroadcastsAdmin;
