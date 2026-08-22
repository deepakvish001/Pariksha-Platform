import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Inbox,
  Trash2,
  Plus,
  MessageSquareQuote,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Layers,
  Mail,
  type LucideIcon,
} from "lucide-react";
import {
  useSupportMessages,
  useUpdateSupportMessage,
  useDeleteSupportMessage,
} from "@/hooks/admin/useSupportInbox";
import {
  useCannedReplies,
  useUpsertCannedReply,
  useDeleteCannedReply,
} from "@/hooks/admin/useAdminCoverage";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/* ────────────── Shared glassmorphic primitives (mirrors AdminDashboard) ────────────── */

interface KpiProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "success" | "danger";
  active?: boolean;
  onClick?: () => void;
}
const toneRing: Record<NonNullable<KpiProps["tone"]>, string> = {
  default: "from-foreground/10 to-foreground/0",
  primary: "from-primary/30 to-primary/0",
  success: "from-emerald-500/30 to-emerald-500/0",
  danger: "from-destructive/40 to-destructive/0",
};
const toneIcon: Record<NonNullable<KpiProps["tone"]>, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/15 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.35)]",
  success: "bg-emerald-500/15 text-emerald-500 shadow-[0_0_18px_hsl(142_70%_45%/0.35)]",
  danger: "bg-destructive/15 text-destructive shadow-[0_0_18px_hsl(var(--destructive)/0.35)]",
};

const Kpi = ({ label, value, icon: Icon, tone = "default", active, onClick }: KpiProps) => (
  <Card
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={(e) => {
      if (!onClick) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    }}
    className={cn(
      "group relative overflow-hidden border-border/40 bg-card/40 p-4 backdrop-blur-md transition-all duration-300",
      onClick && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-20px_hsl(24_95%_53%/0.45)]",
      active && "border-primary/60 shadow-[0_18px_40px_-20px_hsl(24_95%_53%/0.55)]",
    )}
  >
    <span
      aria-hidden
      className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r", toneRing[tone])}
    />
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{value ?? "—"}</p>
      </div>
      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", toneIcon[tone])}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  </Card>
);

const GlassCard = ({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <Card
    className={cn(
      "relative overflow-hidden border-border/40 bg-card/40 p-5 backdrop-blur-md sm:p-6",
      className,
    )}
    {...rest}
  >
    {children}
  </Card>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 flex items-center gap-2">
    <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  </div>
);

/* ────────────── Page ────────────── */

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

export default function SupportInbox() {
  const [status, setStatus] = useState("open");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  // One query for stats (all), one filtered query for the list — sharing cache via key.
  const { data: all = [] } = useSupportMessages("all");
  const { data, isLoading, error, refetch, isRefetching } = useSupportMessages(status);
  const update = useUpdateSupportMessage();
  const del = useDeleteSupportMessage();

  const counts = useMemo(() => {
    const c = { open: 0, resolved: 0, dismissed: 0, total: all.length };
    for (const m of all) {
      if (m.status === "open") c.open++;
      else if (m.status === "resolved") c.resolved++;
      else if (m.status === "dismissed") c.dismissed++;
    }
    return c;
  }, [all]);

  const active = data?.find((m) => m.id === activeId) ?? null;

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Support"
        title="Support Inbox"
        description="User-submitted feedback and tickets — triage, reply, and resolve from one place."
        chips={[
          { label: `${counts.open} open`, tone: counts.open > 0 ? "danger" : "success" },
          { label: `${counts.resolved} resolved`, tone: "success" },
          { label: `${counts.dismissed} dismissed`, tone: "default" },
        ]}
        actions={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-full min-w-[10rem] border-border/60 bg-card/40 backdrop-blur sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <SectionTitle>Pulse</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Open"
          value={counts.open}
          icon={AlertCircle}
          tone={counts.open > 0 ? "danger" : "default"}
          active={status === "open"}
          onClick={() => setStatus("open")}
        />
        <Kpi
          label="Resolved"
          value={counts.resolved}
          icon={CheckCircle2}
          tone="success"
          active={status === "resolved"}
          onClick={() => setStatus("resolved")}
        />
        <Kpi
          label="Dismissed"
          value={counts.dismissed}
          icon={XCircle}
          active={status === "dismissed"}
          onClick={() => setStatus("dismissed")}
        />
        <Kpi
          label="Total received"
          value={counts.total}
          icon={Layers}
          tone="primary"
          active={status === "all"}
          onClick={() => setStatus("all")}
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* Message list */}
        <GlassCard className="p-0 sm:p-0">
          <div className="flex items-center justify-between gap-2 border-b border-border/40 p-4">
            <div className="flex min-w-0 items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" />
              <h3 className="truncate text-sm font-semibold">
                Messages{" "}
                <span className="text-muted-foreground">({data?.length ?? 0})</span>
              </h3>
            </div>
            {isRefetching && (
              <span className="text-[10px] text-muted-foreground">refreshing…</span>
            )}
          </div>

          {isLoading ? (
            <div className="divide-y divide-border/30">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertCircle}
              tone="danger"
              title="Couldn't load messages"
              hint={(error as Error)?.message ?? "Something went wrong."}
              action={
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  Try again
                </Button>
              }
            />
          ) : !data?.length ? (
            <EmptyState
              icon={Inbox}
              title="Inbox is clear"
              hint={
                status === "open"
                  ? "No open tickets right now. "
                  : `No ${status} messages.`
              }
            />
          ) : (
            <div className="max-h-[60vh] divide-y divide-border/30 overflow-y-auto">
              {data.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveId(m.id);
                    setReply(m.reply_body ?? "");
                  }}
                  className={cn(
                    "group/item w-full px-4 py-3 text-left transition-colors hover:bg-muted/30",
                    activeId === m.id && "bg-primary/5",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {activeId === m.id && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                      )}
                      <span className="truncate text-sm font-medium">{m.subject}</span>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{m.email}</span>
                    <StatusPill status={m.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Detail / reply */}
        <GlassCard>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold">
              {active ? active.subject : "Select a message"}
            </h3>
            {active && <StatusPill status={active.status} />}
          </div>

          {!active ? (
            <EmptyState
              icon={MessageSquareQuote}
              title="Nothing selected"
              hint="Pick a message on the left to read and reply."
            />
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                From <span className="text-foreground">{active.email}</span> ·{" "}
                {new Date(active.created_at).toLocaleString()}
              </div>
              <div className="rounded-lg border border-border/40 bg-background/40 p-3 text-sm whitespace-pre-wrap backdrop-blur">
                {active.body}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="support-reply" className="text-xs font-medium text-muted-foreground">
                    Reply (saved to record)
                  </label>
                  <CannedRepliesPicker
                    onPick={(body) => setReply((r) => (r ? `${r}\n\n${body}` : body))}
                  />
                </div>
                <Textarea
                  id="support-reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  placeholder="Internal reply note (use mailto for outbound email)…"
                  className="bg-background/40 backdrop-blur"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-amber-500 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.6)] hover:opacity-95"
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
                  className="border-border/60 bg-card/40 backdrop-blur"
                  onClick={() =>
                    update.mutate({ id: active.id, patch: { status: "dismissed" } })
                  }
                >
                  Dismiss
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="text-primary hover:text-primary"
                >
                  <a
                    href={`mailto:${active.email}?subject=Re: ${encodeURIComponent(
                      active.subject,
                    )}`}
                  >
                    Reply via email
                  </a>
                </Button>
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
        </GlassCard>
      </div>

      <div className="mt-8">
        <SectionTitle>Canned replies</SectionTitle>
        <CannedRepliesManager />
      </div>
    </AdminShell>
  );
}

/* ────────────── Helpers ────────────── */

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    open: {
      label: "Open",
      cls: "border-destructive/40 bg-destructive/10 text-destructive",
    },
    resolved: {
      label: "Resolved",
      cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
    },
    dismissed: {
      label: "Dismissed",
      cls: "border-border/60 bg-card/40 text-muted-foreground",
    },
  };
  const v = map[status] ?? { label: status, cls: "border-border/60 bg-card/40 text-muted-foreground" };
  return (
    <span
      className={cn(
        "ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        v.cls,
      )}
    >
      {v.label}
    </span>
  );
};

const EmptyState = ({
  icon: Icon,
  title,
  hint,
  action,
  tone = "default",
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  tone?: "default" | "danger";
}) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
    <div
      className={cn(
        "grid h-12 w-12 place-items-center rounded-full",
        tone === "danger"
          ? "bg-destructive/10 text-destructive shadow-[0_0_24px_hsl(var(--destructive)/0.3)]"
          : "bg-primary/10 text-primary shadow-[0_0_24px_hsl(var(--primary)/0.3)]",
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
    <div className="max-w-sm">
      <p className="text-sm font-semibold">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
    {action}
  </div>
);

function CannedRepliesPicker({ onPick }: { onPick: (body: string) => void }) {
  const { data = [] } = useCannedReplies();
  if (!data.length) return null;
  return (
    <Select
      onValueChange={(id) => {
        const r = data.find((x: any) => x.id === id);
        if (r) onPick(r.body);
      }}
    >
      <SelectTrigger className="h-7 w-44 border-border/60 bg-card/40 text-xs backdrop-blur">
        <SelectValue placeholder="Insert canned reply…" />
      </SelectTrigger>
      <SelectContent>
        {data.map((r: any) => (
          <SelectItem key={r.id} value={r.id}>
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CannedRepliesManager() {
  const { data = [], isLoading } = useCannedReplies();
  const upsert = useUpsertCannedReply();
  const del = useDeleteCannedReply();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [body, setBody] = useState("");

  const reset = () => {
    setEditingId(null);
    setLabel("");
    setBody("");
  };

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.4)]">
          <MessageSquareQuote className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-sm font-semibold">Canned replies</h3>
      </div>

      <div className="grid gap-2 sm:grid-cols-[200px_1fr_auto_auto]">
        <Input
          placeholder="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="bg-background/40 backdrop-blur"
        />
        <Input
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="bg-background/40 backdrop-blur"
        />
        <Button
          size="sm"
          disabled={!label || !body || upsert.isPending}
          onClick={() => upsert.mutate({ id: editingId, label, body }, { onSuccess: reset })}
          className="bg-gradient-to-r from-primary to-amber-500"
        >
          <Plus className="mr-1 h-3 w-3" />
          {editingId ? "Update" : "Add"}
        </Button>
        {editingId && (
          <Button size="sm" variant="ghost" onClick={reset}>
            Cancel
          </Button>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))
        ) : data.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            title="No canned replies yet"
            hint="Save common responses above for one-click insertion."
          />
        ) : (
          data.map((r: any) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-xs backdrop-blur"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.label}</p>
                <p className="truncate text-muted-foreground">{r.body}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingId(r.id);
                  setLabel(r.label);
                  setBody(r.body);
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => del.mutate(r.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
