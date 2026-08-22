import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Upload, ChevronDown, FileSpreadsheet, X, CheckCircle2, AlertTriangle, MinusCircle } from "lucide-react";
import { toast } from "sonner";
import { parseFile, parseText, markExistingDuplicates } from "./parseRows";
import type { ParsedRow } from "./types";

const PREFS_KEY = "b2b.invites.lastSendMode";
type SendMode = "now" | "draft" | "schedule";

export function AddCandidatesCard({
  existingEmails,
  onSubmit,
  busy,
  participationMode,
}: {
  existingEmails: Set<string>;
  onSubmit: (rows: ParsedRow[], mode: SendMode, scheduleAt?: string) => Promise<void> | void;
  busy?: boolean;
  participationMode?: "invite" | "roster" | "open_org" | null;
}) {
  const initialTab: "paste" | "upload" | "single" =
    participationMode === "roster" ? "upload" : "paste";
  const [tab, setTab] = useState<"paste" | "upload" | "single">(initialTab);
  const [bulk, setBulk] = useState("");
  const [single, setSingle] = useState({ email: "", name: "", external_id: "" });
  const [fileRows, setFileRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [pendingRows, setPendingRows] = useState<ParsedRow[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const defaultMode: SendMode =
    (typeof window !== "undefined" &&
      (localStorage.getItem(PREFS_KEY) as SendMode)) ||
    "now";

  // Live counts under paste textarea
  const pastePreview = useMemo(() => {
    if (!bulk.trim()) return null;
    const rows = markExistingDuplicates(parseText(bulk), existingEmails);
    return countRows(rows);
  }, [bulk, existingEmails]);

  function handleFile(file: File) {
    setFileName(file.name);
    parseFile(file)
      .then((rows) => setFileRows(markExistingDuplicates(rows, existingEmails)))
      .catch((e) => {
        toast.error(`Could not read file: ${(e as Error).message}`);
        setFileRows(null);
      });
  }

  function gatherRows(): ParsedRow[] {
    if (tab === "paste") return markExistingDuplicates(parseText(bulk), existingEmails);
    if (tab === "upload") return fileRows ?? [];
    // single
    const parts = [single.email, single.name, single.external_id]
      .map((p) => p.trim())
      .filter(Boolean);
    return markExistingDuplicates(parseText(parts.join(", ")), existingEmails);
  }

  function startReview() {
    const rows = gatherRows();
    if (!rows.length) {
      toast.error("Nothing to add yet");
      return;
    }
    if (!rows.some((r) => r._status === "valid")) {
      toast.error("No valid emails found");
      return;
    }
    setPendingRows(rows);
    setReviewOpen(true);
  }

  async function confirm(mode: SendMode) {
    const validRows = pendingRows.filter((r) => r._status === "valid");
    if (!validRows.length) return;
    if (mode === "schedule") {
      setReviewOpen(false);
      setScheduleOpen(true);
      return;
    }
    try {
      localStorage.setItem(PREFS_KEY, mode);
    } catch {
      /* ignore */
    }
    await onSubmit(validRows, mode);
    setReviewOpen(false);
    resetInputs();
  }

  async function confirmSchedule() {
    if (!scheduleAt) {
      toast.error("Pick a date and time");
      return;
    }
    const iso = new Date(scheduleAt).toISOString();
    if (new Date(iso).getTime() < Date.now() - 60_000) {
      toast.error("Pick a future time");
      return;
    }
    try {
      localStorage.setItem(PREFS_KEY, "schedule");
    } catch {
      /* ignore */
    }
    const validRows = pendingRows.filter((r) => r._status === "valid");
    await onSubmit(validRows, "schedule", iso);
    setScheduleOpen(false);
    setReviewOpen(false);
    setScheduleAt("");
    resetInputs();
  }

  function resetInputs() {
    setBulk("");
    setFileRows(null);
    setFileName(null);
    setSingle({ email: "", name: "", external_id: "" });
  }

  return (
    <div className="b2b-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium">
            {participationMode === "roster" ? "Upload class roster" : participationMode === "open_org" ? "Pre-seed candidates (optional)" : "Add candidates"}
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {participationMode === "roster"
              ? "Upload your class CSV — only listed students will be able to join this test."
              : participationMode === "open_org"
                ? "Open-org tests let any verified org member self-enroll. You can still pre-invite specific people here."
                : "Paste, upload a CSV/Excel file, or add one candidate at a time."}
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="paste">Paste</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="single">Single</TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="space-y-2">
          <Textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={"alex@example.com, Alex Morgan, R001\nsam@example.com"}
            className="min-h-[140px] font-mono text-xs"
          />
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            One per line: <code>email</code>, or <code>email, name</code>, or{" "}
            <code>email, name, roll_id</code>.{" "}
            {pastePreview ? <PreviewCounts c={pastePreview} /> : null}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-2">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className="border border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-[hsl(var(--muted))/0.4]"
            role="button"
            tabIndex={0}
            onClick={() => fileInput.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInput.current?.click();
              }
            }}
          >
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.tsv,.xlsx,.xls,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <FileSpreadsheet className="h-6 w-6 mx-auto mb-2 opacity-70" />
            <div className="text-sm font-medium">
              {fileName ? fileName : "Drop a CSV / Excel file, or click to choose"}
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              First column with @ is treated as email. Optional columns: name, roll id.
            </div>
          </div>
          {fileRows && (
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              <PreviewCounts c={countRows(fileRows)} />
              {fileName && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 ml-2 px-2"
                  onClick={() => {
                    setFileRows(null);
                    setFileName(null);
                  }}
                >
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="single" className="space-y-2">
          <div className="grid sm:grid-cols-3 gap-2">
            <Input
              placeholder="email@company.com"
              type="email"
              value={single.email}
              onChange={(e) => setSingle((s) => ({ ...s, email: e.target.value }))}
            />
            <Input
              placeholder="Full name (optional)"
              value={single.name}
              onChange={(e) => setSingle((s) => ({ ...s, name: e.target.value }))}
            />
            <Input
              placeholder="Roll / external id (optional)"
              value={single.external_id}
              onChange={(e) => setSingle((s) => ({ ...s, external_id: e.target.value }))}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" disabled={busy} onClick={startReview}>
          Review
        </Button>
        <SplitSendButton
          defaultMode={defaultMode}
          disabled={busy}
          onPick={(m) => {
            const rows = gatherRows();
            if (!rows.length || !rows.some((r) => r._status === "valid")) {
              toast.error("Add at least one valid email first");
              return;
            }
            setPendingRows(rows);
            if (m === "schedule") setScheduleOpen(true);
            else void confirm(m);
          }}
        />
      </div>

      {/* Review preview dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review candidates</DialogTitle>
          </DialogHeader>
          <ReviewSummary rows={pendingRows} />
          <div className="max-h-[55vh] overflow-auto border rounded-md text-xs">
            <table className="w-full">
              <thead className="sticky top-0 bg-[hsl(var(--muted))/0.4]">
                <tr className="text-left">
                  <th className="px-2 py-1.5">Status</th>
                  <th className="px-2 py-1.5">Email</th>
                  <th className="px-2 py-1.5">Name</th>
                  <th className="px-2 py-1.5">Roll id</th>
                </tr>
              </thead>
              <tbody>
                {pendingRows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1.5"><RowStatus r={r} /></td>
                    <td className="px-2 py-1.5 font-mono">{r.email}</td>
                    <td className="px-2 py-1.5">{r.name ?? "—"}</td>
                    <td className="px-2 py-1.5">{r.external_id ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => void confirm("draft")} disabled={busy}>
              Add as drafts
            </Button>
            <Button variant="outline" onClick={() => void confirm("schedule")} disabled={busy}>
              Schedule…
            </Button>
            <Button onClick={() => void confirm("now")} disabled={busy}>
              <Plus className="h-4 w-4 mr-1" /> Add &amp; send now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule send</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Invites will be added now and emails will go out at the time you pick.
          </p>
          <Input
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void confirmSchedule()} disabled={busy}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SplitSendButton({
  defaultMode,
  onPick,
  disabled,
}: {
  defaultMode: SendMode;
  onPick: (m: SendMode) => void;
  disabled?: boolean;
}) {
  const label =
    defaultMode === "draft"
      ? "Add as drafts"
      : defaultMode === "schedule"
      ? "Add & schedule"
      : "Add & send now";
  return (
    <div className="inline-flex">
      <Button
        className="rounded-r-none"
        disabled={disabled}
        onClick={() => onPick(defaultMode)}
      >
        <Plus className="h-4 w-4 mr-1" /> {label}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="rounded-l-none px-2 border-l border-[hsl(var(--primary-foreground))/0.2]" disabled={disabled}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onPick("now")}>Send immediately</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPick("draft")}>Add as drafts</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPick("schedule")}>Schedule for later…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function countRows(rows: ParsedRow[]) {
  return {
    total: rows.length,
    valid: rows.filter((r) => r._status === "valid").length,
    invalid: rows.filter((r) => r._status === "invalid").length,
    dup: rows.filter((r) => r._status === "duplicate").length,
  };
}
function PreviewCounts({ c }: { c: ReturnType<typeof countRows> }) {
  return (
    <span>
      {c.total} row{c.total === 1 ? "" : "s"} · <span className="text-emerald-600">{c.valid} valid</span>
      {c.invalid > 0 ? <> · <span className="text-amber-600">{c.invalid} issues</span></> : null}
      {c.dup > 0 ? <> · <span className="text-[hsl(var(--muted-foreground))]">{c.dup} duplicate</span></> : null}
    </span>
  );
}
function ReviewSummary({ rows }: { rows: ParsedRow[] }) {
  const c = countRows(rows);
  return (
    <div className="text-xs"><PreviewCounts c={c} /></div>
  );
}
function RowStatus({ r }: { r: ParsedRow }) {
  if (r._status === "valid")
    return <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> ready</span>;
  if (r._status === "duplicate")
    return <span className="inline-flex items-center gap-1 text-[hsl(var(--muted-foreground))]" title={r._reason}><MinusCircle className="h-3 w-3" /> skip</span>;
  return <span className="inline-flex items-center gap-1 text-amber-600" title={r._reason}><AlertTriangle className="h-3 w-3" /> {r._reason ?? "invalid"}</span>;
}

export type { SendMode };
