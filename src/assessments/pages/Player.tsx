import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Clock, Send, ChevronLeft, ChevronRight, CheckCircle2, ShieldCheck, Maximize2, Wand2 } from "lucide-react";
import { usePaper, useExistingAnswers, useSaveAnswer, useSubmitAttempt, type PaperQuestion } from "../hooks/usePaper";
import { useProctoring } from "../hooks/useProctoring";
import { supabase } from "@/integrations/supabase/client";

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
  const proctoringEnabled = !!paper?.assessment.proctoring_enabled && paper.attempt.status === "in_progress";
  const { requestFullscreen } = useProctoring(attemptId, proctoringEnabled);

  const flatQuestions = useMemo<PaperQuestion[]>(
    () => (paper?.sections ?? []).flatMap((s) => s.questions),
    [paper]
  );

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [idx, setIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Hydrate from existing answers
  useEffect(() => {
    if (!existing) return;
    const map: AnswerMap = {};
    for (const a of existing) map[a.question_id] = (a.answer as Record<string, unknown>) ?? {};
    setAnswers((prev) => ({ ...map, ...prev }));
  }, [existing]);

  // Timer — based on assessment duration and started_at
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

  // Auto-submit
  const submittedRef = useRef(false);
  useEffect(() => {
    if (deadline && remaining === 0 && !submittedRef.current && paper && paper.attempt.status === "in_progress") {
      submittedRef.current = true;
      doSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, deadline, paper]);

  // Debounced autosave
  const debounceRef = useRef<Record<string, number>>({});
  const queueSave = (qid: string, ans: Record<string, unknown>) => {
    if (!attemptId) return;
    window.clearTimeout(debounceRef.current[qid]);
    debounceRef.current[qid] = window.setTimeout(() => {
      saveAnswer.mutate({ attempt_id: attemptId, question_id: qid, answer: ans });
    }, 600);
  };

  const setQuestionAnswer = (qid: string, ans: Record<string, unknown>) => {
    setAnswers((prev) => ({ ...prev, [qid]: ans }));
    queueSave(qid, ans);
  };

  const doSubmit = async (auto = false) => {
    if (!attemptId) return;
    // flush pending saves
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
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to submit");
    }
  };

  const prefillAnswerKey = async () => {
    if (!attemptId || !paper) return;
    try {
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
      // Persist each immediately
      for (const [qid, ans] of Object.entries(next)) {
        try {
          await saveAnswer.mutateAsync({ attempt_id: attemptId, question_id: qid, answer: ans });
        } catch { /* noop */ }
      }
      toast.success("Answer key prefilled");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load answer key");
    }
  };

  if (isLoading) return null;
  if (error) return <div className="theme-b2b p-8 min-h-screen">Failed to load: {(error as Error).message}</div>;
  if (!paper) return null;

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

  if (paper.attempt.status !== "in_progress" || submitted) {
    const assessmentId = paper.assessment.id;
    return (
      <div className="theme-b2b min-h-screen grid place-items-center p-8 bg-[hsl(var(--background))]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /> Submitted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Your responses have been recorded.{!isPreview && " The recruiter will review your attempt."}</p>
            {typeof paper.attempt.score === "number" && (
              <p>Auto-graded score: <b className="text-foreground">{paper.attempt.score}</b></p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {isPreview && (
                <Button onClick={() => navigate(`/b2b/assessments/${assessmentId}/attempts/${attemptId}`)}>
                  View grading & feedback
                </Button>
              )}
              <Button variant={isPreview ? "outline" : "default"} onClick={() => navigate(isPreview ? `/b2b/assessments/${assessmentId}` : "/assessments")}>
                {isPreview ? "Back to assessment" : "Back to my assessments"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const q = flatQuestions[idx];
  const totalQ = flatQuestions.length;
  const answeredCount = flatQuestions.filter((x) => isAnswered(x, answers[x.id])).length;

  const mins = Math.floor(remaining / 60_000);
  const secs = Math.floor((remaining % 60_000) / 1000);

  return (
    <div className="theme-b2b min-h-screen bg-[hsl(var(--background))]">
      {/* Top bar */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">{paper.assessment.title}</h1>
            <p className="text-xs text-muted-foreground">{answeredCount} / {totalQ} answered</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {proctoringEnabled && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                <ShieldCheck className="h-3.5 w-3.5" /> Proctored
              </div>
            )}
            {proctoringEnabled && (
              <Button size="sm" variant="outline" onClick={requestFullscreen} title="Enter fullscreen">
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[hsl(var(--muted))] text-sm font-mono">
              <Clock className="h-4 w-4" />
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <Button size="sm" onClick={() => doSubmit(false)} disabled={submitAttempt.isPending}>
              <Send className="h-4 w-4 mr-1" /> Submit
            </Button>
            {isPreview && (
              <Button size="sm" variant="outline" onClick={prefillAnswerKey} title="Prefill correct answers">
                <Wand2 className="h-4 w-4 mr-1" /> Prefill key
              </Button>
            )}
          </div>
        </div>
        <Progress value={(answeredCount / Math.max(1, totalQ)) * 100} className="h-1 rounded-none" />
      </header>

      <main className="max-w-6xl mx-auto p-4 grid md:grid-cols-[220px_1fr] gap-4">
        {/* Question palette */}
        <aside className="hidden md:block">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Questions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-5 gap-2">
              {flatQuestions.map((qi, i) => {
                const a = answers[qi.id];
                const done = isAnswered(qi, a);
                return (
                  <button
                    key={qi.id}
                    onClick={() => setIdx(i)}
                    className={`h-8 w-8 rounded text-xs font-medium border transition ${
                      i === idx
                        ? "bg-primary text-primary-foreground border-primary"
                        : done
                        ? "bg-green-500/15 border-green-500/40 text-green-700 dark:text-green-400"
                        : "bg-[hsl(var(--muted))] border-[hsl(var(--border))]"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </aside>

        {/* Active question */}
        <section>
          {q ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="uppercase">{q.type}</Badge>
                  <span className="text-xs text-muted-foreground">Q {idx + 1} of {totalQ} · {q.points} pts</span>
                </div>
                <CardTitle className="text-lg mt-2">{q.title}</CardTitle>
                {q.body_md && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{q.body_md}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <QuestionInput question={q} value={answers[q.id]} onChange={(v) => setQuestionAnswer(q.id, v)} />

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" size="sm" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button size="sm" disabled={idx >= totalQ - 1} onClick={() => setIdx((i) => i + 1)}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="p-8 text-sm text-muted-foreground">No questions in this assessment yet.</CardContent></Card>
          )}
        </section>
      </main>
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
        {(question.options ?? []).map((o) => (
          <label
            key={o.id}
            className="flex items-start gap-3 p-3 border border-[hsl(var(--border))] rounded-md cursor-pointer hover:bg-[hsl(var(--muted))]"
          >
            <Checkbox
              checked={selected.has(o.id)}
              onCheckedChange={(checked) => {
                const next = new Set(selected);
                if (checked) next.add(o.id); else next.delete(o.id);
                onChange({ selected: Array.from(next) });
              }}
            />
            <span className="text-sm">{o.body}</span>
          </label>
        ))}
      </div>
    );
  }
  if (question.type === "subjective") {
    return (
      <Textarea
        rows={10}
        placeholder="Type your answer here…"
        value={(value?.text as string) ?? ""}
        onChange={(e) => onChange({ text: e.target.value })}
      />
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
        {(question.options ?? []).map((o) => (
          <label
            key={o.id}
            htmlFor={`tf-${o.id}`}
            className="flex items-center gap-3 p-3 border border-[hsl(var(--border))] rounded-md cursor-pointer hover:bg-[hsl(var(--muted))]"
          >
            <RadioGroupItem id={`tf-${o.id}`} value={o.id} />
            <span className="text-sm">{o.body}</span>
          </label>
        ))}
      </RadioGroup>
    );
  }
  if (question.type === "short_answer") {
    const maxLen = Number((question.meta as Record<string, unknown> | null)?.max_length) || 200;
    return (
      <Input
        maxLength={maxLen}
        placeholder="Type your answer…"
        value={(value?.text as string) ?? ""}
        onChange={(e) => onChange({ text: e.target.value })}
      />
    );
  }
  if (question.type === "matching") {
    return <MatchingInput question={question} value={value} onChange={onChange} />;
  }
  if (question.type === "sql") {
    return (
      <div className="space-y-2">
        <Textarea
          rows={8}
          className="font-mono text-sm"
          placeholder="-- Write your SQL query"
          value={(value?.query as string) ?? ""}
          onChange={(e) => onChange({ ...(value ?? {}), query: e.target.value })}
        />
        <Textarea
          rows={4}
          className="font-mono text-sm"
          placeholder="Paste the output your query produces (used for auto-grading)"
          value={(value?.output as string) ?? ""}
          onChange={(e) => onChange({ ...(value ?? {}), output: e.target.value })}
        />
        {question.sample_tests && question.sample_tests.length > 0 && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Sample expected output</summary>
            <pre className="mt-2 p-2 bg-[hsl(var(--muted))] rounded">{question.sample_tests[0].expected_output}</pre>
          </details>
        )}
      </div>
    );
  }
  // coding
  return (
    <div className="space-y-2">
      {question.language && (
        <Badge variant="secondary" className="text-xs">{question.language}</Badge>
      )}
      <Textarea
        rows={14}
        className="font-mono text-sm"
        placeholder={question.starter_code ?? "// Write your solution"}
        value={(value?.code as string) ?? question.starter_code ?? ""}
        onChange={(e) => onChange({ code: e.target.value, language: question.language })}
      />
      {question.sample_tests && question.sample_tests.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Sample tests</p>
          {question.sample_tests.map((t, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">Input</p>
                <pre className="p-2 bg-[hsl(var(--muted))] rounded whitespace-pre-wrap">{t.input}</pre>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Expected</p>
                <pre className="p-2 bg-[hsl(var(--muted))] rounded whitespace-pre-wrap">{t.expected_output}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Code submissions are queued for review. Automated grading for coding will arrive in a later step.
      </p>
    </div>
  );
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

  // Stable shuffle of rights keyed off the question id
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
          <span>{matchedCount} / {lefts.length} matched</span>
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
                className={`w-full text-left text-sm px-3 py-2 rounded-md border transition flex items-center justify-between gap-2 ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/40 bg-primary/5"
                    : paired
                    ? colorClasses[color]
                    : "border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))]"
                }`}
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
                className={`w-full text-left text-sm px-3 py-2 rounded-md border transition flex items-center justify-between gap-2 ${
                  color
                    ? colorClasses[color]
                    : "border-[hsl(var(--border))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))]"
                } ${selectedLeft && !owner ? "ring-1 ring-primary/40" : ""}`}
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
