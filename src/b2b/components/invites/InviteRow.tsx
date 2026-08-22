import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, MoreHorizontal, Send, Trash2, Clock, AlertCircle } from "lucide-react";
import type { Invite } from "../../hooks/useInvites";
import { inviteDerivedStatus } from "./types";

function relTime(iso?: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function StatusPill({ s }: { s: ReturnType<typeof inviteDerivedStatus> }) {
  const cls: Record<typeof s, string> = {
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    scheduled: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    sent: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    claimed: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    submitted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    failed: "bg-red-500/15 text-red-700 dark:text-red-300",
  };
  const label: Record<typeof s, string> = {
    pending: "Pending",
    scheduled: "Scheduled",
    sent: "Sent",
    claimed: "Started",
    submitted: "Submitted",
    failed: "Failed",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cls[s]}`}>
      {label[s]}
    </span>
  );
}

export function InviteRow({
  invite,
  joinUrl,
  selected,
  onToggleSelect,
  onResend,
  onCopy,
  onDelete,
  sending,
  cooldown,
}: {
  invite: Invite;
  joinUrl: string;
  selected: boolean;
  onToggleSelect: () => void;
  onResend: () => void;
  onCopy: () => void;
  onDelete: () => void;
  sending: boolean;
  cooldown: boolean;
}) {
  const s = inviteDerivedStatus(invite);
  const scheduledAt = (invite as any).scheduled_send_at as string | null;
  return (
    <div className="px-3 py-2.5 flex items-center gap-3 text-sm hover:bg-[hsl(var(--muted))/0.3]">
      <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="font-medium truncate">{invite.name ?? invite.email}</div>
          <StatusPill s={s} />
        </div>
        <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">
          {invite.email}
          {invite.external_id ? ` · ${invite.external_id}` : ""}
        </div>
        <div className="text-[11px] text-[hsl(var(--muted-foreground))] truncate mt-0.5">
          {s === "scheduled" && scheduledAt ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Scheduled for {new Date(scheduledAt).toLocaleString()}
            </span>
          ) : s === "failed" ? (
            <span className="inline-flex items-center gap-1 text-[hsl(var(--destructive))]">
              <AlertCircle className="h-3 w-3" />
              {invite.last_send_error ?? "Send failed"}
            </span>
          ) : invite.last_sent_at ? (
            <>
              Last sent {relTime(invite.last_sent_at)}
              {invite.send_count ? ` · ${invite.send_count}×` : ""}
            </>
          ) : (
            <span className="opacity-60">Not sent yet</span>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onResend}
        disabled={sending || cooldown}
        title={cooldown ? "Just sent — wait a moment" : ""}
      >
        <Send className="h-3 w-3 mr-1" />
        {sending ? "Sending…" : invite.last_sent_at ? "Resend" : "Send"}
      </Button>
      <Button variant="outline" size="sm" onClick={onCopy} title={joinUrl}>
        <Copy className="h-3 w-3 mr-1" /> Link
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="More options">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onCopy}>
            <Copy className="h-3.5 w-3.5 mr-2" /> Copy join link
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-[hsl(var(--destructive))]"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { StatusPill };
