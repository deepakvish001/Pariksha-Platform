import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CheckCircle2, Flag, LayoutGrid, Send, Trophy } from "lucide-react";
import { usePaper, useExistingAnswers, useSaveAnswer, useSubmitAttempt, type PaperQuestion } from "../hooks/usePaper";
import { useProctoring } from "../hooks/useProctoring";
import { resolveProctoringConfig } from "../lib/proctoringConfig";
import { supabase } from "@/integrations/supabase/client";
import { PlayerTopBar } from "../components/PlayerTopBar";
import { GeneralInstructionsDialog } from "../components/GeneralInstructionsDialog";
import { useEditorPrefs, QUESTION_FONT_SCALES } from "../hooks/useEditorPrefs";
import { QuestionPalette } from "../components/QuestionPalette";
import { AnswerUploadTile } from "../components/AnswerUploadTile";
import { isAnswered as isAnsweredFn } from "../lib/isAnswered";
import { CodingQuestion } from "../components/CodingQuestion";
import { SqlQuestion } from "../components/SqlQuestion";
import { PlayerBottomBar } from "../components/PlayerBottomBar";
import { AssessmentChatDock } from "../components/AssessmentChatDock";
import { Submitted } from "./Submitted";
import { AssessmentLockdownGate } from "../components/AssessmentLockdownGate";
import { WebcamPip } from "../components/WebcamPip";
import { ViolationBanner } from "../components/ViolationBanner";
import { useOnline } from "../hooks/useOnline";
import { useDeviceLock } from "../hooks/useDeviceLock";
import { useDisplayCapture } from "../hooks/useDisplayCapture";
import { useWebrtcStream } from "@/hooks/useWebrtcStream";
import { useChunkedRecorder } from "@/hooks/useChunkedRecorder";
import { useTypingAnalytics } from "../hooks/useTypingAnalytics";
import { safeStorage } from "../lib/safeStorage";
import { getPlayerMainClass } from "../lib/playerLayout";
import { cn } from "@/lib/utils";

type AnswerMap = Record<string, Record<string, unknown>>;

export default function Player() {
  const { attemptId } = useParams();
  const [search] = useSearchParams();
  const isPreview = search.get("preview") === "1";
  const navigate = useNavigate();
  const { data: paper, isLoading, error } = usePaper(attemptId);
  const { data: existing } = useExistingAnswers(attemptId);
  const saveAnswer = useSaveAnswer();
  const submitAttempt = useSubmitAttempt();
  const proctoringEnabled = paper?.attempt.status === "in_progress";

  // Lockdown gate + webcam stream are required before the player content renders.
  const [lockdownReady, setLockdownReady] = useState(false);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);

  const flatQuestions = useMemo<PaperQuestion[]>(
    () => (paper?.sections ?? []).flatMap((s) => s.questions),
    [paper]
  );

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [idx, setIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const { prefs: editorPrefs, update: updateEditorPrefs } = useEditorPrefs();
  const fontScale = editorPrefs.questionFontScale ?? 1;
  const scaleIdx = QUESTION_FONT_SCALES.indexOf(fontScale as typeof QUESTION_FONT_SCALES[number]);
  const safeScaleIdx = scaleIdx === -1 ? QUESTION_FONT_SCALES.indexOf(1) : scaleIdx;
  const canZoomIn = safeScaleIdx < QUESTION_FONT_SCALES.length - 1;
  const canZoomOut = safeScaleIdx > 0;
  const zoomIn = () => {
    if (!canZoomIn) return;
    updateEditorPrefs({ questionFontScale: QUESTION_FONT_SCALES[safeScaleIdx + 1] });
  };
  const zoomOut = () => {
    if (!canZoomOut) return;
    updateEditorPrefs({ questionFontScale: QUESTION_FONT_SCALES[safeScaleIdx - 1] });
  };
  const [paletteCollapsed, setPaletteCollapsed] = useState<boolean>(() => {
    return safeStorage.get("assess.palette.collapsed") === "1";
  });
  useEffect(() => {
    safeStorage.set("assess.palette.collapsed", paletteCollapsed ? "1" : "0");
  }, [paletteCollapsed]);
  
  const online = useOnline();
  const pendingQueueRef = useRef<Record<string, Record<string, unknown>>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const pendingKey = attemptId ? `assess.pending.${attemptId}` : null;
  const persistQueue = useCallback(() => {
    if (!pendingKey) return;
    const q = pendingQueueRef.current;
    if (Object.keys(q).length === 0) safeStorage.remove(pendingKey);
    else safeStorage.set(pendingKey, JSON.stringify(q));
  }, [pendingKey]);
  const restoredRef = useRef(false);



  useEffect(() => {
    if (!existing || restoredRef.current || !pendingKey) return;
    restoredRef.current = true;
    const map: AnswerMap = {};
    for (const a of existing) map[a.question_id] = (a.answer as Record<string, unknown>) ?? {};
    // Replay anything that was queued before a crash / hard close
    const raw = safeStorage.get(pendingKey);
    if (raw) {
      try {
        const stashed = JSON.parse(raw) as Record<string, Record<string, unknown>>;
        for (const [qid, ans] of Object.entries(stashed)) {
          map[qid] = ans; // stashed value is newer than server
          pendingQueueRef.current[qid] = ans;
        }
        setPendingCount(Object.keys(pendingQueueRef.current).length);
      } catch {
        // Corrupted blob — drop it so we don't loop forever
        safeStorage.remove(pendingKey);
      }
    }
    setAnswers((prev) => ({ ...map, ...prev }));
  }, [existing, pendingKey]);

  // Timer
  const deadline = useMemo(() => {
    if (!paper) return null;
    const started = new Date(paper.attempt.started_at).getTime();
    return started + paper.assessment.duration_min * 60_000;
  }, [paper]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = deadline ? Math.max(0, deadline - now) : 0;

  const submittedRef = useRef(false);
  const debounceRef = useRef<Record<string, number>>({});
  const doSubmit = useCallback(
    async (auto = false) => {
      if (!attemptId) return;
      Object.values(debounceRef.current).forEach((t) => window.clearTimeout(t));
      for (const [qid, ans] of Object.entries(answers)) {
        try {
          await saveAnswer.mutateAsync({ attempt_id: attemptId, question_id: qid, answer: ans });
        } catch { /* noop */ }
      }
      try {
        await submitAttempt.mutateAsync(attemptId);
        setSubmitted(true);
        toast.success(auto ? "Time's up — auto-submitted" : "Submitted successfully");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to submit");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attemptId, answers, saveAnswer, submitAttempt]
  );

  // Auto-submit hooks (proctoring + timer share the same doSubmit)
  const doSubmitRef = useRef(doSubmit);
  useEffect(() => { doSubmitRef.current = doSubmit; }, [doSubmit]);

  const proctoringConfig = useMemo(
    () =>
      resolveProctoringConfig(
        paper?.assessment.proctoring_config,
        !!paper?.assessment.proctoring_enabled
      ),
    [paper?.assessment.proctoring_config, paper?.assessment.proctoring_enabled]
  );

  const { requestFullscreen, violations, fullscreenLost, logEvent: logProctorEvent, maxViolations } = useProctoring(
    attemptId,
    proctoringEnabled && lockdownReady,
    {
      config: proctoringConfig,
      onAutoSubmit: () => {
        if (!submittedRef.current) {
          submittedRef.current = true;
          doSubmitRef.current(true);
        }
      },
      onStrike: (total, _kind, reason) => {
        toast.warning(`Violation ${total}/${proctoringConfig.max_violations}: ${reason}`);
      },
    }
  );

  useEffect(() => {
    if (deadline && remaining === 0 && !submittedRef.current && paper && paper.attempt.status === "in_progress") {
      submittedRef.current = true;
      doSubmit(true);
    }
  }, [remaining, deadline, paper, doSubmit]);

  // Device fingerprint lock — pins on first attempt start, auto-submits on mismatch
  useDeviceLock({
    attemptId,
    enabled: proctoringEnabled && lockdownReady,
    onMismatch: (current, stored) => {
      void logProctorEvent("device_change", { current, stored });
    },
  });

  // Screen capture monitoring — required only when proctoring_config.require_screen_share
  const secondMonitorLoggedRef = useRef(false);
  const { stream: screenStream } = useDisplayCapture({
    attemptId,
    enabled: proctoringEnabled && lockdownReady && proctoringConfig.require_screen_share,
    onSecondMonitor: () => {
      if (secondMonitorLoggedRef.current) return;
      secondMonitorLoggedRef.current = true;
      void logProctorEvent("second_monitor");
    },
    onShareLost: () => { void logProctorEvent("screenshare_lost"); },
  });

  // Live three-eye publishers — broadcast existing webcam + screen streams over
  // WebRTC so proctors can watch from the Manage Assessment page in real time.
  // Channels are scoped per attempt and gated by lockdownReady so we never
  // publish before the attempt is officially in progress.
  useWebrtcStream({
    channelId: proctoringEnabled && lockdownReady && camStream && attemptId ? `proctor:${attemptId}:webcam` : null,
    role: "publisher",
    localStream: camStream,
  });
  useWebrtcStream({
    channelId: proctoringEnabled && lockdownReady && screenStream && attemptId ? `proctor:${attemptId}:screen` : null,
    role: "publisher",
    localStream: screenStream,
    maxBitrate: 800_000,
  });

  // Continuous session recording — uploads independent ~165s WebM chunks to
  // evidence storage so proctors can replay the whole attempt later, even
  // when no proctor was watching live.
  const recordEnabled = proctoringEnabled && lockdownReady && !!proctoringConfig.record_full_session;
  useChunkedRecorder({
    stream: camStream,
    attemptId: attemptId ?? null,
    kind: "webcam",
    enabled: recordEnabled,
  });
  useChunkedRecorder({
    stream: screenStream,
    attemptId: attemptId ?? null,
    kind: "screen",
    enabled: recordEnabled,
  });

  // Typing analytics — flags super-human typing bursts inside any text input or editor
  const typing = useTypingAnalytics({
    onBurst: (cpm) => { void logProctorEvent("typing_burst", { cpm }); },
  });
  useEffect(() => {
    if (!proctoringEnabled || !lockdownReady) return;
    const onInput = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const inEditor =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable ||
        !!target?.closest(".monaco-editor");
      if (!inEditor) return;
      // Each input event ≈ 1 keystroke; large diffs are bursts.
      const ie = e as InputEvent;
      const added = ie.data ? ie.data.length : 1;
      typing.record(added);
    };
    document.addEventListener("input", onInput, true);
    return () => document.removeEventListener("input", onInput, true);
  }, [proctoringEnabled, lockdownReady, typing, logProctorEvent]);

  // Track latest answers without re-creating queueSave on every keystroke
  const answersRef = useRef<AnswerMap>({});
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const flushPending = useCallback(async () => {
    if (!attemptId) return;
    // Cancel debounced timers — we are flushing everything now.
    Object.values(debounceRef.current).forEach((t) => window.clearTimeout(t));
    debounceRef.current = {};
    const queue = pendingQueueRef.current;
    pendingQueueRef.current = {};
    setPendingCount(0);
    const entries = Object.entries(queue);
    if (entries.length === 0) { persistQueue(); return; }
    let ok = 0;
    for (const [qid, ans] of entries) {
      try {
        await saveAnswer.mutateAsync({ attempt_id: attemptId, question_id: qid, answer: ans });
        ok++;
      } catch {
        // Put back (unless user typed a newer value in the meantime — keep newest)
        if (!pendingQueueRef.current[qid]) pendingQueueRef.current[qid] = ans;
      }
    }
    setPendingCount(Object.keys(pendingQueueRef.current).length);
    persistQueue();
    if (ok > 0) setLastSavedAt(Date.now());
  }, [attemptId, saveAnswer, persistQueue]);

  // Reconnect → flush
  useEffect(() => {
    if (online) void flushPending();
  }, [online, flushPending]);

  const queueSave = (qid: string, ans: Record<string, unknown>) => {
    if (!attemptId) return;
    // Always stash the latest value for offline replay / global flush
    pendingQueueRef.current[qid] = ans;
    setPendingCount(Object.keys(pendingQueueRef.current).length);
    persistQueue();

    window.clearTimeout(debounceRef.current[qid]);
    debounceRef.current[qid] = window.setTimeout(() => {
      if (!navigator.onLine) return; // hold in queue; will flush on reconnect
      saveAnswer.mutate(
        { attempt_id: attemptId, question_id: qid, answer: ans },
        {
          onSuccess: () => {
            // Only clear if user hasn't typed a newer value since
            if (pendingQueueRef.current[qid] === ans) {
              delete pendingQueueRef.current[qid];
              setPendingCount(Object.keys(pendingQueueRef.current).length);
              persistQueue();
            }
            setLastSavedAt(Date.now());
          },
          onError: () => {
            // keep in queue for retry
          },
        }
      );
    }, 600);
  };

  const setQuestionAnswer = (qid: string, ans: Record<string, unknown>) => {
    setAnswers((prev) => ({ ...prev, [qid]: ans }));
    queueSave(qid, ans);
  };

  // Safety net: flush on tab hide / page unload.
  // NOTE: async flushPending will not complete during pagehide/beforeunload —
  // persistQueue() synchronously mirrors the pending queue to localStorage so
  // a hard close / reload can replay on next mount.
  useEffect(() => {
    const onHide = () => {
      persistQueue();
      if (document.visibilityState === "hidden" || document.visibilityState === undefined) {
        // tab hidden but page may still be alive — try the network too
        void flushPending();
      }
    };
    const onUnload = () => { persistQueue(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onUnload);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onUnload);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [flushPending, persistQueue]);


  const prefillAnswerKey = async () => {
    if (!attemptId || !paper) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: rpcErr } = await (supabase as any).rpc("get_assessment_answer_key", {
        _assessment: paper.assessment.id,
      });
      if (rpcErr) throw rpcErr;
      const key = (data ?? {}) as Record<string, Record<string, unknown>>;
      const next: AnswerMap = { ...answers };
      for (const qq of flatQuestions) {
        if (key[qq.id]) next[qq.id] = key[qq.id];
      }
      setAnswers(next);
      for (const [qid, ans] of Object.entries(next)) {
        try { await saveAnswer.mutateAsync({ attempt_id: attemptId, question_id: qid, answer: ans }); }
        catch { /* noop */ }
      }
      toast.success("Answer key prefilled");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load answer key");
    }
  };

  // Re-exported pure helper, keeps the JSX below readable and lets us unit-test
  // answered-count semantics (including subjective-with-uploaded-pages) outside
  // of the Player.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isAnswered = (qq: PaperQuestion, a: Record<string, unknown> | undefined): boolean =>
    isAnsweredFn(qq, a);

  const totalQ = flatQuestions.length;
  const answeredCount = flatQuestions.filter((x) => isAnswered(x, answers[x.id])).length;
  const q = flatQuestions[idx];

  // Mark current as visited
  useEffect(() => {
    if (!q) return;
    setVisited((prev) => (prev.has(q.id) ? prev : new Set(prev).add(q.id)));
  }, [q]);

  const toggleFlag = useCallback(() => {
    if (!q) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  }, [q]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘/Ctrl+Enter — flush any pending saves now (Ctrl+S is blocked by proctoring)
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void flushPending();
        return;
      }
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const inEditor =
        tag === "input" || tag === "textarea" ||
        target?.isContentEditable || !!target?.closest(".monaco-editor");
      if (inEditor) return;
      if (e.key === "[" || e.key === "]") {
        setPaletteCollapsed((c) => !c);
        return;
      }
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setIdx((i) => Math.min(totalQ - 1, i + 1));
      else if (e.key === "f" || e.key === "F") toggleFlag();
      else if (q && (q.type === "mcq" || q.type === "true_false") && /^[1-9]$/.test(e.key)) {
        const opt = (q.options ?? [])[Number(e.key) - 1];
        if (!opt) return;
        if (q.type === "mcq") {
          const cur = new Set<string>(((answers[q.id]?.selected as string[]) ?? []));
          if (cur.has(opt.id)) cur.delete(opt.id);
          else cur.add(opt.id);
          setQuestionAnswer(q.id, { selected: Array.from(cur) });
        } else {
          setQuestionAnswer(q.id, { selected: [opt.id] });
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, totalQ, answers, toggleFlag, flushPending]);

  if (isLoading) return null;
  if (error)
    return (
      <div className="theme-b2b p-8 min-h-screen bg-background">
        Failed to load: {(error as Error).message}
      </div>
    );
  if (!paper) return null;

  if (paper.attempt.status !== "in_progress" || submitted) {
    return (
      <Submitted
        attempt={paper.attempt as any}
        assessment={paper.assessment as any}
        isPreview={isPreview}
      />
    );
  }

  // Lockdown gate — block the player until camera + fullscreen are granted.
  if (!lockdownReady && attemptId) {
    return (
      <AssessmentLockdownGate
        attemptId={attemptId}
        config={proctoringConfig}
        onReady={(s) => {
          setCamStream(s);
          setLockdownReady(true);
        }}
      />
    );
  }

  const isWideQuestion = q?.type === "coding" || q?.type === "sql";
  const isFlagged = q ? flagged.has(q.id) : false;
  const unansweredCount = totalQ - answeredCount;
  const flaggedCount = flagged.size;
  const paletteItems = flatQuestions.map((qq) => ({
    id: qq.id,
    title: qq.title,
    answered: isAnswered(qq, answers[qq.id]),
    flagged: flagged.has(qq.id),
    visited: visited.has(qq.id),
  }));

  // Group palette chips by section (preserving global order)
  const paletteSections = (() => {
    if (!paper) return undefined;
    const out: { title: string; indices: number[] }[] = [];
    let offset = 0;
    for (const s of paper.sections) {
      const count = s.questions.length;
      if (count === 0) continue;
      out.push({
        title: s.title ?? "",
        indices: Array.from({ length: count }, (_, i) => offset + i),
      });
      offset += count;
    }
    return out.length > 1 ? out : undefined;
  })();

  const totalDurationMs = paper.assessment.duration_min * 60_000;
  const goNext = () => setIdx((i) => Math.min(totalQ - 1, i + 1));
  const flagAndNext = () => { toggleFlag(); goNext(); };

  return (
    <div className="theme-b2b min-h-screen flex flex-col bg-background select-none">
      <PlayerTopBar
        title={paper.assessment.title}
        attemptId={attemptId}
        answered={answeredCount}
        flagged={flaggedCount}
        total={totalQ}
        remainingMs={remaining}
        deadlineMs={deadline}
        totalDurationMs={totalDurationMs}
        proctoring={proctoringEnabled}
        isPreview={isPreview}
        submitting={submitAttempt.isPending}
        online={online}
        onSubmit={() => setConfirmOpen(true)}
        onFullscreen={requestFullscreen}
        onPrefillKey={prefillAnswerKey}
        onShowInstructions={() => setInstructionsOpen(true)}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
      />

      <GeneralInstructionsDialog
        open={instructionsOpen}
        onOpenChange={setInstructionsOpen}
        assessmentTitle={paper.assessment.title}
        instructions={(paper.assessment as { instructions?: string | null }).instructions ?? null}
        durationMin={paper.assessment.duration_min}
        proctoring={proctoringEnabled}
      />

      <ViolationBanner
        violations={violations}
        max={maxViolations}
        fullscreenLost={fullscreenLost}
        onReturnFullscreen={requestFullscreen}
      />

      <main
        data-testid="player-main"
        data-question-type={q?.type ?? ""}
        data-palette-collapsed={paletteCollapsed ? "1" : "0"}
        className={getPlayerMainClass({ focusMode: false, paletteCollapsed, questionType: q?.type ?? null })}
      >
        {/* Mobile palette trigger */}
        <div className="lg:hidden">
          <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between h-10">
                <span className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Question {idx + 1} of {totalQ}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">{answeredCount}/{totalQ} done</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[340px] p-4">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <QuestionPalette
                  items={paletteItems}
                  currentIndex={idx}
                  sections={paletteSections}
                  onJump={(i) => { setIdx(i); setPaletteOpen(false); }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[5rem]">
            <QuestionPalette
              items={paletteItems}
              currentIndex={idx}
              sections={paletteSections}
              onJump={setIdx}
              collapsed={paletteCollapsed}
              onToggleCollapsed={() => setPaletteCollapsed((c) => !c)}
            />
          </div>
        </aside>

        <section className="min-w-0 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={q?.id ?? "empty"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {q ? (
                isWideQuestion ? (
                  q.type === "coding" ? (
                    <CodingQuestion
                      question={q}
                      value={answers[q.id]}
                      onChange={(v) => setQuestionAnswer(q.id, v)}
                      isPreview={isPreview}
                    />
                  ) : (
                    <SqlQuestion question={q} value={answers[q.id]} onChange={(v) => setQuestionAnswer(q.id, v)} />
                  )
                ) : (
                  <ChoiceQuestionCard
                    question={q}
                    index={idx}
                    total={totalQ}
                    value={answers[q.id]}
                    onChange={(v) => setQuestionAnswer(q.id, v)}
                    isFlagged={isFlagged}
                    onToggleFlag={toggleFlag}
                    attemptId={attemptId ?? null}
                  />
                )
              ) : (
                <Card>
                  <CardContent className="p-8 text-sm text-muted-foreground">
                    No questions in this assessment yet.
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      <PlayerBottomBar
        index={idx}
        total={totalQ}
        isFlagged={isFlagged}
        saving={saveAnswer.isPending}
        lastSavedAt={lastSavedAt}
        online={online}
        pendingCount={pendingCount}
        onPrev={() => setIdx((i) => Math.max(0, i - 1))}
        onNext={goNext}
        onToggleFlag={toggleFlag}
        onFlagAndNext={flagAndNext}
        onReviewSubmit={() => setConfirmOpen(true)}
      />

      {attemptId && camStream && (
        <WebcamPip
          attemptId={attemptId}
          stream={camStream}
          onLost={() => { void logProctorEvent("webcam_lost"); }}
        />
      )}

      {attemptId && !isPreview && (
        <AssessmentChatDock attemptId={attemptId} viewerRole="candidate" />
      )}


      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Submit your assessment?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-1">
                <p>Once submitted, you will not be able to change your answers.</p>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Answered" value={answeredCount} tone="emerald" icon={<CheckCircle2 className="h-3 w-3" />} />
                  <Stat label="Unanswered" value={unansweredCount} tone={unansweredCount > 0 ? "amber" : "muted"} />
                  <Stat label="Flagged" value={flaggedCount} tone={flaggedCount > 0 ? "amber" : "muted"} icon={<Flag className="h-3 w-3" />} />
                </div>
                {(unansweredCount > 0 || flaggedCount > 0) && (
                  <div className="space-y-2">
                    {unansweredCount > 0 && (
                      <ChipList
                        label="Unanswered"
                        questions={flatQuestions
                          .map((qq, i) => ({ i, answered: isAnswered(qq, answers[qq.id]) }))
                          .filter((x) => !x.answered)
                          .map((x) => x.i)}
                        tone="amber"
                        onJump={(i) => { setConfirmOpen(false); setIdx(i); }}
                      />
                    )}
                    {flaggedCount > 0 && (
                      <ChipList
                        label="Flagged"
                        questions={flatQuestions.map((qq, i) => ({ i, id: qq.id })).filter((x) => flagged.has(x.id)).map((x) => x.i)}
                        tone="amber"
                        onJump={(i) => { setConfirmOpen(false); setIdx(i); }}
                      />
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-primary to-primary/80"
              onClick={() => { setConfirmOpen(false); doSubmit(false); }}
            >
              Submit assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value, tone, icon }: { label: string; value: number; tone: "emerald" | "amber" | "muted"; icon?: React.ReactNode }) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : tone === "amber"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-border bg-muted/40 text-muted-foreground";
  return (
    <div className={cn("rounded-md border p-2 text-center", toneClass)}>
      <div className="text-lg font-bold tabular-nums leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wide mt-1 flex items-center justify-center gap-1">
        {icon}{label}
      </div>
    </div>
  );
}

function ChipList({ label, questions, tone, onJump }: {
  label: string; questions: number[]; tone: "amber"; onJump: (i: number) => void;
}) {
  if (questions.length === 0) return null;
  const toneClass = tone === "amber"
    ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
    : "";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 font-semibold">{label}</div>
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
        {questions.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            className={cn("h-7 min-w-[28px] px-1.5 rounded border text-[11px] font-semibold tabular-nums transition", toneClass)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoiceQuestionCard({
  question, index, total, value, onChange, isFlagged, onToggleFlag, attemptId,
}: {
  question: PaperQuestion;
  index: number; total: number;
  value: Record<string, unknown> | undefined;
  onChange: (v: Record<string, unknown>) => void;
  isFlagged: boolean;
  onToggleFlag: () => void;
  attemptId: string | null;
}) {
  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-muted/50 via-muted/20 to-transparent border-b border-border px-5 py-3.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="uppercase text-[10px] font-bold tracking-wider">
              {question.type.replace("_", " ")}
            </Badge>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              Question {index + 1} of {total} · {question.points} pts
            </span>
          </div>
          <Button
            size="sm" variant="ghost" onClick={onToggleFlag}
            className={cn(
              "h-7 px-2 text-[11px]",
              isFlagged && "text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/15"
            )}
          >
            <Flag className={cn("h-3 w-3 mr-1", isFlagged && "fill-current")} />
            {isFlagged ? "Flagged" : "Flag"}
          </Button>
        </div>
        <h2 className="text-base font-semibold leading-snug">{question.title}</h2>
        {question.body_md && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed mt-2">{question.body_md}</p>
        )}
      </div>
      <CardContent className="space-y-4 pt-5">
        <QuestionInput question={question} value={value} onChange={onChange} attemptId={attemptId} />
      </CardContent>
    </Card>
  );
}

function QuestionInput({
  question, value, onChange, attemptId,
}: {
  question: PaperQuestion;
  value: Record<string, unknown> | undefined;
  onChange: (v: Record<string, unknown>) => void;
  attemptId: string | null;
}) {
  if (question.type === "mcq") {
    const selected = new Set<string>(((value?.selected as string[]) ?? []));
    return (
      <div className="space-y-2">
        {(question.options ?? []).map((o, i) => {
          const checked = selected.has(o.id);
          const letter = String.fromCharCode(65 + i);
          return (
            <label
              key={o.id}
              className={cn(
                "flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-all group",
                checked
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/40 hover:-translate-y-px"
              )}
            >
              <span className={cn(
                "h-7 w-7 rounded-full grid place-items-center text-xs font-bold border shrink-0 transition-colors",
                checked
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted text-muted-foreground group-hover:border-primary/40 group-hover:text-foreground"
              )}>
                {checked ? <CheckCircle2 className="h-4 w-4" /> : letter}
              </span>
              <Checkbox
                className="sr-only"
                checked={checked}
                onCheckedChange={(c) => {
                  const next = new Set(selected);
                  if (c) next.add(o.id);
                  else next.delete(o.id);
                  onChange({ selected: Array.from(next) });
                }}
              />
              <div className="flex-1 min-w-0 pt-0.5">
                <span className="text-sm leading-relaxed">{o.body}</span>
              </div>
            </label>
          );
        })}
        <p className="text-[10px] text-muted-foreground pt-1">
          Press <kbd className="px-1 py-0.5 rounded border border-border bg-muted font-mono">1</kbd>–
          <kbd className="px-1 py-0.5 rounded border border-border bg-muted font-mono">9</kbd> to toggle options
        </p>
      </div>
    );
  }
  if (question.type === "subjective") {
    const text = (value?.text as string) ?? "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const pages = Array.isArray(value?.pages) ? (value!.pages as Array<{ id: string }>) : [];
    return (
      <div className="space-y-3">
        <Textarea
          rows={10}
          placeholder="Type your answer here…"
          value={text}
          onChange={(e) => onChange({ ...(value ?? {}), text: e.target.value })}
          className="resize-y min-h-[220px] text-sm leading-relaxed"
        />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>{words} {words === 1 ? "word" : "words"}</span>
          <span>{text.length} characters</span>
        </div>
        {attemptId && (
          <AnswerUploadTile
            attemptId={attemptId}
            questionId={question.id}
            onPagesChange={(next) =>
              onChange({
                ...(value ?? {}),
                pages: next.map((p) => ({ id: p.id, ordinal: p.ordinal, storage_path: p.storage_path })),
              })
            }
          />
        )}
        {pages.length > 0 && (
          <p className="text-[10px] text-emerald-600">
            {pages.length} uploaded page{pages.length === 1 ? "" : "s"} attached to this answer.
          </p>
        )}
      </div>
    );
  }
  if (question.type === "true_false") {
    const selected = ((value?.selected as string[]) ?? [])[0] ?? "";
    return (
      <RadioGroup value={selected} onValueChange={(v) => onChange({ selected: [v] })} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(question.options ?? []).map((o, i) => {
          const active = selected === o.id;
          return (
            <label
              key={o.id}
              htmlFor={`tf-${o.id}`}
              className={cn(
                "flex items-center gap-3 p-3.5 border rounded-lg cursor-pointer transition-all",
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/40"
              )}
            >
              <RadioGroupItem id={`tf-${o.id}`} value={o.id} className="sr-only" />
              <span className={cn(
                "h-6 w-6 rounded-full grid place-items-center text-[10px] font-bold border shrink-0",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted text-muted-foreground"
              )}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm font-medium">{o.body}</span>
            </label>
          );
        })}
      </RadioGroup>
    );
  }
  if (question.type === "short_answer") {
    const maxLen = Number((question.meta as Record<string, unknown> | null)?.max_length) || 200;
    const text = (value?.text as string) ?? "";
    return (
      <div className="space-y-1.5">
        <Input
          maxLength={maxLen}
          placeholder="Type your answer…"
          value={text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="h-11 text-sm"
        />
        <p className="text-[11px] text-muted-foreground tabular-nums text-right">
          {text.length} / {maxLen}
        </p>
      </div>
    );
  }
  if (question.type === "matching") {
    return <MatchingInput question={question} value={value} onChange={onChange} />;
  }
  return null;
}

function MatchingInput({
  question, value, onChange,
}: {
  question: PaperQuestion;
  value: Record<string, unknown> | undefined;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const meta = (question.meta as { pairs?: { left: string; right: string }[] } | null) ?? {};
  const pairs = meta.pairs ?? [];
  const lefts = pairs.map((p) => p.left);
  const rights = Array.from(new Set(pairs.map((p) => p.right)));
  const current = (value?.pairs as Record<string, string>) ?? {};

  const shuffledRights = useMemo(() => {
    const arr = [...rights];
    let seed = 0;
    for (let i = 0; i < question.id.length; i++) seed = (seed * 31 + question.id.charCodeAt(i)) >>> 0;
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const j = seed % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const palette = ["sky", "emerald", "amber", "violet", "rose", "cyan", "lime", "fuchsia"] as const;
  const colorFor = (left: string) => palette[lefts.indexOf(left) % palette.length];
  const colorClasses: Record<string, string> = {
    sky: "border-sky-500/60 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    emerald: "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    amber: "border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    violet: "border-violet-500/60 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    rose: "border-rose-500/60 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    cyan: "border-cyan-500/60 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    lime: "border-lime-500/60 bg-lime-500/10 text-lime-700 dark:text-lime-300",
    fuchsia: "border-fuchsia-500/60 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
  };

  const rightToLeft = (right: string): string | null => {
    for (const [l, r] of Object.entries(current)) if (r === right) return l;
    return null;
  };

  const setPair = (left: string, right: string | null) => {
    const next = { ...current };
    if (right !== null) {
      for (const [l, r] of Object.entries(next)) if (r === right) delete next[l];
      next[left] = right;
    } else {
      delete next[left];
    }
    onChange({ pairs: next });
  };

  const onLeftClick = (left: string) => setSelectedLeft((s) => (s === left ? null : left));
  const onRightClick = (right: string) => {
    const owner = rightToLeft(right);
    if (selectedLeft) { setPair(selectedLeft, right); setSelectedLeft(null); return; }
    if (owner) setPair(owner, null);
  };

  const matchedCount = Object.values(current).filter((v) => v && rights.includes(v)).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {selectedLeft
            ? `Now click a match on the right for "${selectedLeft}"`
            : "Click an item on the left, then click its match on the right."}
        </span>
        <div className="flex items-center gap-3">
          <span className="tabular-nums">{matchedCount} / {lefts.length} matched</span>
          {matchedCount > 0 && (
            <button type="button" onClick={() => onChange({ pairs: {} })} className="underline hover:text-foreground">
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {lefts.map((left) => {
            const paired = current[left];
            const color = colorFor(left);
            const isSelected = selectedLeft === left;
            return (
              <button
                key={left} type="button" onClick={() => onLeftClick(left)}
                className={cn(
                  "w-full text-left text-sm px-3 py-2.5 rounded-md border transition flex items-center justify-between gap-2",
                  isSelected
                    ? "border-primary ring-2 ring-primary/40 bg-primary/5"
                    : paired
                    ? colorClasses[color]
                    : "border-border bg-muted hover:bg-accent"
                )}
              >
                <span className="font-medium truncate">{left}</span>
                {paired && <span className="text-[10px] uppercase tracking-wide opacity-80 shrink-0">→ {paired}</span>}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {shuffledRights.map((right) => {
            const owner = rightToLeft(right);
            const color = owner ? colorFor(owner) : null;
            return (
              <button
                key={right} type="button" onClick={() => onRightClick(right)}
                className={cn(
                  "w-full text-left text-sm px-3 py-2.5 rounded-md border transition flex items-center justify-between gap-2",
                  color ? colorClasses[color] : "border-border bg-muted hover:bg-accent",
                  selectedLeft && !owner && "ring-1 ring-primary/40"
                )}
              >
                <span className="font-medium truncate">{right}</span>
                {owner && <span className="text-[10px] uppercase tracking-wide opacity-80 shrink-0">{owner} ←</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
