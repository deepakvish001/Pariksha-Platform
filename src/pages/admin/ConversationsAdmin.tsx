import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import { AdminUserPicker } from "@/components/admin/AdminUserPicker";
import type { AdminUserHit } from "@/hooks/admin/useAdminUserSearch";
import {
  useAdminConversations,
  useAdminChatUsage,
  usePurgeConversations,
} from "@/hooks/admin/useAdminCoverage";

const ConversationsAdmin = () => {
  const [user, setUser] = useState<AdminUserHit | null>(null);
  const stats = useAdminChatUsage();
  const list = useAdminConversations(user?.user_id ?? null);
  const purge = usePurgeConversations();

  const s = stats.data ?? {};

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Byteskill AI Conversations</h1>
        <p className="text-sm text-muted-foreground">Per-user chat history and usage stats.</p>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 mb-4">
        {[
          { label: "Total conversations", value: s.conversations_total ?? "—" },
          { label: "Total messages", value: s.messages_total ?? "—" },
          { label: "Active users (30d)", value: s.active_users_30d ?? "—" },
        ].map((k) => (
          <Card key={k.label} className="p-3">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="text-xl font-bold mt-1">{k.value}</div>
          </Card>
        ))}
      </div>

      {Array.isArray(s.top_users) && s.top_users.length > 0 && (
        <Card className="p-4 mb-4">
          <h2 className="text-sm font-semibold mb-2">Top users by conversation count</h2>
          <div className="flex flex-wrap gap-2">
            {s.top_users.map((t: any, i: number) => (
              <div key={i} className="rounded-md border border-border/50 px-2 py-1 text-xs">
                {t.full_name || t.user_id?.slice(0, 8)} <span className="text-muted-foreground">· {t.conv_count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Conversations</h2></div>
          <div className="w-72"><AdminUserPicker value={user} onChange={setUser} placeholder="Filter by user…" /></div>
        </div>
        {user && (
          <Button size="sm" variant="destructive" className="mb-3" disabled={purge.isPending}
            onClick={() => { if (confirm(`Purge ALL conversations for ${user.full_name || user.username}? This cannot be undone.`)) purge.mutate(user.user_id); }}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Purge all conversations for this user
          </Button>
        )}
        {list.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-2 py-2">Updated</th><th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2 text-right">Messages</th>
                </tr>
              </thead>
              <tbody>
                {(list.data ?? []).map((c: any) => (
                  <tr key={c.id} className="border-b border-border/30">
                    <td className="px-2 py-2 text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleString()}</td>
                    <td className="px-2 py-2">{c.full_name || c.user_id.slice(0, 8)}</td>
                    <td className="px-2 py-2 truncate max-w-[420px]">{c.title || <span className="text-muted-foreground">Untitled</span>}</td>
                    <td className="px-2 py-2 text-right">{c.message_count}</td>
                  </tr>
                ))}
                {(list.data ?? []).length === 0 && <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">No conversations.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default ConversationsAdmin;
