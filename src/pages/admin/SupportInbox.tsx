import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Inbox, Loader2, Trash2, Plus, MessageSquareQuote } from "lucide-react";
import {
  useSupportMessages,
  useUpdateSupportMessage,
  useDeleteSupportMessage,
} from "@/hooks/admin/useSupportInbox";
import {
  useCannedReplies, useUpsertCannedReply, useDeleteCannedReply,
} from "@/hooks/admin/useAdminCoverage";
import { formatDistanceToNow } from "date-fns";

export default function SupportInbox() {
  const [status, setStatus] = useState("open");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const { data, isLoading } = useSupportMessages(status);
  const update = useUpdateSupportMessage();
  const del = useDeleteSupportMessage();

  const active = data?.find((m) => m.id === activeId) ?? null;

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Inbox className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Support Inbox</h1>
              <p className="text-sm text-muted-foreground">
                User-submitted feedback and support tickets.
              </p>
            </div>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Messages ({data?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !data?.length ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No messages.
                </p>
              ) : (
                <div className="divide-y divide-border/40 max-h-[60vh] overflow-y-auto">
                  {data.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setActiveId(m.id);
                        setReply(m.reply_body ?? "");
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${
                        activeId === m.id ? "bg-muted/50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{m.subject}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {active ? active.subject : "Select a message"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!active ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Pick a message on the left to read and reply.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs text-muted-foreground">
                    From <span className="text-foreground">{active.email}</span> ·{" "}
                    {new Date(active.created_at).toLocaleString()} · status{" "}
                    <span className="text-foreground">{active.status}</span>
                  </div>
                  <div className="rounded-md border border-border/40 bg-muted/20 p-3 text-sm whitespace-pre-wrap">
                    {active.body}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Reply (saved to record)
                    </label>
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={4}
                      placeholder="Internal reply note (use mailto for outbound email)…"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        update.mutate({
                          id: active.id,
                          patch: { reply_body: reply, status: "resolved" },
                        })
                      }
                      disabled={!reply.trim() || update.isPending}
                    >
                      Mark resolved
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        update.mutate({ id: active.id, patch: { status: "dismissed" } })
                      }
                    >
                      Dismiss
                    </Button>
                    <a
                      className="text-xs underline text-primary"
                      href={`mailto:${active.email}?subject=Re: ${encodeURIComponent(
                        active.subject
                      )}`}
                    >
                      Reply via email
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-destructive"
                      onClick={() => {
                        del.mutate(active.id);
                        setActiveId(null);
                      }}
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
