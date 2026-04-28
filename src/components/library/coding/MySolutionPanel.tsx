import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ToastAction } from "@/components/ui/toast";
import {
  CheckCircle2,
  Loader2,
  Eye,
  Pencil,
  Copy,
  Check,
  Code2,
  Trash2,
  Sparkles,
  Undo2,
  Cloud,
  CloudOff,
  CloudUpload,
  AlertCircle,
} from "lucide-react";
import { MonacoEditor } from "@/components/coding/MonacoEditor";
import { useToast } from "@/hooks/use-toast";
import { LANGUAGES, getLanguageById, type LangId } from "@/data/codingProblemsData";
import type { SolutionEntry } from "@/hooks/useProblemSolution";
import type { TimestampFormat } from "@/hooks/useEditorPrefs";
import { cn } from "@/lib/utils";

interface Props {
  notes: string;
  onNotesChange: (v: string) => void;
  code: string;
  onCodeChange: (v: string) => void;
  /** Currently active language for the code editor. */
  language: LangId;
  /** Switch which language is being edited (does not change main editor). */
  onLanguageChange: (lang: LangId) => void;
  /** Languages that already have a saved solution (for badges). */
  savedLanguages: LangId[];
  /** Per-language last-saved timestamps from the persisted entry. */
  codeUpdatedAt: Partial<Record<LangId, number>>;
  /** Pulls in user's current main-editor draft so they can save it as their solution. */
  onUseCurrentDraft?: () => string;
  /** Returns the previous snapshot so the panel can offer an undo. */
  onClear: () => SolutionEntry | null;
  /** Restores a previously-cleared snapshot. */
  onRestore: (snapshot: SolutionEntry) => void;
  /** Per-language one-step undo for code edits. */
  onUndoCodeChange: (lang: LangId) => boolean;
  canUndoCode: (lang: LangId) => boolean;
  /** True when the editor has unsaved changes for the current language. */
  hasUnsavedCurrentCode: boolean;
  savedAt: number | null;
  hasNotes: boolean;
  hasAnyCode: boolean;
  isComplete: boolean;
  /** "relative" → "5m ago", "exact" → "14:32:11". */
  timestampFormat: TimestampFormat;
  onToggleTimestampFormat: () => void;
  fontSize?: number;
  /** Cloud sync status from the solution hook. */
  syncStatus?: "idle" | "syncing" | "synced" | "error" | "offline";
  /** True when persisting to the cloud (signed-in user). */
  isCloudSynced?: boolean;
  /** When the cloud sync last completed successfully (ms epoch). */
  lastSyncedAt?: number | null;
  /** Invoked when the signed-out banner's CTA is clicked. */
  onSignInClick?: () => void;
}

const formatExact = (ts: number) => {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const formatRelativeShort = (ts: number) => {
  const diff = Date.now() - ts;
  if (diff < 5000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
};

const formatTimestamp = (ts: number | undefined, fmt: TimestampFormat) => {
  if (!ts) return "";
  return fmt === "exact" ? formatExact(ts) : formatRelativeShort(ts);
};

const formatSavedLabel = (savedAt: number | null, fmt: TimestampFormat) => {
  if (!savedAt) return "Not saved yet";
  if (fmt === "exact") return `Saved ${formatExact(savedAt)}`;
  const diff = Date.now() - savedAt;
  if (diff < 3000) return "Saved";
  if (diff < 60_000) return `Saved ${Math.floor(diff / 1000)}s ago`;
  return `Saved ${Math.floor(diff / 60_000)}m ago`;
};

/**
 * "My Solution" — combined markdown writeup + per-language final-solution code
 * editor. Shows progress + per-language timestamps, supports clear-with-undo,
 * and confirms language switches when there are unsaved edits.
 */
export const MySolutionPanel = ({
  notes,
  onNotesChange,
  code,
  onCodeChange,
  language,
  onLanguageChange,
  savedLanguages,
  codeUpdatedAt,
  onUseCurrentDraft,
  onClear,
  onRestore,
  onUndoCodeChange,
  canUndoCode,
  hasUnsavedCurrentCode,
  savedAt,
  hasNotes,
  hasAnyCode,
  isComplete,
  timestampFormat,
  onToggleTimestampFormat,
  fontSize = 13,
  syncStatus = "idle",
  isCloudSynced = false,
}: Props) => {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [copied, setCopied] = useState(false);
  const [pendingLang, setPendingLang] = useState<LangId | null>(null);
  const { toast } = useToast();
  const langInfo = getLanguageById(language);
  const languageLabel = langInfo.label;

  const hasCode = code.trim().length > 0;
  const hasCurrentLangSaved = savedLanguages.includes(language);
  const canUndoCurrent = canUndoCode(language);

  const handleCopy = async () => {
    if (!hasCode) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleUseDraft = () => {
    if (!onUseCurrentDraft) return;
    const draft = onUseCurrentDraft();
    if (!draft.trim()) {
      toast({ title: "Editor is empty", description: "Nothing to save." });
      return;
    }
    onCodeChange(draft);
    toast({
      title: "Saved as your solution",
      description: `Stored your current ${languageLabel} draft.`,
    });
  };

  const performClear = () => {
    const previous = onClear();
    if (!previous) {
      toast({
        title: "Nothing to clear",
      });
      return;
    }
    toast({
      title: "My Solution cleared",
      description: "Notes and saved code were removed for this problem.",
      duration: 8000,
      action: (
        <ToastAction
          altText="Undo clear"
          onClick={() => {
            onRestore(previous);
            toast({
              title: "My Solution restored",
              description: "Your notes and code were brought back.",
            });
          }}
        >
          <Undo2 className="h-3.5 w-3.5 mr-1" />
          Undo
        </ToastAction>
      ),
    });
  };

  // Language switch confirmation when current language has unsaved edits
  // that would be flushed (and could overwrite a previously-saved version).
  const requestLanguageChange = (next: LangId) => {
    if (next === language) return;
    if (hasUnsavedCurrentCode && hasCurrentLangSaved) {
      setPendingLang(next);
      return;
    }
    onLanguageChange(next);
  };

  const confirmLanguageChange = () => {
    if (pendingLang) {
      onLanguageChange(pendingLang);
      setPendingLang(null);
    }
  };

  /** Discard unsaved edits in the current language (revert to last-saved value)
   *  and switch. Implemented via a one-step undo so the autosave doesn't
   *  overwrite the saved version. */
  const discardAndSwitch = () => {
    if (!pendingLang) return;
    if (canUndoCode(language)) onUndoCodeChange(language);
    onLanguageChange(pendingLang);
    setPendingLang(null);
    toast({
      title: "Edits discarded",
      description: `Reverted ${languageLabel} to the last saved version.`,
    });
  };

  const handleUndoCurrentCode = () => {
    const ok = onUndoCodeChange(language);
    toast({
      title: ok ? "Undid last edit" : "Nothing to undo",
      description: ok
        ? `Reverted the ${languageLabel} editor to its previous value.`
        : `No previous edit recorded for ${languageLabel} this session.`,
    });
  };

  // Progress badge state
  const progressStep = (hasNotes ? 1 : 0) + (hasAnyCode ? 1 : 0);
  const progressLabel = isComplete
    ? "Complete"
    : progressStep === 1
      ? hasNotes
        ? "Notes saved"
        : "Code saved"
      : "Empty";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold">My Solution</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1.5 text-[10px] uppercase tracking-wider font-semibold transition-colors",
                      isComplete
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                        : progressStep === 1
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    {isComplete ? (
                      <Sparkles className="h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {progressStep}/2 · {progressLabel}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Counts a saved notes writeup and at least one saved code
                  solution. Persists with your problem meta.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Personal writeup + per-language solutions.{" "}
            {isCloudSynced
              ? "Synced to your account across devices."
              : "Autosaved locally — sign in to sync across devices."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 border",
                    isCloudSynced
                      ? syncStatus === "error"
                        ? "border-destructive/40 text-destructive bg-destructive/10"
                        : syncStatus === "syncing"
                          ? "border-amber-500/30 text-amber-500 bg-amber-500/10"
                          : "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                      : "border-muted text-muted-foreground bg-muted/40",
                  )}
                  aria-label="Cloud sync status"
                >
                  {!isCloudSynced ? (
                    <CloudOff className="h-3 w-3" />
                  ) : syncStatus === "syncing" ? (
                    <CloudUpload className="h-3 w-3 animate-pulse" />
                  ) : syncStatus === "error" ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <Cloud className="h-3 w-3" />
                  )}
                  <span>
                    {!isCloudSynced
                      ? "Local only"
                      : syncStatus === "syncing"
                        ? "Syncing…"
                        : syncStatus === "error"
                          ? "Sync error"
                          : "Cloud"}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {isCloudSynced
                  ? "Your solution is being saved to your account so you can access it from any device."
                  : "Sign in to sync your solution to your account and access it across devices."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleTimestampFormat}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded px-1 py-0.5"
                  aria-label="Toggle timestamp format"
                >
                  {savedAt ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Loader2 className="h-3 w-3 opacity-50" />
                  )}
                  <span>{formatSavedLabel(savedAt, timestampFormat)}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Showing {timestampFormat === "exact" ? "exact" : "relative"}{" "}
                time. Click to switch to{" "}
                {timestampFormat === "exact" ? "relative" : "exact"}.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                disabled={!hasNotes && !hasAnyCode}
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear My Solution?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes your autosaved notes and all saved code
                  solutions for this problem (across every language). You'll
                  have a few seconds to undo from a toast after.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={performClear}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, clear it
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Notes block */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Approach & Notes
          </span>
          <div className="flex items-center gap-1 rounded-md border bg-muted/40 p-0.5">
            <Button
              variant={mode === "edit" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setMode("edit")}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
            <Button
              variant={mode === "preview" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setMode("preview")}
              disabled={!hasNotes}
            >
              <Eye className="h-3 w-3" />
              Preview
            </Button>
          </div>
        </div>

        {mode === "edit" ? (
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={
              "# Approach\n\n1. Brute force: O(n²) — iterate every pair.\n2. Optimised: hashmap lookup → O(n).\n\n## Edge cases\n- Empty input\n- Duplicates"
            }
            className={cn(
              "font-mono text-xs min-h-[200px] resize-y leading-relaxed",
            )}
          />
        ) : (
          <Card className="p-4 prose prose-sm dark:prose-invert max-w-none min-h-[200px]">
            {hasNotes ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground text-sm m-0">
                Nothing to preview yet. Switch to Edit to add notes.
              </p>
            )}
          </Card>
        )}
      </div>

      {/* Code block */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Final Solution
            </span>
            <Select
              value={language}
              onValueChange={(v) => requestLanguageChange(v as LangId)}
            >
              <SelectTrigger className="h-7 w-[170px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => {
                  const saved = savedLanguages.includes(l.id);
                  return (
                    <SelectItem key={l.id} value={l.id} className="text-xs">
                      <span className="flex items-center gap-2">
                        {l.label}
                        {saved && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {hasCurrentLangSaved && (
              <Badge
                variant="outline"
                className="text-[10px] border-emerald-500/40 text-emerald-500 bg-emerald-500/10"
              >
                Saved
              </Badge>
            )}
            {hasUnsavedCurrentCode && (
              <Badge
                variant="outline"
                className="text-[10px] border-amber-500/40 text-amber-500 bg-amber-500/10"
              >
                Unsaved edits
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {onUseCurrentDraft && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 text-xs"
                      onClick={handleUseDraft}
                    >
                      <Code2 className="h-3 w-3" />
                      Use current draft
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Save your current editor code as the solution for{" "}
                    {languageLabel}.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1.5 text-xs"
                    onClick={handleUndoCurrentCode}
                    disabled={!canUndoCurrent}
                  >
                    <Undo2 className="h-3 w-3" />
                    Undo last edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {canUndoCurrent
                    ? `Revert ${languageLabel} code to its previous value. Notes and other languages stay unchanged.`
                    : `No prior ${languageLabel} edit recorded this session.`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-xs"
              onClick={handleCopy}
              disabled={!hasCode}
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Quick-jump chips for languages that already have a saved solution */}
        {savedLanguages.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Saved in:
            </span>
            {savedLanguages.map((id) => {
              const info = getLanguageById(id);
              const active = id === language;
              const ts = codeUpdatedAt[id];
              const rel = formatTimestamp(ts, timestampFormat);
              return (
                <TooltipProvider key={id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => requestLanguageChange(id)}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[11px] border transition-colors flex items-center gap-1.5",
                          active
                            ? "bg-primary/15 border-primary/40 text-primary"
                            : "bg-muted/40 border-border text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <span>{info.label}</span>
                        {rel && (
                          <span
                            className={cn(
                              "text-[10px] tabular-nums",
                              active
                                ? "text-primary/70"
                                : "text-muted-foreground/70",
                            )}
                          >
                            · {rel}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {ts
                        ? `Last saved ${new Date(ts).toLocaleString()}`
                        : "Saved"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        )}

        <div className="rounded-md border overflow-hidden bg-muted/20">
          <div className="h-[260px]">
            <MonacoEditor
              value={code}
              onChange={onCodeChange}
              language={langInfo.monaco}
              fontSize={fontSize}
              height="100%"
            />
          </div>
        </div>
        {!hasCode && (
          <p className="text-xs text-muted-foreground">
            Paste or type your accepted {languageLabel} solution here, or use{" "}
            <span className="font-medium">Use current draft</span>.
          </p>
        )}
      </div>

      {/* Confirm language switch when unsaved edits would overwrite saved code */}
      <AlertDialog
        open={!!pendingLang}
        onOpenChange={(open) => !open && setPendingLang(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch language with unsaved edits?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current edits to{" "}
              <span className="font-medium">{languageLabel}</span> haven't been
              flushed yet. Choose how to handle them before switching to{" "}
              <span className="font-medium">
                {pendingLang ? getLanguageById(pendingLang).label : ""}
              </span>
              .
              <span className="block mt-2 text-xs">
                <strong>Save &amp; switch</strong> — flush edits (overwrites the
                previously-saved {languageLabel} code).
                <br />
                <strong>Discard &amp; switch</strong> — revert {languageLabel} to
                its last saved value, then switch.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Stay on {languageLabel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={discardAndSwitch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard &amp; switch
            </AlertDialogAction>
            <AlertDialogAction onClick={confirmLanguageChange}>
              Save &amp; switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
