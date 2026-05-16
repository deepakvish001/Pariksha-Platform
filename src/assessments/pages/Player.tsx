import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { ChevronLeft, ChevronRight, CheckCircle2, Flag } from "lucide-react";
import { usePaper, useExistingAnswers, useSaveAnswer, useSubmitAttempt, type PaperQuestion } from "../hooks/usePaper";
import { useProctoring } from "../hooks/useProctoring";
import { supabase } from "@/integrations/supabase/client";
import { PlayerTopBar } from "../components/PlayerTopBar";
import { QuestionPalette } from "../components/QuestionPalette";
import { CodingQuestion } from "../components/CodingQuestion";
import { SqlQuestion } from "../components/SqlQuestion";
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
  const proctoringEnabled = !!paper?.assessment.proctoring_enabled && paper?.attempt.status === "in_progress";
  const { requestFullscreen } = useProctoring(attemptId, proctoringEnabled);

  const flatQuestions = useMemo<PaperQuestion[]>(
    () => (paper?.sections ?? []).flatMap((s) => s.questions),
    [paper]
  );

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [idx, setIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Hydrate from existing answers
  useEffect(() => {
    if (!existing) return;
    const map: AnswerMap = {};
    for (const a of existing) map[a.question_id] = (a.answer as Record<string, unknown>) ?? {};
    setAnswers((prev) => ({ ...map, ...prev }));
  }, [existing]);

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
        } catch {
          /* noop */
        }
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

  // Auto-submit on timer end
  useEffect(() => {
    if (deadline && remaining === 0 && !submittedRef.current && paper && paper.attempt.status === "in_progress") {
      submittedRef.current = true;
      doSubmit(true);
    }
  }, [remaining, deadline, paper, doSubmit]);

  // Debounced autosave
  const debounceRef = useRef<Record<string, number>>({});
  const queueSave = (qid: string, ans: Record<string, unknown>) => {
    if (!attemptId) return;
    window.clearTimeout(debounceRef.current[qid]);
    debounceRef.current[qid] = window.setTimeout(() => {
      saveAnswer.mutate(
        { attempt_id: attemptId, question_id: qid, answer: ans },
        { onSuccess: () => setLastSavedAt(Date.now()) }
      );
    }, 600);
  };

  const setQuestionAnswer = (qid: string, ans: Record<string, unknown>) => {
    setAnswers((prev) => ({ ...prev, [qid]: ans }));
    queueSave(qid, ans);
  };

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
        try {
          await saveAnswer.mutateAsync({ attempt_id: attemptId, question_id: qid, answer: ans });
        } catch {
          /* noop */
        }
      }
      toast.success("Answer key prefilled");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load answer key");
    }
  };

  const isAnswered = (qq: PaperQuestion, a: Record<string, unknown> | undefined): boolean => {
    if (!a) return false;
    if (qq.type === "mcq" || qq.type === "true_false")
      return Array.isArray(a.selected) && (a.selected as string[]).length > 0;
    if (qq.type === "subjective") return typeof a.text === "string" && (a.text as string).trim().length > 0;
    if (qq.type === "short_answer") return typeof a.text === "string" && (a.text as string).trim().length > 0;
    if (qq.type === "sql") return typeof a.query === "string" && (a.query as string).trim().length > 0;
    if (qq.type === "coding") return typeof a.code === "string" && (a.code as string).trim().length > 0;
    if (qq.type === "matching") {
      const pairs = (a.pairs as Record<string, string>) ?? {};
      return Object.values(pairs).some((v) => v && v.trim().length > 0);
    }
    return false;
  };

  const totalQ = flatQuestions.length;
  const answeredCount = flatQuestions.filter((x) => isAnswered(x, answers[x.id])).length;
  const q = flatQuestions[idx];

  // Keyboard shortcuts (skip when typing in inputs / monaco)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const inEditor =
        tag === "input" ||
        tag === "textarea" ||
        target?.isContentEditable ||
        !!target?.closest(".monaco-editor");
      if (inEditor) return;
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setIdx((i) => Math.min(totalQ - 1, i + 1));
      else if (e.key === "f" || e.key === "F") {
        if (!q) return;
        setFlagged((prev) => {
          const next = new Set(prev);
          if (next.has(q.id)) next.delete(q.id);
          else next.add(q.id);
          return next;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [q, totalQ]);

  if (isLoading) return null;
  if (error)
    return (
      <div className="theme-b2b p-8 min-h-screen bg-[hsl(var(--background))]">
        Failed to load: {(error as Error).message}
      </div>
    );
  if (!paper) return null;

  if (paper.attempt.status !== "in_progress" || submitted) {
    const assessmentId = paper.assessment.id;
    return (
      <div className="theme-b2b min-h-screen grid place-items-center p-8 bg-[hsl(var(--background))]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Submitted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Your responses have been recorded.{!isPreview && " The recruiter will review your attempt."}
            </p>
            {typeof paper.attempt.score === "number" && (
              <p>
                Auto-graded score: <b className="text-foreground">{paper.attempt.score}</b>
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {isPreview && (
                <Button onClick={() => navigate(`/b2b/assessments/${assessmentId}/attempts/${attemptId}`)}>
                  View grading & feedback
                </Button>
              )}
              <Button
                variant={isPreview ? "outline" : "default"}
                onClick={() => navigate(isPreview ? `/b2b/assessments/${assessmentId}` : "/assessments")}
              >
                {isPreview ? "Back to assessment" : "Back to my assessments"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isWideQuestion = q?.type === "coding" || q?.type === "sql";
  const isFlagged = q ? flagged.has(q.id) : false;
  const unansweredCount = totalQ - answeredCount;
  const flaggedCount = flagged.size;

  return (
    <div className="theme-b2b min-h-screen bg-[hsl(var(--background))] flex flex-col">
      <PlayerTopBar
        title={paper.assessment.title}
        answered={answeredCount}
        total={totalQ}
        remainingMs={remaining}
        proctoring={proctoringEnabled}
        isPreview={isPreview}
        submitting={submitAttempt.isPending}
        onSubmit={() => setConfirmOpen(true)}
        onFullscreen={requestFullscreen}
        onPrefillKey={prefillAnswerKey}
      />

      <main
        className={cn(
          "flex-1 w-full mx-auto px-3 sm:px-5 py-4 grid gap-4",
          isWideQuestion ? "max-w-[1600px] md:grid-cols-[220px_1fr]" : "max-w-6xl md:grid-cols-[220px_1fr]"
        )}
      >
        <aside className="hidden md:block">
          <div className="sticky top-[5rem]">
            <QuestionPalette
              items={flatQuestions.map((qq) => ({
                id: qq.id,
                answered: isAnswered(qq, answers[qq.id]),
                flagged: flagged.has(qq.id),
              }))}
              currentIndex={idx}
              onJump={setIdx}
            />
          </div>
        </aside>

        <section className="min-w-0">
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
              <Card className="overflow-hidden">
                <CardHeader className="bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))]">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="uppercase text-[10px]">
                      {q.type.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Q {idx + 1} of {totalQ} · {q.points} pts
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-2">{q.title}</CardTitle>
                  {q.body_md && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{q.body_md}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 pt-5">
                  <QuestionInput
                    question={q}
                    value={answers[q.id]}
                    onChange={(v) => setQuestionAnswer(q.id, v)}
                  />
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="p-8 text-sm text-muted-foreground">
                No questions in this assessment yet.
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      {/* Sticky bottom bar */}
      <footer className="sticky bottom-0 z-30 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--card))]/80">
        <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={idx === 0}
            onClick={() => setIdx((i) => i - 1)}
            className="h-8"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <Button
              variant={isFlagged ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (!q) return;
                setFlagged((prev) => {
                  const next = new Set(prev);
                  if (next.has(q.id)) next.delete(q.id);
                  else next.add(q.id);
                  return next;
                });
              }}
              className={cn(
                "h-8",
                isFlagged && "bg-amber-500 hover:bg-amber-500/90 text-white border-amber-500"
              )}
            >
              <Flag className={cn("h-3.5 w-3.5 mr-1.5", isFlagged && "fill-current")} />
              {isFlagged ? "Flagged" : "Flag"}
            </Button>
            <span className="text-muted-foreground hidden sm:inline tabular-nums">
              {lastSavedAt
                ? `Saved · ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Autosaving"}
            </span>
          </div>
          <Button
            size="sm"
            disabled={idx >= totalQ - 1}
            onClick={() => setIdx((i) => i + 1)}
            className="h-8"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </footer>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your assessment?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Once submitted, you will not be able to change your answers.</p>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Stat label="Answered" value={answeredCount} tone="emerald" />
                  <Stat label="Unanswered" value={unansweredCount} tone={unansweredCount > 0 ? "amber" : "muted"} />
                  <Stat label="Flagged" value={flaggedCount} tone={flaggedCount > 0 ? "amber" : "muted"} />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                doSubmit(false);
              }}
            >
              Submit now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "muted" }) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : tone === "amber"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 text-muted-foreground";
  return (
    <div className={cn("rounded-md border p-2 text-center", toneClass)}>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide">{label}</div>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: PaperQuestion;
  value: Record<string, unknown> | undefined;
  onChange: (v: Record<string, unknown>) => void;
}) {
  if (question.type === "mcq") {
    const selected = new Set<string>(((value?.selected as string[]) ?? []));
    return (
      <div className="space-y-2">
        {(question.options ?? []).map((o, i) => {
          const checked = selected.has(o.id);
          return (
            <label
              key={o.id}
              className={cn(
                "flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition group",
                checked
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-[hsl(var(--border))] hover:border-primary/40 hover:bg-[hsl(var(--muted))]/40"
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(c) => {
                  const next = new Set(selected);
                  if (c) next.add(o.id);
                  else next.delete(o.id);
                  onChange({ selected: Array.from(next) });
                }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm leading-relaxed">{o.body}</span>
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums opacity-60 group-hover:opacity-100">
                {String.fromCharCode(65 + i)}
              </span>
            </label>
          );
        })}
      </div>
    );
  }
  if (question.type === "subjective") {
    const text = (value?.text as string) ?? "";
    return (
      <div className="space-y-1.5">
        <Textarea
          rows={10}
          placeholder="Type your answer here…"
          value={text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="resize-y"
        />
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {text.trim().split(/\s+/).filter(Boolean).length} words · {text.length} chars
        </p>
      </div>
    );
  }
  if (question.type === "true_false") {
    const selected = ((value?.selected as string[]) ?? [])[0] ?? "";
    return (
      <RadioGroup
        value={selected}
        onValueChange={(v) => onChange({ selected: [v] })}
        className="space-y-2"
      >
        {(question.options ?? []).map((o) => {
          const active = selected === o.id;
          return (
            <label
              key={o.id}
              htmlFor={`tf-${o.id}`}
              className={cn(
                "flex items-center gap-3 p-3.5 border rounded-lg cursor-pointer transition",
                active
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-[hsl(var(--border))] hover:border-primary/40 hover:bg-[hsl(var(--muted))]/40"
              )}
            >
              <RadioGroupItem id={`tf-${o.id}`} value={o.id} />
              <span className="text-sm">{o.body}</span>
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
  // fallback (coding/sql handled by parent in wide layout)
  return null;
}

function MatchingInput({
  question,
  value,
  onChange,
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
    if (selectedLeft) {
      setPair(selectedLeft, right);
      setSelectedLeft(null);
      return;
    }
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
          <span>
            {matchedCount} / {lefts.length} matched
          </span>
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
                key={left}
                type="button"
                onClick={() => onLeftClick(left)}
                className={cn(
                  "w-full text-left text-sm px-3 py-2 rounded-md border transition flex items-center justify-between gap-2",
                  isSelected
                    ? "border-primary ring-2 ring-primary/40 bg-primary/5"
                    : paired
                    ? colorClasses[color]
                    : "border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))]"
                )}
              >
                <span className="font-medium truncate">{left}</span>
                {paired && (
                  <span className="text-[10px] uppercase tracking-wide opacity-80 shrink-0">→ {paired}</span>
                )}
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
                key={right}
                type="button"
                onClick={() => onRightClick(right)}
                className={cn(
                  "w-full text-left text-sm px-3 py-2 rounded-md border transition flex items-center justify-between gap-2",
                  color ? colorClasses[color] : "border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))]",
                  selectedLeft && !owner && "ring-1 ring-primary/40"
                )}
              >
                <span className="font-medium truncate">{right}</span>
                {owner && (
                  <span className="text-[10px] uppercase tracking-wide opacity-80 shrink-0">{owner} ←</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
