import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Play,
  Send,
  RotateCcw,
  Loader2,
  Minus,
  Plus,
  Type,
  ChevronRight,
  Keyboard,
  Wand2,
  History,
  Maximize2,
  Minimize2,
} from "lucide-react";
import SecureProblemHUD from "@/components/contests/SecureProblemHUD";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProblemBySlug,
  LANGUAGES,
  getLanguageById,
  type LangId,
} from "@/data/codingProblemsData";
import { useDbCodingProblem } from "@/hooks/useDbCodingProblem";
import { MonacoEditor, type MonacoEditorHandle } from "@/components/coding/MonacoEditor";
import { VerdictBadge } from "@/components/coding/VerdictBadge";
import { CodeExecutionError, useCodeRunner, type RunResult, type SubmitResult, type CaseResult } from "@/hooks/useCodeRunner";
import { getExecLimitsForLang, formatLimits } from "@/lib/coding/executionLimits";

import { Cpu, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCodeDraft } from "@/hooks/useCodeDraft";
import { useCodingSubmissions } from "@/hooks/useCodingSubmissions";
import { useCodeRuns } from "@/hooks/useCodeRuns";
import { useCodingProblemBookmarks } from "@/hooks/useCodingProblemBookmarks";
import { LoginPromptDialog } from "@/components/LoginPromptDialog";
import { ProblemDetailHeader } from "@/components/library/coding/ProblemDetailHeader";
import { AttemptTimeline } from "@/components/library/coding/AttemptTimeline";
import { SubmissionDetailsDrawer } from "@/components/library/coding/SubmissionDetailsDrawer";
import { ProblemMetaStrip } from "@/components/library/coding/ProblemMetaStrip";
import { NotesPanel } from "@/components/library/coding/NotesPanel";
import { ProgressiveHints } from "@/components/library/coding/ProgressiveHints";
import { MySolutionPanel } from "@/components/library/coding/MySolutionPanel";
import { FloatingActionBar } from "@/components/library/coding/FloatingActionBar";
import { SessionTimer, formatSolveTime, type SessionTimerHandle } from "@/components/library/coding/SessionTimer";
import { TestCaseWorkbench } from "@/components/library/coding/TestCaseWorkbench";
import { SchemaSeedToggle } from "@/components/library/coding/SchemaSeedToggle";
import { SqlResultDiff, SqlResultTable } from "@/components/library/coding/SqlResultDiff";
import { ProblemRunHistory } from "@/components/library/coding/ProblemRunHistory";
import { ShortcutsCheatSheet } from "@/components/library/coding/ShortcutsCheatSheet";
import { useProblemNotes } from "@/hooks/useProblemNotes";
import { useProblemSolution } from "@/hooks/useProblemSolution";
import { useContestLocks } from "@/hooks/useContestLocks";
import { LockedAuxPanel } from "@/components/contests/LockedAuxPanel";
import { logContestLockEvent } from "@/lib/contestTelemetry";
import { useActiveContestSession } from "@/hooks/useActiveContestSession";
import { useTypingTelemetry } from "@/hooks/useTypingTelemetry";
import { useEditorPrefs } from "@/hooks/useEditorPrefs";
import type { CodeSubmissionRow } from "@/hooks/useCodingSubmissions";
import { cn } from "@/lib/utils";
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
import { CodeDiffPreview } from "@/components/library/coding/CodeDiffPreview";
import { DraftSaveIndicator } from "@/components/library/coding/DraftSaveIndicator";
import { EditorSettingsPopover } from "@/components/library/coding/EditorSettingsPopover";
import { useFormatOnSubmitOverride } from "@/hooks/useFormatOnSubmitOverride";
import { ChevronScroller } from "@/components/library/coding/ChevronScroller";
import {
  useEditorTabsLayout,
  type EditorTabId,
} from "@/hooks/useEditorTabsLayout";
import { SortableEditorTabs } from "@/components/library/coding/SortableEditorTabs";
import { LayoutGrid } from "lucide-react";
import { useEditorLayoutPreset } from "@/hooks/useEditorLayoutPreset";
import { LayoutPresetPopover } from "@/components/library/coding/LayoutPresetPopover";
import type { ImperativePanelGroupHandle } from "react-resizable-panels";

const difficultyClass = (d: string) =>
  d === "Easy"
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : d === "Medium"
      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
      : "text-rose-500 bg-rose-500/10 border-rose-500/20";

const LAST_OPENED_KEY = "parikshaa:coding-last-opened-submission";
const LAST_FAILED_KEY = "parikshaa:coding-last-failed-submission";

const readMap = (key: string): Record<string, string> => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
};

const writeMapEntry = (key: string, slug: string, id: string | null) => {
  try {
    const map = readMap(key);
    if (id) map[slug] = id;
    else delete map[slug];
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

const readLastOpenedMap = () => readMap(LAST_OPENED_KEY);
const writeLastOpened = (slug: string, id: string | null) =>
  writeMapEntry(LAST_OPENED_KEY, slug, id);

const readLastFailedMap = () => readMap(LAST_FAILED_KEY);
const writeLastFailed = (slug: string, id: string | null) =>
  writeMapEntry(LAST_FAILED_KEY, slug, id);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};


const CodingProblemDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const staticProblem = useMemo(() => (slug ? getProblemBySlug(slug) : undefined), [slug]);
  const { data: dbProblem } = useDbCodingProblem(staticProblem ? undefined : slug);
  const problem = staticProblem ?? dbProblem ?? undefined;
  const [searchParams, setSearchParams] = useSearchParams();

  const isSQLProblem = !!problem?.sql;
  const defaultLang: LangId = isSQLProblem ? "sql" : "python";
  const [language, setLanguage] = useState<LangId>(defaultLang);
  const [mySolutionLanguage, setMySolutionLanguage] = useState<LangId>(defaultLang);
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [activeBottomTab, setActiveBottomTab] = useState<"testcase" | "output">("testcase");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [executionErrorDetails, setExecutionErrorDetails] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Inline contest-submission error banner (shown above the editor when a
  // contest-context submission is rejected by the server).
  const [contestError, setContestError] = useState<string | null>(null);
  // Hard-block flag: when a contest pre-check (on mount) determines the user
  // cannot submit (e.g. contest closed, not registered), disable Submit so
  // the action is blocked before click — not just on the click handler.
  const [contestSubmitBlocked, setContestSubmitBlocked] = useState(false);
  const [contestId, setContestId] = useState<string | null>(null);
  // Reflects the SecureProblemHUD's heartbeat health. While the heartbeat is
  // offline/reconnecting we disable the Submit button — server-side
  // validate_contest_submission also rejects in that state, so this is purely
  // a UX guardrail to prevent confusing failures mid-network-blip.
  const [secureSubmissionReady, setSecureSubmissionReady] = useState(true);
  const sessionTimerRef = useRef<SessionTimerHandle>(null);
  const editorRef = useRef<MonacoEditorHandle>(null);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  
  const [detailSubmission, setDetailSubmission] = useState<CodeSubmissionRow | null>(null);
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(() =>
    slug ? readLastOpenedMap()[slug] ?? null : null,
  );
  const [lastFailedId, setLastFailedId] = useState<string | null>(() =>
    slug ? readLastFailedMap()[slug] ?? null : null,
  );
  // Bumped whenever we want the AttemptTimeline to auto-scroll the highlighted
  // entry into view (e.g. after "Go to failed cases" toast action, or when a
  // previously-highlighted failed attempt is restored on remount).
  const [timelineScrollKey, setTimelineScrollKey] = useState(0);
  // Tracks whether we've already auto-restored the persisted "last failed"
  // highlight for this mount, so we don't keep re-triggering it.
  const restoredFailedRef = useRef(false);

  const { run, submit, isRunning, isSubmitting } = useCodeRunner();
  const {
    draft,
    draftLoaded,
    saveDraft,
    flushDraft,
    saveStatus,
    lastSavedAt,
  } = useCodeDraft(slug ?? "", language);
  // Pending candidate code for the "Last submitted" confirm dialog. When set,
  // the dialog is open and applying it replaces the editor contents.
  const [pendingRestoreCode, setPendingRestoreCode] = useState<{
    code: string;
    label: string;
    /** Snapshot of editor contents BEFORE the dialog opened, so a one-click
     *  "Cancel restoration" can revert exactly to what the user had. */
    snapshot: string;
  } | null>(null);
  /** Snapshot of editor contents BEFORE the dialog opened, so a one-click
   *  "Cancel restoration" can revert exactly to what the user had. */
  const [restoreUndoSnapshot, setRestoreUndoSnapshot] = useState<string | null>(null);
  // Transient hint shown briefly when entering fullscreen.
  const [showFullscreenHint, setShowFullscreenHint] = useState(false);
  const { submissions, loading: submissionsLoading, refetch: refetchSubmissions } = useCodingSubmissions(slug);
  // Lock state for contest aux materials (notes / my-solution / reference / runs)
  // — driven by useContestLocks. While the contest is live and the user is a
  // registered participant, these panels are replaced with a LockedAuxPanel
  // surface that countdowns to the contest end. Hooks below also receive the
  // `locked` flag so they refuse to fetch sensitive data over the network.
  const contestLocks = useContestLocks(contestId ?? undefined);
  // Active contest session id (for typing telemetry). Only resolved when we
  // are on a `?contest=<slug>` URL inside an active secure session.
  const contestSession = useActiveContestSession(contestId ?? undefined);
  const typing = useTypingTelemetry({
    contestId: contestId ?? undefined,
    sessionId: contestSession.sessionId ?? null,
    problemSlug: slug,
    enabled: !!contestId && contestSession.hasActive,
  });
  const lastCodeLenRef = useRef<number>(0);
  const { runs, refetch: refetchRuns } = useCodeRuns(slug, {
    locked: contestLocks.historyLocked,
    contestId,
  });
  const { isBookmarked, toggle: toggleBookmark } = useCodingProblemBookmarks();
  const { note: notesValue, setNote: setNotesValue, savedAt: notesSavedAt } = useProblemNotes(slug);
  const {
    notes: mySolutionNotes,
    code: mySolutionCode,
    savedAt: mySolutionSavedAt,
    savedLanguages: mySolutionSavedLanguages,
    codeUpdatedAt: mySolutionCodeUpdatedAt,
    setNotes: setMySolutionNotes,
    setCode: setMySolutionCode,
    clear: clearMySolution,
    restore: restoreMySolution,
    hasUnsavedCurrentCode: mySolutionHasUnsavedCurrentCode,
    undoCodeChange: undoMySolutionCode,
    canUndoCode: canUndoMySolutionCode,
    hasContent: hasMySolution,
    hasNotes: mySolutionHasNotes,
    hasAnyCode: mySolutionHasAnyCode,
    isComplete: mySolutionIsComplete,
    syncStatus: mySolutionSyncStatus,
    isCloudSynced: mySolutionIsCloudSynced,
    lastSyncedAt: mySolutionLastSyncedAt,
    lastConflictResolvedAt: mySolutionLastConflictAt,
  } = useProblemSolution(slug, mySolutionLanguage, {
    locked: contestLocks.solutionLocked,
    contestId,
  });
  const {
    prefs: editorPrefs,
    incFontSize,
    decFontSize,
    toggleTimestampFormat,
    setFormatOnSubmit,
    MIN: FS_MIN,
    MAX: FS_MAX,
  } = useEditorPrefs();
  const {
    effective: effectiveFormatOnSubmit,
    override: formatOnSubmitOverride,
    setOverride: setFormatOnSubmitOverride,
  } = useFormatOnSubmitOverride(slug, language, editorPrefs.formatOnSubmit);
  const {
    order: tabOrder,
    active: activeTab,
    setOrder: setTabOrder,
    setActive: setActiveTabRaw,
    reset: resetTabsLayout,
    isCustomized: isLayoutCustomized,
  } = useEditorTabsLayout(slug, language);

  // Map of which tabs are locked by the active contest. Used to (a) reject
  // setActiveTab calls that would land on a locked tab, (b) auto-redirect to
  // Description if the persisted active tab is locked when the contest starts,
  // and (c) decorate trigger labels with a 🔒.
  const isTabLocked = (id: EditorTabId) =>
    (id === "notes" && contestLocks.notesLocked) ||
    (id === "my-solution" && contestLocks.solutionLocked) ||
    (id === "solution" && contestLocks.solutionLocked) ||
    (id === "runs" && contestLocks.historyLocked);

  const setActiveTab = (id: EditorTabId) => {
    if (isTabLocked(id)) {
      logContestLockEvent({
        contestId,
        problemSlug: slug,
        kind: "blocked_tab_activation",
        target: id as never,
      });
      toast({
        title: "Locked during contest",
        description: "This panel unlocks when the contest ends.",
      });
      return;
    }
    setActiveTabRaw(id);
  };

  // If the user previously had a now-locked tab as their active tab (e.g.
  // they had "notes" open before the contest started, or hot-reloaded into a
  // contest), force them back to Description.
  useEffect(() => {
    if (isTabLocked(activeTab)) {
      setActiveTabRaw("description");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    contestLocks.notesLocked,
    contestLocks.solutionLocked,
    contestLocks.historyLocked,
  ]);
  const {
    presetId: layoutPresetId,
    preset: layoutPreset,
    setPreset: setLayoutPreset,
    reset: resetLayoutPreset,
    isCustomized: isPresetCustomized,
  } = useEditorLayoutPreset(slug, language);
  const horizontalGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const verticalGroupRef = useRef<ImperativePanelGroupHandle>(null);

  // Apply the chosen preset's split sizes whenever the preset changes.
  useEffect(() => {
    horizontalGroupRef.current?.setLayout(layoutPreset.horizontal);
    verticalGroupRef.current?.setLayout(layoutPreset.vertical);
  }, [layoutPreset]);

  // Open drawer when ?sub=<id> is in URL and submissions have loaded.
  // If the submission ID doesn't exist for this problem, clear the param so
  // the drawer doesn't open to nothing.
  useEffect(() => {
    const subId = searchParams.get("sub");
    if (!subId) return;
    if (submissions.length === 0) return; // wait for load
    const found = submissions.find((s) => s.id === subId);
    if (found) {
      if (!detailSubmission || detailSubmission.id !== subId) {
        setDetailSubmission(found);
        setLastOpenedId(subId);
        if (slug) writeLastOpened(slug, subId);
      }
    } else {
      // Stale deep-link — strip it and offer the most relevant fallback.
      const next = new URLSearchParams(searchParams);
      next.delete("sub");
      setSearchParams(next, { replace: true });

      // Prefer the most recent failing submission (most useful for debugging),
      // then fall back to the latest attempt of any verdict.
      const latestFailed = submissions.find(
        (s) => s.verdict && s.verdict !== "Accepted",
      );
      const latest = submissions[0]; // newest-first
      const target = latestFailed ?? latest;

      toast({
        title: "Submission link expired",
        description: latestFailed
          ? "That submission isn't available — jump straight to your most recent failed attempt to see what went wrong."
          : latest
            ? "That submission isn't available — open your most recent attempt instead."
            : "That submission isn't available for this problem anymore.",
        action: target ? (
          <ToastAction
            altText={latestFailed ? "Go to failed cases" : "Go to last attempt"}
            onClick={() =>
              latestFailed ? jumpToFailed(latestFailed) : openSubmission(target)
            }
          >
            {latestFailed ? "Go to failed cases" : "Go to last attempt"}
          </ToastAction>
        ) : undefined,
      });
    }
  }, [searchParams, submissions, slug, detailSubmission, setSearchParams, toast]);

  const openSubmission = (s: CodeSubmissionRow) => {
    setDetailSubmission(s);
    setLastOpenedId(s.id);
    if (slug) writeLastOpened(slug, s.id);
    // Trigger an auto-scroll inside the AttemptTimeline so the highlighted
    // entry becomes visible immediately (especially for "Go to failed cases").
    setTimelineScrollKey((k) => k + 1);
    const next = new URLSearchParams(searchParams);
    next.set("sub", s.id);
    setSearchParams(next, { replace: true });
  };

  /**
   * Jump to a failed submission: opens its drawer, persists it as the last
   * highlighted failed attempt for this slug, and shows a confirmation toast
   * that names the specific test case (when available).
   */
  const jumpToFailed = (s: CodeSubmissionRow) => {
    openSubmission(s);
    setLastFailedId(s.id);
    if (slug) writeLastFailed(slug, s.id);

    // Build a friendly description that names the failing case if we have it.
    const failingCase = (s.failing_case ?? null) as
      | { index?: number | null; name?: string | null }
      | null;
    const caseLabel = failingCase
      ? failingCase.name
        ? `case "${failingCase.name}"`
        : typeof failingCase.index === "number"
          ? `test case #${failingCase.index + 1}`
          : "the failing case"
      : `${s.passed_tests}/${s.total_tests} tests passed`;

    toast({
      title: "Jumped to failed attempt",
      description: `Highlighted ${caseLabel} on the timeline.`,
    });
  };

  const closeSubmission = () => {
    setDetailSubmission(null);
    if (searchParams.get("sub")) {
      const next = new URLSearchParams(searchParams);
      next.delete("sub");
      setSearchParams(next, { replace: true });
    }
  };

  // Restore previously-highlighted failed attempt when submissions arrive,
  // but only if the user hasn't deep-linked a specific submission. Auto-scrolls
  // the timeline to the same entry once.
  useEffect(() => {
    if (restoredFailedRef.current) return;
    if (!slug || !lastFailedId) return;
    if (submissions.length === 0) return;
    if (searchParams.get("sub")) return;
    const exists = submissions.some((s) => s.id === lastFailedId);
    if (!exists) {
      // Stale persisted id — clear it.
      writeLastFailed(slug, null);
      setLastFailedId(null);
      restoredFailedRef.current = true;
      return;
    }
    setLastOpenedId(lastFailedId);
    setTimelineScrollKey((k) => k + 1);
    restoredFailedRef.current = true;
  }, [submissions, slug, lastFailedId, searchParams]);

  // Contest pre-validation: when the page is opened in the context of a
  // contest (?contest=<slug>), call validate_contest_submission on mount so
  // the Submit button is disabled (with the server's reason) for closed /
  // unregistered / disqualified states — before the user even clicks.
  useEffect(() => {
    const contestSlug = searchParams.get("contest");
    if (!contestSlug || !problem?.slug) {
      setContestSubmitBlocked(false);
      setContestError(null);
      setContestId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: contestRow } = await supabase
          .from("contests")
          .select("id")
          .eq("slug", contestSlug)
          .maybeSingle();
        if (cancelled || !contestRow?.id) return;
        setContestId(contestRow.id);
        const { data: check } = await supabase.rpc("validate_contest_submission", {
          _contest_id: contestRow.id,
          _problem_slug: problem.slug,
        });
        if (cancelled) return;
        const v = check as { ok: boolean; message?: string; code?: string } | null;
        // Only hard-block for terminal/contest-state failures. Auth-required
        // is handled by the existing login flow and shouldn't permanently
        // disable Submit.
        const blockingCodes = new Set([
          "closed",
          "not_active",
          "not_started",
          "not_registered",
          "withdrawn",
          "disqualified",
          "already_solved",
          "invalid_problem",
          "not_found",
          "no_active_session",
        ]);
        if (v && !v.ok && v.code && blockingCodes.has(v.code)) {
          setContestSubmitBlocked(true);
          setContestError(v.message ?? "Cannot submit to this contest right now.");
        } else {
          setContestSubmitBlocked(false);
        }
      } catch {
        // Network/RPC errors should not permanently block — let the click
        // handler surface the failure with full context.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, problem?.slug]);

  // Derived per-problem stats
  const problemStats = useMemo(() => {
    const attempts = submissions.length;
    const accepted = submissions.filter((s) => s.verdict === "Accepted");
    const isSolved = accepted.length > 0;
    const isAttempted = attempts > 0;
    // earliest accepted = solvedAt
    let solvedAt: string | null = null;
    for (const a of accepted) {
      if (!solvedAt || a.created_at < solvedAt) solvedAt = a.created_at;
    }
    return { attempts, isSolved, isAttempted, solvedAt };
  }, [submissions]);

  // Resolve starter code with SQL-aware fallback
  const getStarter = (lang: LangId): string => {
    if (!problem) return "";
    if (lang === "sql") return problem.sql?.starter ?? "-- Write your SQL query here\n";
    return problem.starterCode[lang] ?? "";
  };

  // Initialize code from draft or starter
  useEffect(() => {
    if (!problem || !draftLoaded) return;
    setCode(draft && draft.length > 0 ? draft : getStarter(language));
  }, [problem, language, draft, draftLoaded]);

  // Initialize stdin to first sample test
  useEffect(() => {
    if (problem && problem.sampleTests[0]) {
      setStdin(problem.sampleTests[0].input);
    }
  }, [problem]);

  // Notify when the My Solution sync resolved a real local↔cloud conflict.
  useEffect(() => {
    if (!mySolutionLastConflictAt) return;
    toast({
      title: "My Solution merged across devices",
      description:
        "We kept the most recently edited version of each part (notes and per language). Nothing was lost.",
    });
  }, [mySolutionLastConflictAt, toast]);

  // Editor keyboard shortcuts. We use a ref-bag so we can read the latest
  // handler closures without re-binding the listener on every render.
  const shortcutBagRef = useRef<{
    run: () => void;
    submit: () => void;
    reset: () => void;
    busy: boolean;
  }>({ run: () => {}, submit: () => {}, reset: () => {}, busy: false });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const target = e.target as HTMLElement | null;
      // Skip when typing in plain inputs/textareas outside Monaco — Monaco
      // surfaces its own command palette and doesn't bubble these by default.
      const tag = target?.tagName?.toLowerCase();
      const isPlainEditable =
        tag === "input" ||
        (tag === "textarea" && !target?.closest(".monaco-editor"));
      if (isPlainEditable) return;

      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        if (!shortcutBagRef.current.busy) shortcutBagRef.current.submit();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (!shortcutBagRef.current.busy) shortcutBagRef.current.run();
      } else if (e.key.toLowerCase() === "r" && e.shiftKey) {
        // Ctrl/Cmd+Shift+R → reset starter (avoid clobbering browser hard reload
        // which is Ctrl+Shift+R on most platforms — but here we're inside the
        // app and users expect a guard; we still preventDefault for parity).
        e.preventDefault();
        if (!shortcutBagRef.current.busy) shortcutBagRef.current.reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Esc exits editor fullscreen.
  useEffect(() => {
    if (!isEditorFullscreen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsEditorFullscreen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isEditorFullscreen]);

  // Briefly show "Press Esc to exit fullscreen" hint when entering fullscreen.
  useEffect(() => {
    if (!isEditorFullscreen) {
      setShowFullscreenHint(false);
      return;
    }
    setShowFullscreenHint(true);
    const t = window.setTimeout(() => setShowFullscreenHint(false), 3500);
    return () => window.clearTimeout(t);
  }, [isEditorFullscreen]);

  if (!problem) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Problem not found.</p>
        <Button asChild variant="outline">
          <Link to="/library/problems">Back to problems</Link>
        </Button>
      </div>
    );
  }

  const langInfo = getLanguageById(language);

  const handleCodeChange = (v: string) => {
    // Telemetry: record net characters added (deletes are ignored). Only
    // active in contest mode; the hook is otherwise a no-op.
    const prevLen = lastCodeLenRef.current;
    const delta = v.length - prevLen;
    lastCodeLenRef.current = v.length;
    if (delta > 0) typing.record(delta);
    setCode(v);
    saveDraft(v);
    sessionTimerRef.current?.poke();
  };

  const handleReset = () => {
    const starter = getStarter(language);
    setCode(starter);
    saveDraft(starter);
    toast({ title: "Code reset", description: "Editor restored to starter template." });
  };

  const handleFormat = async () => {
    try {
      await editorRef.current?.format();
    } catch {
      /* ignore */
    }
  };

  /** Apply restored code and offer a one-click "Cancel restoration" undo. */
  const applyRestore = (nextCode: string, label: string, snapshot: string) => {
    setCode(nextCode);
    saveDraft(nextCode);
    setRestoreUndoSnapshot(snapshot);
    toast({
      title: "Restored last submitted code",
      description: label,
      action: (
        <ToastAction
          altText="Cancel restoration"
          onClick={() => {
            setCode(snapshot);
            saveDraft(snapshot);
            setRestoreUndoSnapshot(null);
            toast({
              title: "Restoration cancelled",
              description: "Editor reverted to your previous code.",
            });
          }}
        >
          Cancel restoration
        </ToastAction>
      ),
    });
  };

  const handleRestoreLastSubmitted = () => {
    const lastForLang = submissions.find((s) => s.language === language);
    if (!lastForLang) {
      toast({
        title: "No previous submission",
        description: `No ${langInfo.label} submission found for this problem yet.`,
        variant: "destructive",
      });
      return;
    }
    const label = `${langInfo.label} · ${lastForLang.verdict ?? "Pending"} · ${new Date(lastForLang.created_at).toLocaleString()}`;
    const baseline = draft ?? getStarter(language);
    const hasUnsavedChanges = code !== baseline && code !== lastForLang.source_code;
    if (hasUnsavedChanges) {
      setPendingRestoreCode({
        code: lastForLang.source_code,
        label,
        snapshot: code,
      });
      return;
    }
    applyRestore(lastForLang.source_code, label, code);
  };

  const confirmRestoreLastSubmitted = () => {
    if (!pendingRestoreCode) return;
    applyRestore(
      pendingRestoreCode.code,
      pendingRestoreCode.label,
      pendingRestoreCode.snapshot,
    );
    setPendingRestoreCode(null);
  };


  const toggleEditorFullscreen = () => setIsEditorFullscreen((v) => !v);

  const handleRun = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setRunResult(null);
    setSubmitResult(null);
    setExecutionErrorDetails(false);
    setActiveBottomTab("output");
    try {
      const result = await run({
        source_code: code,
        language_id: langInfo.judge0Id,
        stdin,
        problem_slug: slug,
        language,
        ...(problem.sql
          ? { schema: problem.sql.schema, seed: problem.sql.seed }
          : {}),
      });
      setRunResult(result);
      setExecutionErrorDetails(false);
      refetchRuns();
    } catch (err) {
      setExecutionErrorDetails(true);
      toast({
        title: "Run failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setSubmitResult(null);
    setRunResult(null);
    setExecutionErrorDetails(false);
    setActiveBottomTab("output");
    // Auto-format right before submit so submitted code has consistent style.
    // Honors the user's "Format on submit" preference. Failures are non-blocking.
    if (effectiveFormatOnSubmit !== "off") {
      try {
        await editorRef.current?.format();
      } catch {
        /* ignore formatter errors */
      }
    }
    // Optional lightweight lint pass: trim trailing whitespace, collapse 3+
    // blank lines into one, and ensure exactly one trailing newline.
    let lintCleaned: string | null = null;
    if (effectiveFormatOnSubmit === "format+lint") {
      const current = editorRef.current?.getValue() ?? code;
      const cleaned = current
        .split("\n")
        .map((l) => l.replace(/[ \t]+$/g, ""))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\s+$/g, "") + "\n";
      if (cleaned !== current) {
        lintCleaned = cleaned;
        setCode(cleaned);
        saveDraft(cleaned);
      }
    }
    // Make sure the latest draft is persisted before we ship the submission.
    try {
      await flushDraft?.();
    } catch {
      /* ignore */
    }
    // Prefer the lint-cleaned source if we computed one; otherwise read
    // directly from the editor so we capture freshly-formatted code (React
    // state may not have flushed yet).
    const sourceToSubmit = lintCleaned ?? editorRef.current?.getValue() ?? code;

    // If submitting in the context of a contest, validate server-side first so
    // we surface clear errors (not registered, contest closed, already solved, etc.)
    setContestError(null);
    const contestSlug = searchParams.get("contest");
    if (contestSlug) {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: contestRow } = await supabase
          .from("contests")
          .select("id")
          .eq("slug", contestSlug)
          .maybeSingle();
        if (contestRow?.id) {
          const { data: check, error: checkErr } = await supabase.rpc(
            "validate_contest_submission",
            { _contest_id: contestRow.id, _problem_slug: problem.slug },
          );
          if (checkErr) throw checkErr;
          const v = check as { ok: boolean; message?: string; code?: string } | null;
          if (v && !v.ok) {
            const msg = v.message ?? "Cannot submit to this contest right now.";
            setContestError(msg);
            toast({ title: "Submission blocked", description: msg, variant: "destructive" });
            return;
          }
        }
      } catch (err) {
        const msg = (err as Error).message;
        setContestError(msg);
        toast({ title: "Contest validation failed", description: msg, variant: "destructive" });
        return;
      }
    }

    try {
      const result = await submit({
        source_code: sourceToSubmit,
        language,
        language_id: langInfo.judge0Id,
        problem_slug: problem.slug,
        tests: problem.hiddenTests,
        cpu_time_limit: problem.cpuTimeLimitSec,
        memory_limit: problem.memoryLimitKb,
        ...(problem.sql
          ? {
              schema: problem.sql.schema,
              seed: problem.sql.seed,
              reference_query: problem.sql.referenceQuery,
              order_matters: !!problem.sql.orderMatters,
            }
          : {}),
        ...(searchParams.get("contest") ? { contest_slug: searchParams.get("contest")! } : {}),
      });
      setSubmitResult(result);
      setExecutionErrorDetails(false);
      refetchSubmissions();
      const isAccepted = result.verdict === "Accepted";
      const elapsedMs = sessionTimerRef.current?.getElapsedMs() ?? 0;
      const baseDesc = `${result.passed} / ${result.total} test cases passed`;
      toast({
        title: result.verdict,
        description:
          isAccepted && elapsedMs > 0
            ? `${baseDesc} · Solved in ${formatSolveTime(elapsedMs)}`
            : baseDesc,
        variant: isAccepted ? "default" : "destructive",
      });

      // Contest auto-finish: if this submission was Accepted in contest mode,
      // route the participant to the leaderboard so they can see their result.
      // Only triggers for accepted submissions to avoid kicking the user out
      // mid-attempt on a wrong answer.
      const contestSlugParam = searchParams.get("contest");
      if (isAccepted && contestSlugParam) {
        window.setTimeout(() => {
          navigate(`/contests/${contestSlugParam}/leaderboard`);
        }, 1500);
      }
    } catch (err) {
      setExecutionErrorDetails(true);
      toast({
        title: "Submit failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const acceptedExists = submissions.some((s) => s.verdict === "Accepted");

  // Keep the shortcut bag pointing at the latest closures + busy state.
  shortcutBagRef.current = {
    run: handleRun,
    submit: handleSubmit,
    reset: handleReset,
    busy: isRunning || isSubmitting,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <Helmet>
        <title>{problem.title} — Coding Problem | Parikshaa</title>
        <meta name="description" content={problem.description.slice(0, 155)} />
        <link rel="canonical" href={`https://www.parikshaa.org/library/problems/${problem.slug}`} />
        <meta property="og:title" content={`${problem.title} — Coding Problem | Parikshaa`} />
        <meta property="og:description" content={problem.description.slice(0, 155)} />
        <meta property="og:url" content={`https://www.parikshaa.org/library/problems/${problem.slug}`} />
        <meta property="og:type" content="article" />
        <meta name="twitter:title" content={`${problem.title} — Coding Problem | Parikshaa`} />
        <meta name="twitter:description" content={problem.description.slice(0, 155)} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: problem.title,
          name: problem.title,
          description: problem.description.slice(0, 300),
          url: `https://www.parikshaa.org/library/problems/${problem.slug}`,
          articleSection: "Coding Problems",
          keywords: ["coding problem", problem.difficulty, "DSA", "algorithm"].join(", "),
          author: { "@type": "Organization", name: "Parikshaa" },
        })}</script>
      </Helmet>

      {contestError && (
        <div
          data-testid="contest-submit-error"
          role="alert"
          className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive flex items-center justify-between gap-3"
        >
          <span>
            <strong className="font-semibold">Submission blocked:</strong>{" "}
            <span data-testid="contest-submit-error-message">{contestError}</span>
          </span>
          <button
            data-testid="contest-submit-error-dismiss"
            onClick={() => setContestError(null)}
            className="text-destructive/70 hover:text-destructive text-xs underline"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      )}

      {contestId && searchParams.get("contest") && (
        <div className="px-4 py-2">
          <SecureProblemHUD
            contestId={contestId}
            contestSlug={searchParams.get("contest")!}
            onSubmissionReadyChange={setSecureSubmissionReady}
          />
        </div>
      )}

      {/* Top toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
            <Link to="/library/problems" aria-label="All Problems">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">All Problems</span>
            </Link>
          </Button>
          {/* Breadcrumb — collapses to current page on small screens */}
          <nav
            aria-label="Breadcrumb"
            className="hidden md:flex items-center gap-1 text-xs text-muted-foreground min-w-0"
          >
            <Link to="/library/problems" className="hover:text-foreground transition-colors">
              Library
            </Link>
            <ChevronRight className="h-3 w-3 opacity-60" />
            <Link to="/library/problems" className="hover:text-foreground transition-colors">
              Problems
            </Link>
            <ChevronRight className="h-3 w-3 opacity-60" />
          </nav>
          <div className="min-w-0 flex items-center gap-2">
            <h1 className="font-semibold text-sm sm:text-base truncate">{problem.title}</h1>
            <Badge variant="outline" className={cn("font-medium hidden sm:inline-flex", difficultyClass(problem.difficulty))}>
              {problem.difficulty}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const limits = getExecLimitsForLang(language, {
              cpuSec: problem.cpuTimeLimitSec,
              memKb: problem.memoryLimitKb,
            });
            const limitsLabel = `${(limits.cpuMs / 1000).toFixed(1)} seconds CPU and ${Math.round(limits.memKb / 1024)} megabytes memory`;
            const popoverId = "exec-limits-help";
            return (
              <div className="hidden md:inline-flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide cursor-help"
                      aria-label={`Execution limits for ${langInfo.label}: ${limitsLabel}`}
                    >
                      <Cpu className="h-3 w-3" aria-hidden="true" />
                      <span aria-hidden="true">
                        {`${(limits.cpuMs / 1000).toFixed(1)}s · ${Math.round(limits.memKb / 1024)}MB`}
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p className="font-medium mb-1">Execution limits ({langInfo.label})</p>
                    <p className="text-muted-foreground">{formatLimits(limits)}</p>
                  </TooltipContent>
                </Tooltip>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Explain execution limits (currently ${limitsLabel} for ${langInfo.label})`}
                      aria-controls={popoverId}
                      className="h-6 w-6 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
                    >
                      <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">About execution limits</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    id={popoverId}
                    side="bottom"
                    align="end"
                    role="dialog"
                    aria-labelledby={`${popoverId}-title`}
                    aria-describedby={`${popoverId}-desc`}
                    className="w-80 text-xs space-y-2 focus:outline-none"
                  >
                    <p id={`${popoverId}-title`} className="text-sm font-semibold text-foreground">
                      What do{" "}
                      <span className="font-mono">
                        {(limits.cpuMs / 1000).toFixed(1)}s · {Math.round(limits.memKb / 1024)}MB
                      </span>{" "}
                      mean?
                    </p>
                    <p id={`${popoverId}-desc`} className="text-muted-foreground">
                      These are the <span className="font-medium text-foreground">execution limits</span> applied to your code when you Run or Submit it on this problem.
                    </p>
                    <ul className="space-y-1.5 text-muted-foreground">
                      <li>
                        <span className="font-mono text-foreground">{(limits.cpuMs / 1000).toFixed(1)}s CPU</span> — max time your code can spend doing work on a single test case. Exceed it and you'll see <span className="font-medium">Time Limit Exceeded</span>.
                      </li>
                      <li>
                        <span className="font-mono text-foreground">{Math.round(limits.memKb / 1024)}MB memory</span> — max RAM your program can use. Exceed it and you'll see <span className="font-medium">Memory Limit Exceeded</span>.
                      </li>
                      <li>
                        <span className="font-mono text-foreground">Wall {(Math.max(limits.wallMs, limits.cpuMs) / 1000).toFixed(1)}s</span> — total real-world time including I/O before the run is killed.
                      </li>
                    </ul>
                    <p className="text-[11px] text-muted-foreground pt-1 border-t">
                      Limits vary per language (e.g. Python and Java get a bit more time than C++). Switching the language updates these numbers automatically.
                    </p>
                    <p className="sr-only">Press Escape to close this dialog.</p>
                  </PopoverContent>
                </Popover>
              </div>
            );
          })()}
          <Button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            variant="outline"
            size="sm"
            className="gap-1.5"
            title="Run code (Ctrl/Cmd+Enter)"
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Run</span>
          </Button>
          <Button
            data-testid="contest-submit-button"
            data-contest-submit-btn=""
            onClick={handleSubmit}
            disabled={
              isRunning ||
              isSubmitting ||
              contestSubmitBlocked ||
              (!!searchParams.get("contest") && !secureSubmissionReady)
            }
            size="sm"
            className="gap-1.5"
            title={
              contestSubmitBlocked
                ? contestError ?? "Submission is blocked for this contest"
                : !!searchParams.get("contest") && !secureSubmissionReady
                ? "Heartbeat offline — submissions paused until reconnected"
                : "Submit solution (Ctrl/Cmd+Shift+Enter)"
            }
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Submit
          </Button>
        </div>
      </div>

      {/* Resizable split */}
      <ResizablePanelGroup ref={horizontalGroupRef} direction="horizontal" className="flex-1">
        {/* LEFT: tabs */}
        <ResizablePanel defaultSize={layoutPreset.horizontal[0]} minSize={20}>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as EditorTabId)}
            className="h-full flex flex-col"
            aria-label="Problem panels"
          >
            <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <ChevronScroller>
                <SortableEditorTabs
                  order={tabOrder}
                  onReorder={(next) => setTabOrder(next)}
                  lockedIds={(["notes", "my-solution", "solution", "runs"] as EditorTabId[]).filter(isTabLocked)}
                  reorderDisabled={
                    contestLocks.notesLocked ||
                    contestLocks.solutionLocked ||
                    contestLocks.historyLocked
                  }
                  onBlockedReorder={(reason, info) => {
                    logContestLockEvent({
                      contestId,
                      problemSlug: slug,
                      kind: "blocked_drag_reorder",
                      target: "tabs",
                      details: { reason, ...info },
                    });
                  }}
                  renderLabel={(id) => {
                    const lockMark = isTabLocked(id) ? (
                      <span className="ml-1 text-amber-500" aria-label="Locked during contest">🔒</span>
                    ) : null;
                    switch (id) {
                      case "description":
                        return "Description";
                      case "my-solution":
                        return (
                          <>
                            My Solution {hasMySolution && (
                              <span
                                className={cn(
                                  "ml-1.5 h-1.5 w-1.5 rounded-full inline-block",
                                  mySolutionIsComplete ? "bg-emerald-500" : "bg-amber-500",
                                )}
                              />
                            )}
                            {lockMark}
                          </>
                        );
                      case "solution":
                        return <>Reference{lockMark}</>;
                      case "notes":
                        return (
                          <>
                            Notes {notesValue.trim().length > 0 && (
                              <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                            )}
                            {lockMark}
                          </>
                        );
                      case "submissions":
                        return (
                          <>
                            Submissions {submissions.length > 0 && (
                              <span className="ml-1.5 text-xs text-muted-foreground">({submissions.length})</span>
                            )}
                          </>
                        );
                      case "runs":
                        return (
                          <>
                            Runs {runs.length > 0 && (
                              <span className="ml-1.5 text-xs text-muted-foreground">({runs.length})</span>
                            )}
                            {lockMark}
                          </>
                        );
                    }
                  }}
                />
              </ChevronScroller>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <TabsContent value="description" className="mt-0 space-y-6">
                <ProblemDetailHeader
                  isSolved={problemStats.isSolved}
                  isAttempted={problemStats.isAttempted}
                  attempts={problemStats.attempts}
                  solvedAt={problemStats.solvedAt}
                  isBookmarked={isBookmarked(problem.slug)}
                  onToggleBookmark={() => toggleBookmark(problem.slug)}
                />

                {/* Personal acceptance + estimated solve time + companies */}
                <ProblemMetaStrip
                  acceptance={
                    problemStats.attempts > 0
                      ? Math.round(
                          (submissions.filter((s) => s.verdict === "Accepted").length /
                            problemStats.attempts) *
                            100,
                        )
                      : null
                  }
                  attempts={problemStats.attempts}
                  estimatedMinutes={
                    problem.difficulty === "Easy"
                      ? 15
                      : problem.difficulty === "Medium"
                        ? 30
                        : 50
                  }
                  mySolution={{
                    hasNotes: mySolutionHasNotes,
                    hasAnyCode: mySolutionHasAnyCode,
                    isComplete: mySolutionIsComplete,
                    languageCount: mySolutionSavedLanguages.length,
                  }}
                  loading={submissionsLoading && submissions.length === 0}
                />

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={cn("font-medium sm:hidden", difficultyClass(problem.difficulty))}>
                    {problem.difficulty}
                  </Badge>
                  {problem.topics.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.description}</ReactMarkdown>
                </div>

                {/* SQL Schema panel — only for SQL problems */}
                {problem.sql && (
                  <SchemaSeedToggle
                    schema={problem.sql.schema}
                    seed={problem.sql.seed}
                    defaultOpen
                  />
                )}

                {/* Examples */}
                <div className="space-y-3">
                  {problem.examples.map((ex, i) => (
                    <div key={i} className="rounded-md bg-muted/50 p-3 border">
                      <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider text-muted-foreground">
                        Example {i + 1}
                      </p>
                      <div className="space-y-1.5 text-sm font-mono">
                        <p><span className="text-muted-foreground">Input:</span> {ex.input}</p>
                        <p><span className="text-muted-foreground">Output:</span> {ex.output}</p>
                        {ex.explanation && (
                          <p className="font-sans text-muted-foreground italic">
                            {ex.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                {problem.constraints.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Constraints</h3>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground font-mono">
                      {problem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hints — progressive disclosure */}
                {contestLocks.hintsLocked ? (
                  <LockedAuxPanel label="Hints" endsAt={contestLocks.endsAt} />
                ) : (
                  <ProgressiveHints hints={problem.hints} slug={problem.slug} />
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                {contestLocks.notesLocked ? (
                  <LockedAuxPanel label="Notes" endsAt={contestLocks.endsAt} />
                ) : (
                  <NotesPanel
                    value={notesValue}
                    onChange={setNotesValue}
                    savedAt={notesSavedAt}
                  />
                )}
              </TabsContent>

              <TabsContent value="my-solution" className="mt-0">
                {contestLocks.solutionLocked ? (
                  <LockedAuxPanel label="My Solution" endsAt={contestLocks.endsAt} />
                ) : (
                <MySolutionPanel
                  notes={mySolutionNotes}
                  onNotesChange={setMySolutionNotes}
                  code={mySolutionCode}
                  onCodeChange={setMySolutionCode}
                  language={mySolutionLanguage}
                  onLanguageChange={setMySolutionLanguage}
                  savedLanguages={mySolutionSavedLanguages}
                  codeUpdatedAt={mySolutionCodeUpdatedAt}
                  onUseCurrentDraft={() => code}
                  onClear={clearMySolution}
                  onRestore={restoreMySolution}
                  onUndoCodeChange={undoMySolutionCode}
                  canUndoCode={canUndoMySolutionCode}
                  hasUnsavedCurrentCode={mySolutionHasUnsavedCurrentCode}
                  savedAt={mySolutionSavedAt}
                  hasNotes={mySolutionHasNotes}
                  hasAnyCode={mySolutionHasAnyCode}
                  isComplete={mySolutionIsComplete}
                  timestampFormat={editorPrefs.timestampFormat}
                  onToggleTimestampFormat={toggleTimestampFormat}
                  fontSize={editorPrefs.fontSize}
                  syncStatus={mySolutionSyncStatus}
                  isCloudSynced={mySolutionIsCloudSynced}
                  lastSyncedAt={mySolutionLastSyncedAt}
                  onSignInClick={() =>
                    navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)
                  }
                />
                )}
              </TabsContent>

              <TabsContent value="solution" className="mt-0">
                {contestLocks.solutionLocked ? (
                  <LockedAuxPanel label="Reference solution" endsAt={contestLocks.endsAt} />
                ) : !acceptedExists ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      🔒 Solve the problem first to unlock the reference solution.
                    </p>
                  </Card>
                ) : problem.referenceSolution[language] ? (
                  <pre className="text-sm bg-muted/50 p-4 rounded-md border overflow-x-auto">
                    <code>{problem.referenceSolution[language]}</code>
                  </pre>
                ) : problem.referenceSolution.python ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Reference (Python):
                    </p>
                    <pre className="text-sm bg-muted/50 p-4 rounded-md border overflow-x-auto">
                      <code>{problem.referenceSolution.python}</code>
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No reference solution available.</p>
                )}
              </TabsContent>

              <TabsContent value="submissions" className="mt-0">
                {!user ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-3">
                      Sign in to view your submission history.
                    </p>
                    <Button onClick={() => setShowLogin(true)}>Sign in</Button>
                  </Card>
                ) : submissionsLoading && submissions.length === 0 ? (
                  <AttemptTimeline submissions={[]} limit={10} loading />
                ) : submissions.length === 0 ? (
                  <AttemptTimeline submissions={[]} limit={10} />
                ) : (
                  <div className="space-y-3">
                    <AttemptTimeline
                      submissions={submissions}
                      limit={10}
                      onSelect={openSubmission}
                      highlightedId={lastOpenedId}
                      scrollToHighlightKey={timelineScrollKey}
                    />
                    {submissions.length > 0 && (
                      <div className="space-y-2">
                        {submissions.map((s) => (
                          <Card
                            key={s.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openSubmission(s)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openSubmission(s);
                              }
                            }}
                            className={cn(
                              "p-3 hover:bg-muted/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                              lastOpenedId === s.id && "ring-1 ring-primary/40 bg-primary/5",
                            )}
                          >
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-3">
                                <VerdictBadge verdict={s.verdict} />
                                <span className="text-sm text-muted-foreground">{s.language}</span>
                                <span className="text-xs text-muted-foreground">
                                  {s.passed_tests}/{s.total_tests} tests
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {s.runtime_ms !== null && <span>{s.runtime_ms} ms</span>}
                                {s.memory_kb !== null && <span>{(s.memory_kb / 1024).toFixed(1)} MB</span>}
                                <span>{new Date(s.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="runs" className="mt-0" aria-label="Run history">
                {contestLocks.historyLocked ? (
                  <LockedAuxPanel label="Run history" endsAt={contestLocks.endsAt} />
                ) : !user ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-3">
                      Sign in to view your run history.
                    </p>
                    <Button onClick={() => setShowLogin(true)}>Sign in</Button>
                  </Card>
                ) : runs.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No runs yet. Hit <strong>Run</strong> to test your code with custom input.
                    </p>
                  </Card>
                ) : (
                  <ProblemRunHistory runs={runs} />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT: editor + bottom panel */}
        <ResizablePanel defaultSize={layoutPreset.horizontal[1]} minSize={25}>
          <ResizablePanelGroup ref={verticalGroupRef} direction="vertical">
            <ResizablePanel defaultSize={layoutPreset.vertical[0]} minSize={20}>
              <div
                className={cn(
                  "h-full flex flex-col bg-background",
                  isEditorFullscreen &&
                    "fixed inset-0 z-50 h-screen w-screen border-0",
                )}
              >
                {/* Editor toolbar */}
                <div className="sticky top-0 z-20 px-3 py-2 border-b bg-muted/40 backdrop-blur supports-[backdrop-filter]:bg-muted/30">
                  <ChevronScroller>
                    <div className="flex items-center gap-2 w-max min-w-full flex-nowrap">
                      <div className="flex items-center gap-2 min-w-0 shrink-0">
                    <Select value={language} onValueChange={(v) => setLanguage(v as LangId)}>
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES
                          .filter((l) => (isSQLProblem ? l.id === "sql" : l.id !== "sql"))
                          .map((l) => (
                            <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <DraftSaveIndicator
                      status={saveStatus}
                      lastSavedAt={lastSavedAt}
                      isAuthenticated={!!user}
                      className="hidden sm:inline-flex"
                    />
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 flex-nowrap">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={decFontSize}
                            disabled={editorPrefs.fontSize <= FS_MIN}
                            className="h-8 w-8"
                            aria-label="Decrease font size"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Smaller font</TooltipContent>
                      </Tooltip>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums px-1">
                        <Type className="h-3 w-3" />
                        {editorPrefs.fontSize}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={incFontSize}
                            disabled={editorPrefs.fontSize >= FS_MAX}
                            className="h-8 w-8"
                            aria-label="Increase font size"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Larger font</TooltipContent>
                      </Tooltip>
                      <div className="w-px h-5 bg-border mx-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleFormat}
                            className="h-8 w-8"
                            aria-label="Format code"
                          >
                            <Wand2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Format code</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRestoreLastSubmitted}
                            disabled={submissionsLoading}
                            className="h-8 w-8"
                            aria-label="Restore last submitted code"
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Last submitted ({langInfo.label})</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleReset}
                            className="h-8 w-8"
                            aria-label="Reset to starter code"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reset to starter</TooltipContent>
                      </Tooltip>
                      <div className="w-px h-5 bg-border mx-1" />
                      {slug && <SessionTimer ref={sessionTimerRef} slug={slug} />}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleEditorFullscreen}
                            className="h-8 w-8"
                            aria-label={isEditorFullscreen ? "Exit fullscreen" : "Fullscreen editor"}
                          >
                            {isEditorFullscreen ? (
                              <Minimize2 className="h-3.5 w-3.5" />
                            ) : (
                              <Maximize2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isEditorFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen editor"}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowShortcuts(true)}
                            className="h-8 w-8"
                            aria-label="Keyboard shortcuts"
                          >
                            <Keyboard className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Keyboard shortcuts</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const wasCustom = isLayoutCustomized || isPresetCustomized;
                              resetTabsLayout();
                              resetLayoutPreset();
                              toast({
                                title: wasCustom
                                  ? "Editor layout reset"
                                  : "Editor layout already default",
                                description: wasCustom
                                  ? "Tabs, splits, and preset restored to defaults."
                                  : undefined,
                              });
                            }}
                            className={cn(
                              "h-8 w-8",
                              (isLayoutCustomized || isPresetCustomized) && "text-primary",
                            )}
                            aria-label="Reset editor layout"
                          >
                            <LayoutGrid className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isLayoutCustomized || isPresetCustomized
                            ? "Reset editor layout (customized)"
                            : "Reset editor layout"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <LayoutPresetPopover
                      current={layoutPresetId}
                      onSelect={(id) => {
                        setLayoutPreset(id);
                        toast({
                          title: `Layout: ${
                            id.charAt(0).toUpperCase() + id.slice(1).replace("-", " ")
                          }`,
                        });
                      }}
                    />
                    <EditorSettingsPopover
                      formatOnSubmit={effectiveFormatOnSubmit}
                      onFormatOnSubmitChange={setFormatOnSubmit}
                      perTaskOverride={formatOnSubmitOverride}
                      perTaskLabel={`${problem.title} · ${langInfo.label}`}
                      onPerTaskOverrideChange={setFormatOnSubmitOverride}
                    />
                  </div>
                    </div>
                  </ChevronScroller>
                </div>
                <div className="flex-1 min-h-0 relative">
                  <MonacoEditor
                    ref={editorRef}
                    value={code}
                    onChange={handleCodeChange}
                    language={langInfo.monaco}
                    fontSize={editorPrefs.fontSize}
                  />
                  {isEditorFullscreen && showFullscreenHint && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-50 rounded-full border bg-background/90 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-md animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                      Press <kbd className="mx-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to exit fullscreen
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={layoutPreset.vertical[1]} minSize={15}>
              <Tabs
                value={activeBottomTab}
                onValueChange={(v) => setActiveBottomTab(v as "testcase" | "output")}
                className="h-full flex flex-col"
                aria-label="Test case and output"
              >
                <div className="border-b overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <TabsList
                    className="rounded-none justify-start bg-transparent border-0 h-10 px-2 w-max min-w-full flex-nowrap"
                    aria-label="Bottom panel tabs"
                  >
                    <TabsTrigger
                      value="testcase"
                      className="shrink-0 whitespace-nowrap"
                      aria-label="Test case input"
                    >
                      Test Case
                    </TabsTrigger>
                    <TabsTrigger
                      value="output"
                      className="shrink-0 whitespace-nowrap"
                      aria-label="Run and submit output"
                    >
                      Output
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="testcase"
                  className="flex-1 m-0 p-3 overflow-y-auto"
                  aria-label="Test case input"
                >
                  {isSQLProblem ? (
                    <div className="space-y-3">
                      <div className="rounded-md border bg-muted/30 p-3 text-sm">
                        <p className="font-medium mb-1">Seeded dataset</p>
                        <p className="text-muted-foreground text-xs">
                          Your query runs against the schema and seed data shown below. Click{" "}
                          <span className="font-mono">Run</span> to execute and{" "}
                          <span className="font-mono">Submit</span> to compare results with the
                          reference query.
                        </p>
                      </div>
                      {problem.sql && (
                        <SchemaSeedToggle
                          schema={problem.sql.schema}
                          seed={problem.sql.seed}
                          compact
                        />
                      )}
                      <Button
                        onClick={handleRun}
                        disabled={isRunning}
                        size="sm"
                        className="gap-1.5"
                        aria-label="Run SQL query"
                      >
                        {isRunning ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                        Run query
                      </Button>
                    </div>
                  ) : (
                    <TestCaseWorkbench
                      slug={problem.slug}
                      sampleTests={problem.sampleTests}
                      stdin={stdin}
                      onStdinChange={setStdin}
                      onRun={handleRun}
                      isRunning={isRunning}
                    />
                  )}
                </TabsContent>

                <TabsContent
                  value="output"
                  className="flex-1 m-0 p-3 overflow-y-auto"
                  aria-label="Run and submit output"
                >
                  {isRunning || isSubmitting ? (
                    <div
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                      role="status"
                      aria-live="polite"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {isSubmitting ? "Judging against hidden test cases..." : "Running..."}
                    </div>
                  ) : submitResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <VerdictBadge verdict={submitResult.verdict} />
                        <span className="text-sm font-medium">
                          {submitResult.passed} / {submitResult.total} passed
                        </span>
                        {submitResult.runtime_ms > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {submitResult.runtime_ms} ms · {(submitResult.memory_kb / 1024).toFixed(1)} MB
                          </span>
                        )}
                      </div>

                      {submitResult.failing_case && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                          <p className="text-xs font-semibold text-destructive">
                            Failed on test case #{(submitResult.failing_case.index ?? 0) + 1}
                          </p>
                          {isSQLProblem ? (
                            <SqlResultDiff
                              expected={submitResult.failing_case.expected ?? ""}
                              actual={submitResult.failing_case.output ?? ""}
                            />
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                              <div>
                                <p className="text-muted-foreground mb-1">Input</p>
                                <pre className="bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                                  {submitResult.failing_case.input}
                                </pre>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Expected</p>
                                <pre className="bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                                  {submitResult.failing_case.expected}
                                </pre>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Got</p>
                                <pre className="bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                                  {submitResult.failing_case.output || "(empty)"}
                                </pre>
                              </div>
                            </div>
                          )}
                          {submitResult.failing_case.error && (
                            <pre className="text-xs text-destructive bg-background p-2 rounded border overflow-x-auto">
                              {submitResult.failing_case.error}
                            </pre>
                          )}
                        </div>
                      )}

                      {submitResult.stderr && !submitResult.failing_case && (
                        <pre className="text-xs text-destructive bg-destructive/5 p-3 rounded border border-destructive/30 overflow-x-auto whitespace-pre-wrap">
                          {submitResult.stderr}
                        </pre>
                      )}
                      {(() => {
                        const cases: CaseResult[] = submitResult.case_results ?? [];
                        const failed = cases.filter((c) => !c.passed);
                        if (failed.length === 0) return null;
                        return (
                          <div className="space-y-2">
                            <p
                              className="text-xs font-medium text-muted-foreground"
                              id="failing-tests-heading"
                            >
                              Failing tests ({failed.length})
                            </p>
                            <div
                              role="list"
                              aria-labelledby="failing-tests-heading"
                              className="space-y-2"
                            >
                              {failed.map((c) => {
                                const panelId = `failing-test-${c.index}`;
                                return (
                                  <details
                                    key={c.index}
                                    role="listitem"
                                    className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs group"
                                  >
                                    <summary
                                      aria-controls={panelId}
                                      className="cursor-pointer font-medium flex items-center gap-2 flex-wrap list-none"
                                    >
                                      <span className="text-destructive">Test #{c.index + 1}</span>
                                      <Badge variant="outline" className="text-[10px]">{c.status_label}</Badge>
                                      <span className="text-muted-foreground font-mono">
                                        {c.time_ms} ms · {(c.memory_kb / 1024).toFixed(1)} MB
                                      </span>
                                    </summary>
                                    <div id={panelId} className="mt-3 space-y-2">
                                      {isSQLProblem ? (
                                        <SqlResultDiff
                                          expected={c.expected ?? ""}
                                          actual={c.stdout ?? ""}
                                        />
                                      ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
                                          <div>
                                            <p className="text-muted-foreground mb-1">Input</p>
                                            <pre className="bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap">{c.input}</pre>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground mb-1">Expected</p>
                                            <pre className="bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap">{c.expected}</pre>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground mb-1">Got</p>
                                            <pre className="bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap">{c.stdout || "(empty)"}</pre>
                                          </div>
                                        </div>
                                      )}
                                      {c.stderr && (
                                        <div>
                                          <p className="text-muted-foreground mb-1">stderr</p>
                                          <pre className="bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap text-destructive">{c.stderr}</pre>
                                        </div>
                                      )}
                                    </div>
                                  </details>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : runResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {runResult.status.description}
                        </Badge>
                        {runResult.time !== null && <span>{Math.round(runResult.time * 1000)} ms</span>}
                        {runResult.memory !== null && <span>{(runResult.memory / 1024).toFixed(1)} MB</span>}
                      </div>
                      {runResult.stdout && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {isSQLProblem ? "Query result" : "stdout"}
                          </p>
                          {isSQLProblem ? (
                            <SqlResultTable value={runResult.stdout} />
                          ) : (
                            <pre className="text-xs bg-muted/50 p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                              {runResult.stdout}
                            </pre>
                          )}
                        </div>
                      )}
                      {runResult.stderr && (
                        <div>
                          <p className="text-xs text-destructive mb-1">stderr</p>
                          <pre className="text-xs bg-destructive/5 p-3 rounded border border-destructive/30 overflow-x-auto whitespace-pre-wrap">
                            {runResult.stderr}
                          </pre>
                        </div>
                      )}
                      {runResult.compile_output && (
                        <div>
                          <p className="text-xs text-orange-500 mb-1">compile output</p>
                          <pre className="text-xs bg-orange-500/5 p-3 rounded border border-orange-500/30 overflow-x-auto whitespace-pre-wrap">
                            {runResult.compile_output}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : executionErrorDetails ? (
                    <div className="space-y-3">
                      <p className="text-sm text-destructive">Execution failed before a result was produced.</p>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      Hit <strong>Run</strong> to test your code, or <strong>Submit</strong> to grade.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      <LoginPromptDialog
        open={showLogin}
        onOpenChange={setShowLogin}
        message="Sign in to run and submit code, and to save your progress."
      />

      <SubmissionDetailsDrawer
        submission={detailSubmission}
        open={!!detailSubmission || (!!searchParams.get("sub") && submissionsLoading)}
        loading={submissionsLoading && !detailSubmission && !!searchParams.get("sub")}
        onOpenChange={(o) => !o && closeSubmission()}
      />

      <FloatingActionBar
        onRun={handleRun}
        onSubmit={handleSubmit}
        onReset={handleReset}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
      />

      <ShortcutsCheatSheet
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        title="Editor shortcuts"
        shortcuts={[
          { keys: ["Ctrl/Cmd", "Enter"], description: "Run code with current test" },
          { keys: ["Ctrl/Cmd", "Shift", "Enter"], description: "Submit solution" },
          { keys: ["Ctrl/Cmd", "Shift", "R"], description: "Reset to starter code" },
          { keys: ["Esc"], description: "Close drawers and dialogs" },
        ]}
      />

      <AlertDialog
        open={!!pendingRestoreCode}
        onOpenChange={(o) => !o && setPendingRestoreCode(null)}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your current code?</AlertDialogTitle>
            <AlertDialogDescription>
              Your editor has unsaved changes that differ from your last saved
              draft. Loading{" "}
              <span className="font-medium text-foreground">
                {pendingRestoreCode?.label}
              </span>{" "}
              will overwrite the code currently in the editor. Review the diff
              below before confirming — this can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingRestoreCode && (
            <CodeDiffPreview
              before={code}
              after={pendingRestoreCode.code}
              maxLines={28}
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my code</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestoreLastSubmitted}>
              Replace with last submission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CodingProblemDetail;
