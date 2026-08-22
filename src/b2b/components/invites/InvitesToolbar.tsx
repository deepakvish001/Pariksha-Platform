import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Mail,
  Search,
  MoreHorizontal,
  Download,
  Copy,
  RefreshCw,
  Bell,
} from "lucide-react";
import type { Invite } from "../../hooks/useInvites";
import { inviteDerivedStatus, type SortKey, type StatusFilter } from "./types";

const STATUSES: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "scheduled", label: "Scheduled" },
  { key: "sent", label: "Sent" },
  { key: "claimed", label: "Started" },
  { key: "submitted", label: "Submitted" },
  { key: "failed", label: "Failed" },
];

export function InvitesToolbar({
  invites,
  filter,
  setFilter,
  search,
  setSearch,
  sort,
  setSort,
  onPreview,
  onTest,
  onResendPending,
  onExportCsv,
  onCopyAllLinks,
  resendingPending,
  reminderEnabled,
  reminderDays,
  onReminderChange,
}: {
  invites: Invite[];
  filter: StatusFilter;
  setFilter: (s: StatusFilter) => void;
  search: string;
  setSearch: (s: string) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  onPreview: () => void;
  onTest: () => void;
  onResendPending: () => void;
  onExportCsv: () => void;
  onCopyAllLinks: () => void;
  resendingPending: boolean;
  reminderEnabled: boolean;
  reminderDays: number;
  onReminderChange: (enabled: boolean, days: number) => void;
}) {
  const counts: Record<StatusFilter, number> = {
    all: invites.length,
    pending: 0,
    scheduled: 0,
    sent: 0,
    claimed: 0,
    submitted: 0,
    failed: 0,
  };
  invites.forEach((i) => {
    const d = inviteDerivedStatus(i);
    counts[d]++;
  });

  return (
    <div className="b2b-card p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUSES.map((s) => {
          const active = filter === s.key;
          const n = counts[s.key];
          return (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`px-2.5 py-1 rounded-full text-xs border transition ${
                active
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-transparent"
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))/0.4]"
              }`}
            >
              {s.label}
              <span className={`ml-1.5 ${active ? "opacity-80" : "text-[hsl(var(--muted-foreground))]"}`}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-60" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, roll id"
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-8 w-[140px] text-sm">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="last_sent">Last sent</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Eye className="h-3.5 w-3.5 mr-1" /> Preview
          </Button>
          <Button variant="outline" size="sm" onClick={onTest}>
            <Mail className="h-3.5 w-3.5 mr-1" /> Test
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" title="Auto-reminders">
                <Bell className="h-3.5 w-3.5 mr-1" />
                Reminders{reminderEnabled ? ` · ${reminderDays}d` : ""}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Auto-remind pending</div>
                <Switch
                  checked={reminderEnabled}
                  onCheckedChange={(v) => onReminderChange(v, reminderDays)}
                  aria-label="Auto-remind pending"
                />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Re-sends the invite to candidates who haven't started after N days.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs">After</span>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={reminderDays}
                  disabled={!reminderEnabled}
                  className="h-8 w-16"
                  onChange={(e) =>
                    onReminderChange(
                      reminderEnabled,
                      Math.max(1, Math.min(30, Number(e.target.value || 1))),
                    )
                  }
                />
                <span className="text-xs">day(s)</span>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={onResendPending}
            disabled={resendingPending || counts.pending + counts.failed === 0}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${resendingPending ? "animate-spin" : ""}`} />
            {resendingPending ? "Sending…" : "Resend pending"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="More options">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportCsv}>
                <Download className="h-3.5 w-3.5 mr-2" /> Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCopyAllLinks}>
                <Copy className="h-3.5 w-3.5 mr-2" /> Copy all join links
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
