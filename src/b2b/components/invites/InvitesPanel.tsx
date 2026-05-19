import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  buildJoinUrl,
  useCreateInvites,
  useDeleteInvite,
  useInvites,
  type Invite,
} from "../../hooks/useInvites";
import {
  useBulkDeleteInvites,
  useScheduleInvites,
  useSendInvites,
} from "../../hooks/useInviteActions";
import { useAssessment, useUpdateAssessment } from "../../hooks/useAssessments";
import { AddCandidatesCard, type SendMode } from "./AddCandidatesCard";
import { InvitesToolbar } from "./InvitesToolbar";
import { InviteRow } from "./InviteRow";
import { BulkActionBar } from "./BulkActionBar";
import { inviteDerivedStatus, type SortKey, type StatusFilter } from "./types";

const CONFIRM_THRESHOLD = 10;
const COOLDOWN_MS = 30_000;
const SUPPRESS_CONFIRM_KEY = "b2b.invites.suppressConfirm";

export function InvitesPanel({ assessmentId }: { assessmentId: string }) {
  const { data: invites = [] } = useInvites(assessmentId);
  const { data: assessment } = useAssessment(assessmentId);
  const updateAssessment = useUpdateAssessment();

  const create = useCreateInvites();
  const del = useDeleteInvite();
  const bulkDel = useBulkDeleteInvites(assessmentId);
  const send = useSendInvites(assessmentId);
  const schedule = useScheduleInvites(assessmentId);

  // UI state
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [cooldownIds, setCooldownIds] = useState<Map<string, number>>(new Map());
  const [resendingPending, setResendingPending] = useState(false);

  // Preview / test
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  // Confirm before send
  const [confirm, setConfirm] = useState<{
    open: boolean;
    count: number;
    emails: string[];
    onConfirm: () => void;
  } | null>(null);

  // Bulk schedule
  const [bulkScheduleOpen, setBulkScheduleOpen] = useState(false);
  const [bulkScheduleAt, setBulkScheduleAt] = useState("");

  // Delete confirm
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);

  // Tick to refresh cooldowns
  const [, setTick] = useState(0);
  useEffect(() => {
    if (cooldownIds.size === 0) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [cooldownIds.size]);

  const existingEmails = useMemo(
    () => new Set(invites.map((i) => i.email.toLowerCase())),
    [invites],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = invites.filter((i) => {
      if (filter !== "all" && inviteDerivedStatus(i) !== filter) return false;
      if (!q) return true;
      return (
        i.email.toLowerCase().includes(q) ||
        (i.name ?? "").toLowerCase().includes(q) ||
        (i.external_id ?? "").toLowerCase().includes(q)
      );
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "name")
        return (a.name ?? a.email).localeCompare(b.name ?? b.email);
      if (sort === "status")
        return inviteDerivedStatus(a).localeCompare(inviteDerivedStatus(b));
      if (sort === "last_sent")
        return (
          new Date(b.last_sent_at ?? 0).getTime() -
          new Date(a.last_sent_at ?? 0).getTime()
        );
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    return rows;
  }, [invites, filter, search, sort]);

  const scheduledCount = invites.filter(
    (i) => inviteDerivedStatus(i) === "scheduled",
  ).length;
  const nextScheduled = invites
    .map((i) => (i as any).scheduled_send_at as string | null)
    .filter(Boolean)
    .sort()[0];

  // ----- actions -----

  function markCooldown(ids: string[]) {
    const until = Date.now() + COOLDOWN_MS;
    setCooldownIds((m) => {
      const n = new Map(m);
      ids.forEach((id) => n.set(id, until));
      return n;
    });
    setTimeout(() => {
      setCooldownIds((m) => {
        const n = new Map(m);
        ids.forEach((id) => {
          if ((n.get(id) ?? 0) <= Date.now()) n.delete(id);
        });
        return n;
      });
    }, COOLDOWN_MS + 100);
  }

  async function doSend(ids: string[], onlyPending = false) {
    const newSet = new Set(sendingIds);
    ids.forEach((id) => newSet.add(id));
    setSendingIds(newSet);
    const toastId = toast.loading(
      ids.length > 1 ? `Sending ${ids.length} emails…` : "Sending email…",
    );
    try {
      const r = await send.mutateAsync(
        onlyPending ? { only_pending: true } : { invite_ids: ids },
      );
      toast.dismiss(toastId);
      if (r.sent > 0) toast.success(`Sent ${r.sent} email${r.sent === 1 ? "" : "s"}`);
      if (r.failed > 0) toast.error(`${r.failed} failed to send`);
      if (!r.sent && !r.failed) toast.info("Nothing to send");
      markCooldown(ids);
    } catch (e) {
      toast.dismiss(toastId);
      toast.error((e as Error).message);
    } finally {
      setSendingIds((s) => {
        const n = new Set(s);
        ids.forEach((id) => n.delete(id));
        return n;
      });
    }
  }

  function confirmThenSend(ids: string[], emails: string[], onlyPending = false) {
    const suppress = typeof window !== "undefined" && localStorage.getItem(SUPPRESS_CONFIRM_KEY) === "1";
    if (suppress || ids.length < CONFIRM_THRESHOLD) {
      void doSend(ids, onlyPending);
      return;
    }
    setConfirm({
      open: true,
      count: ids.length,
      emails: emails.slice(0, 5),
      onConfirm: () => {
        setConfirm(null);
        void doSend(ids, onlyPending);
      },
    });
  }

  async function handleAddSubmit(
    rows: { email: string; name?: string; external_id?: string }[],
    mode: SendMode,
    scheduleAt?: string,
  ) {
    const inserted = await create.mutateAsync({
      assessment_id: assessmentId,
      rows,
    });
    if (!inserted.length) {
      toast.info("No new invites added (duplicates skipped)");
      return;
    }
    toast.success(`${inserted.length} invite${inserted.length === 1 ? "" : "s"} added`);
    const ids = inserted.map((i) => i.id);
    if (mode === "schedule" && scheduleAt) {
      await schedule.mutateAsync({ invite_ids: ids, scheduled_send_at: scheduleAt });
      toast.success(`Scheduled for ${new Date(scheduleAt).toLocaleString()}`);
    } else if (mode === "now") {
      await doSend(ids);
    }
  }

  // Preview
  async function openPreview() {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewHtml(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-assessment-invite",
        { body: { assessment_id: assessmentId, preview: true } },
      );
      if (error) throw new Error(error.message ?? "Preview failed");
      setPreviewHtml((data as any).html ?? "");
      setPreviewSubject((data as any).subject ?? "");
    } catch (e) {
      toast.error((e as Error).message);
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  }
  async function doTest() {
    const addr = testEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      toast.error("Enter a valid email address");
      return;
    }
    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-assessment-invite",
        { body: { assessment_id: assessmentId, test_email: addr } },
      );
      if (error) throw new Error(error.message ?? "Failed to send");
      if ((data as any).ok) {
        toast.success(`Test email sent to ${addr}`);
        setTestOpen(false);
      } else {
        toast.error((data as any).error ?? "Failed to send");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSendingTest(false);
    }
  }

  // Bulk helpers
  function toggleAll() {
    if (selected.size === visible.length) setSelected(new Set());
    else setSelected(new Set(visible.map((i) => i.id)));
  }
  function exportCsv(rows: Invite[]) {
    const header = "email,name,external_id,status,last_sent_at,join_url\n";
    const body = rows
      .map((i) =>
        [
          i.email,
          i.name ?? "",
          i.external_id ?? "",
          inviteDerivedStatus(i),
          i.last_sent_at ?? "",
          buildJoinUrl(i.token),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invites-${assessmentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function copyAllLinks(rows: Invite[]) {
    const text = rows.map((i) => `${i.email}\t${buildJoinUrl(i.token)}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success(`${rows.length} join link(s) copied`);
  }

  const selectedInvites = invites.filter((i) => selected.has(i.id));
  const reminderEnabled = !!(assessment as any)?.auto_reminder_enabled;
  const reminderDays = (assessment as any)?.auto_reminder_after_days ?? 3;

  return (
    <div className="space-y-4">
      <AddCandidatesCard
        existingEmails={existingEmails}
        busy={create.isPending || send.isPending}
        onSubmit={handleAddSubmit}
        participationMode={(assessment as any)?.participation_mode ?? null}
      />


      <InvitesToolbar
        invites={invites}
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
        sort={sort}
        setSort={setSort}
        onPreview={openPreview}
        onTest={() => setTestOpen(true)}
        onResendPending={() => {
          const pendingIds = invites
            .filter((i) => i.status === "pending" && !(i as any).scheduled_send_at)
            .map((i) => i.id);
          const emails = invites
            .filter((i) => pendingIds.includes(i.id))
            .map((i) => i.email);
          if (!pendingIds.length) return toast.info("No pending invites to send");
          setResendingPending(true);
          confirmThenSend(pendingIds, emails, true);
          setTimeout(() => setResendingPending(false), 1000);
        }}
        resendingPending={resendingPending}
        onExportCsv={() => exportCsv(invites)}
        onCopyAllLinks={() => copyAllLinks(invites)}
        reminderEnabled={reminderEnabled}
        reminderDays={reminderDays}
        onReminderChange={(enabled, days) => {
          updateAssessment.mutate({
            id: assessmentId,
            patch: {
              auto_reminder_enabled: enabled,
              auto_reminder_after_days: days,
            } as any,
          });
        }}
      />

      {scheduledCount > 0 && nextScheduled && (
        <div className="b2b-card px-3 py-2 flex items-center gap-2 text-xs">
          <Clock className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
          <span>
            {scheduledCount} invite{scheduledCount === 1 ? "" : "s"} scheduled · next at{" "}
            {new Date(nextScheduled).toLocaleString()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2"
            onClick={async () => {
              const ids = invites
                .filter((i) => (i as any).scheduled_send_at)
                .map((i) => i.id);
              await schedule.mutateAsync({ invite_ids: ids, scheduled_send_at: null });
              toast.success("Schedule cleared");
            }}
          >
            <X className="h-3 w-3 mr-1" /> Cancel all
          </Button>
        </div>
      )}

      {!invites.length ? (
        <div className="b2b-card p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No invites yet. Add candidates above.
        </div>
      ) : visible.length === 0 ? (
        <div className="b2b-card p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No invites match your filters.
        </div>
      ) : (
        <div className="b2b-card divide-y">
          <div className="px-3 py-2 flex items-center gap-3 bg-[hsl(var(--muted))/0.3]">
            <Checkbox
              checked={
                selected.size > 0 && selected.size === visible.length
                  ? true
                  : selected.size > 0
                  ? "indeterminate"
                  : false
              }
              onCheckedChange={toggleAll}
            />
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              {visible.length} shown · {invites.length} total
            </div>
          </div>
          {visible.map((i) => (
            <InviteRow
              key={i.id}
              invite={i}
              joinUrl={buildJoinUrl(i.token)}
              selected={selected.has(i.id)}
              sending={sendingIds.has(i.id)}
              cooldown={(cooldownIds.get(i.id) ?? 0) > Date.now()}
              onToggleSelect={() =>
                setSelected((s) => {
                  const n = new Set(s);
                  if (n.has(i.id)) n.delete(i.id);
                  else n.add(i.id);
                  return n;
                })
              }
              onResend={() => confirmThenSend([i.id], [i.email])}
              onCopy={() => {
                navigator.clipboard.writeText(buildJoinUrl(i.token));
                toast.success("Join link copied");
              }}
              onDelete={() => setPendingDelete([i.id])}
            />
          ))}
        </div>
      )}

      <BulkActionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        busy={send.isPending || bulkDel.isPending}
        onResend={() =>
          confirmThenSend(
            Array.from(selected),
            selectedInvites.map((i) => i.email),
          )
        }
        onSchedule={() => setBulkScheduleOpen(true)}
        onCopyLinks={() => copyAllLinks(selectedInvites)}
        onExport={() => exportCsv(selectedInvites)}
        onDelete={() => setPendingDelete(Array.from(selected))}
      />

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-2">
            <DialogTitle>Invitation email preview</DialogTitle>
            {previewSubject && (
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                <span className="font-medium text-[hsl(var(--foreground))]">Subject:</span> {previewSubject}
              </div>
            )}
          </DialogHeader>
          <div className="h-[70vh] bg-[#f4f5f7] border-t border-[hsl(var(--border))]">
            {previewLoading ? (
              <div className="h-full grid place-items-center text-sm text-[hsl(var(--muted-foreground))]">
                Rendering preview…
              </div>
            ) : (
              <iframe
                title="Email preview"
                srcDoc={previewHtml ?? ""}
                className="w-full h-full bg-white"
                sandbox=""
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Test send dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send a test email</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Sends a sample invitation (with a placeholder link) to the address you choose.
          </p>
          <Input
            type="email"
            placeholder="you@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !sendingTest) doTest();
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)} disabled={sendingTest}>
              Cancel
            </Button>
            <Button onClick={doTest} disabled={sendingTest || !testEmail.trim()}>
              {sendingTest ? "Sending…" : "Send test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk schedule dialog */}
      <Dialog open={bulkScheduleOpen} onOpenChange={setBulkScheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule {selected.size} invite{selected.size === 1 ? "" : "s"}</DialogTitle>
          </DialogHeader>
          <Input
            type="datetime-local"
            value={bulkScheduleAt}
            onChange={(e) => setBulkScheduleAt(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkScheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!bulkScheduleAt) return toast.error("Pick a date and time");
                const iso = new Date(bulkScheduleAt).toISOString();
                if (new Date(iso).getTime() < Date.now() - 60_000)
                  return toast.error("Pick a future time");
                await schedule.mutateAsync({
                  invite_ids: Array.from(selected),
                  scheduled_send_at: iso,
                });
                toast.success(`Scheduled for ${new Date(iso).toLocaleString()}`);
                setBulkScheduleOpen(false);
                setBulkScheduleAt("");
                setSelected(new Set());
              }}
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm large send */}
      <AlertDialog
        open={!!confirm?.open}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send {confirm?.count} emails?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
                  Recipients include:
                </div>
                <ul className="text-xs space-y-0.5">
                  {confirm?.emails.map((e) => (
                    <li key={e} className="font-mono">{e}</li>
                  ))}
                  {confirm && confirm.count > confirm.emails.length && (
                    <li className="text-[hsl(var(--muted-foreground))]">
                      …and {confirm.count - confirm.emails.length} more
                    </li>
                  )}
                </ul>
                <label className="mt-3 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) localStorage.setItem(SUPPRESS_CONFIRM_KEY, "1");
                      else localStorage.removeItem(SUPPRESS_CONFIRM_KEY);
                    }}
                  />
                  Don't ask again
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm?.onConfirm()}>
              Send {confirm?.count}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {pendingDelete?.length} invite{pendingDelete?.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Candidates already in progress will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingDelete?.length) return;
                if (pendingDelete.length === 1) {
                  del.mutate({ id: pendingDelete[0], assessment_id: assessmentId });
                } else {
                  await bulkDel.mutateAsync(pendingDelete);
                  toast.success(`Removed ${pendingDelete.length} invites`);
                }
                setSelected(new Set());
                setPendingDelete(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
