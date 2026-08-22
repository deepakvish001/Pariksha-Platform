import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBroadcast } from "@/hooks/admin/useAdminControl";
import { Megaphone, Send } from "lucide-react";

const Broadcast = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"all" | "level" | "role" | "user">("all");
  const [minLevel, setMinLevel] = useState(1);
  const [role, setRole] = useState("user");
  const [userId, setUserId] = useState("");
  const broadcast = useBroadcast();

  const send = () => {
    if (!title.trim() || !message.trim()) return;
    const audience: any = { kind };
    if (kind === "level") audience.min_level = minLevel;
    if (kind === "role") audience.role = role;
    if (kind === "user") audience.user_id = userId;
    broadcast.mutate({ audience, title: title.trim(), message: message.trim() });
  };

  return (
    <AdminShell>
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold"><Megaphone className="h-5 w-5" /> Broadcast Notification</h1>
      <p className="mb-4 text-sm text-muted-foreground">Send an in-app notification to all users or a filtered audience.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Headline" maxLength={120} />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Body…" maxLength={500} />
          </div>
          <div>
            <Label>Audience</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="level">Level ≥ N</SelectItem>
                <SelectItem value="role">Specific role</SelectItem>
                <SelectItem value="user">Single user</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kind === "level" && (
            <div><Label htmlFor="broadcast-min-level">Minimum level</Label>
              <Input id="broadcast-min-level" type="number" min={1} max={20} value={minLevel} onChange={(e) => setMinLevel(Number(e.target.value))} />
            </div>
          )}
          {kind === "role" && (
            <div><Label htmlFor="broadcast-role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="broadcast-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="moderator">moderator</SelectItem>
                  <SelectItem value="user">user</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {kind === "user" && (
            <div><Label htmlFor="broadcast-user-id">User ID (UUID)</Label>
              <Input id="broadcast-user-id" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="00000000-0000-…" />
            </div>
          )}
          <Button onClick={send} disabled={!title || !message || broadcast.isPending}>
            <Send className="mr-2 h-4 w-4" /> {broadcast.isPending ? "Sending…" : "Send broadcast"}
          </Button>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Preview</h2>
          <div className="rounded-md border border-border/50 bg-muted/30 p-3">
            <p className="font-semibold">{title || "Notification title"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{message || "Notification message will appear here."}</p>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">This is delivered as an in-app notification to every matching user immediately. Capped at 50,000 per send.</p>
        </Card>
      </div>
    </AdminShell>
  );
};

export default Broadcast;
