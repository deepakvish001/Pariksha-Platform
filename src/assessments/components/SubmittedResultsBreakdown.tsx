import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  Clock,
  HelpCircle,
  Loader2,
  MessageSquareQuote,
  Minus,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type ResultOption = {
  id: string;
  body: string;
  is_correct: boolean;
  order_index: number;
};

type QuestionResult = {
  question_id: string;
  type:
    | "mcq"
    | "true_false"
    | "short_answer"
    | "matching"
    | "sql"
    | "coding"
    | "subjective";
  title: string;
  body_md: string | null;
  points: number;
  meta: Record<string, unknown> | null;
  order_index: number;
  section_id: string;
  section_title: string;
  section_order: number;
  answer: Record<string, unknown> | null;
  auto_score: number | null;
  manual_score: number | null;
  grader_comment: string | null;
  options: ResultOption[] | null;
  expected_output: string | null;
};

type ResultsPayload = {
  attempt_id: string;
  status: string;
  score: number | null;
  results: QuestionResult[];
};

type Verdict = "correct" | "incorrect" | "partial" | "pending" | "unanswered";

function verdictFor(r: QuestionResult): { verdict: Verdict; awarded: number | null } {
  const awarded =
    typeof r.manual_score === "number"
      ? r.manual_score
      : typeof r.auto_score === "number"
      ? r.auto_score
      : null;

  const answered = isAnswered(r);
  if (!answered) return { verdict: "unanswered", awarded };

  if (r.type === "coding" || r.type === "subjective") {
    if (typeof r.manual_score !== "number") return { verdict: "pending", awarded };
    if (r.manual_score >= r.points) return { verdict: "correct", awarded };
    if (r.manual_score > 0) return { verdict: "partial", awarded };
    return { verdict: "incorrect", awarded };
  }

  if (awarded === null) return { verdict: "pending", awarded };
  if (awarded >= r.points) return { verdict: "correct", awarded };
  if (awarded > 0) return { verdict: "partial", awarded };
  return { verdict: "incorrect", awarded };
}

function isAnswered(r: QuestionResult): boolean {
  const a = r.answer;
  if (!a || typeof a !== "object") return false;
  switch (r.type) {
    case "mcq":
    case "true_false": {
      const selected = (a as { selected?: string[] }).selected;
      return Array.isArray(selected) && selected.length > 0;
    }
    case "short_answer":
      return typeof (a as { text?: string }).text === "string" && (a as { text: string }).text.trim() !== "";
    case "sql":
      return typeof (a as { sql?: string }).sql === "string" && (a as { sql: string }).sql.trim() !== "";
    case "coding":
      return typeof (a as { code?: string }).code === "string" && (a as { code: string }).code.trim() !== "";
    case "subjective":
      return typeof (a as { text?: string }).text === "string" && (a as { text: string }).text.trim() !== "";
    case "matching": {
      const pairs = (a as { pairs?: Record<string, string> }).pairs;
      return !!pairs && Object.keys(pairs).length > 0;
    }
    default:
      return Object.keys(a).length > 0;
  }
}

const VERDICT_META: Record<Verdict, { label: string; icon: typeof CheckCircle2; cls: string; bar: string }> = {
  correct: {
    label: "Correct",
    icon: CheckCircle2,
    cls: "text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    bar: "bg-emerald-500",
  },
  partial: {
    label: "Partial",
    icon: Minus,
    cls: "text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10",
    bar: "bg-amber-500",
  },
  incorrect: {
    label: "Incorrect",
    icon: XCircle,
    cls: "text-rose-600 dark:text-rose-400 border-rose-500/40 bg-rose-500/10",
    bar: "bg-rose-500",
  },
  pending: {
    label: "Awaiting review",
    icon: Clock,
    cls: "text-sky-600 dark:text-sky-400 border-sky-500/40 bg-sky-500/10",
    bar: "bg-sky-500",
  },
  unanswered: {
    label: "Unanswered",
    icon: HelpCircle,
    cls: "text-muted-foreground border-border bg-muted/40",
    bar: "bg-muted-foreground/40",
  },
};

const QUESTION_TYPE_LABEL: Record<QuestionResult["type"], string> = {
  mcq: "Multiple choice",
  true_false: "True / False",
  short_answer: "Short answer",
  matching: "Matching",
  sql: "SQL",
  coding: "Coding",
  subjective: "Subjective",
};

function formatAnswer(r: QuestionResult): string {
  const a = r.answer;
  if (!isAnswered(r)) return "—";
  switch (r.type) {
    case "mcq":
    case "true_false": {
      const ids = ((a as { selected?: string[] }).selected ?? []) as string[];
      const labels = (r.options ?? [])
        .filter((o) => ids.includes(o.id))
        .map((o) => o.body);
      return labels.length ? labels.join(", ") : "—";
    }
    case "short_answer":
      return ((a as { text?: string }).text ?? "").trim() || "—";
    case "sql":
      return ((a as { sql?: string }).sql ?? "").trim() || "—";
    case "coding":
      return ((a as { code?: string }).code ?? "").trim() || "—";
    case "subjective":
      return ((a as { text?: string }).text ?? "").trim() || "—";
    case "matching": {
      const pairs = (a as { pairs?: Record<string, string> }).pairs ?? {};
      return Object.entries(pairs)
        .map(([k, v]) => `${k} → ${v}`)
        .join("\n");
    }
    default:
      return "—";
  }
}

function formatExpected(r: QuestionResult): string | null {
  switch (r.type) {
    case "mcq":
    case "true_false": {
      const labels = (r.options ?? []).filter((o) => o.is_correct).map((o) => o.body);
      return labels.length ? labels.join(", ") : null;
    }
    case "short_answer": {
      const accepted = (r.meta?.accepted as string[] | undefined) ?? [];
      return accepted.length ? accepted.join(" / ") : null;
    }
    case "sql":
      return r.expected_output;
    case "matching": {
      const pairs = (r.meta?.pairs as { left: string; right: string }[] | undefined) ?? [];
      return pairs.length ? pairs.map((p) => `${p.left} → ${p.right}`).join("\n") : null;
    }
    case "coding":
    case "subjective":
      return null;
    default:
      return null;
  }
}

function useAttemptResults(attemptId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["attempt-results", attemptId],
    enabled: enabled && !!attemptId,
    queryFn: async (): Promise<ResultsPayload> => {
      const { data, error } = await supabase.rpc("get_attempt_results", { _attempt: attemptId });
      if (error) throw error;
      return data as unknown as ResultsPayload;
    },
  });
}

interface Props {
  attemptId: string;
}

export function SubmittedResultsBreakdown({ attemptId }: Props) {
  const { data, isLoading, error } = useAttemptResults(attemptId, true);
  const [expandAll, setExpandAll] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; order: number; items: QuestionResult[] }>();
    for (const r of data?.results ?? []) {
      const g = map.get(r.section_id) ?? {
        title: r.section_title,
        order: r.section_order,
        items: [],
      };
      g.items.push(r);
      map.set(r.section_id, g);
    }
    return [...map.values()].sort((a, b) => a.order - b.order);
  }, [data]);

  const totals = useMemo(() => {
    const items = data?.results ?? [];
    let correct = 0,
      incorrect = 0,
      partial = 0,
      pending = 0,
      unanswered = 0,
      awarded = 0,
      total = 0;
    for (const r of items) {
      const { verdict, awarded: a } = verdictFor(r);
      if (verdict === "correct") correct++;
      else if (verdict === "incorrect") incorrect++;
      else if (verdict === "partial") partial++;
      else if (verdict === "pending") pending++;
      else unanswered++;
      total += r.points;
      if (typeof a === "number") awarded += a;
    }
    return { correct, incorrect, partial, pending, unanswered, awarded, total, count: items.length };
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading per-question breakdown…
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Couldn't load your results breakdown right now. Please refresh in a moment.
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.results.length) return null;

  return (
    <Card className="overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-primary/15 text-primary grid place-items-center">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-tight">Per-question breakdown</h2>
            <p className="text-xs text-muted-foreground">
              {totals.count} {totals.count === 1 ? "question" : "questions"} ·{" "}
              <span className="text-emerald-600 dark:text-emerald-400">{totals.correct} correct</span>
              {totals.partial > 0 && (
                <> · <span className="text-amber-600 dark:text-amber-400">{totals.partial} partial</span></>
              )}
              {totals.incorrect > 0 && (
                <> · <span className="text-rose-600 dark:text-rose-400">{totals.incorrect} incorrect</span></>
              )}
              {totals.pending > 0 && (
                <> · <span className="text-sky-600 dark:text-sky-400">{totals.pending} pending</span></>
              )}
              {totals.unanswered > 0 && (
                <> · <span>{totals.unanswered} unanswered</span></>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            Auto-graded:{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {totals.awarded}
            </span>{" "}
            / {totals.total}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setExpandAll((v) => !v)}
          >
            {expandAll ? "Collapse all" : "Expand all"}
          </Button>
        </div>
      </div>

      <CardContent className="p-0 divide-y divide-border">
        {grouped.map((g) => (
          <div key={g.title} className="px-5 py-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              {g.title}
            </div>
            <ul className="space-y-2">
              {g.items.map((r, i) => (
                <QuestionRow
                  key={r.question_id}
                  index={i + 1}
                  result={r}
                  forceOpen={expandAll}
                />
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function QuestionRow({
  index,
  result,
  forceOpen,
}: {
  index: number;
  result: QuestionResult;
  forceOpen: boolean;
}) {
  const { verdict, awarded } = verdictFor(result);
  const meta = VERDICT_META[verdict];
  const Icon = meta.icon;
  const [open, setOpen] = useState(false);
  const isOpen = forceOpen || open;
  const expected = formatExpected(result);
  const userAnswer = formatAnswer(result);
  const showAnswers =
    result.type !== "coding" && result.type !== "subjective"; // long-form hidden in summary

  return (
    <li className="rounded-lg border border-border bg-card/60 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
          >
            <span className={cn("h-1 w-1 rounded-full", meta.bar)} aria-hidden />
            <span className="h-6 w-6 rounded-md bg-muted text-muted-foreground grid place-items-center text-[11px] font-semibold tabular-nums shrink-0">
              {index}
            </span>
            <Icon className={cn("h-4 w-4 shrink-0", meta.cls.split(" ")[0])} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{result.title}</div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span>{QUESTION_TYPE_LABEL[result.type]}</span>
                <span>·</span>
                <span className="tabular-nums">
                  {awarded ?? "—"} / {result.points} pt{result.points === 1 ? "" : "s"}
                </span>
                {result.grader_comment && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-primary">
                      <MessageSquareQuote className="h-3 w-3" /> Recruiter note
                    </span>
                  </>
                )}
              </div>
            </div>
            <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wide", meta.cls)}>
              {meta.label}
            </Badge>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                isOpen && "rotate-180"
              )}
              aria-hidden
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 space-y-2.5 text-sm">
            {showAnswers ? (
              <>
                <AnswerBlock
                  label="Your answer"
                  value={userAnswer}
                  tone={verdict === "correct" ? "good" : verdict === "incorrect" ? "bad" : "neutral"}
                />
                {expected && verdict !== "correct" && (
                  <AnswerBlock label="Correct answer" value={expected} tone="good" />
                )}
              </>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                <Circle className="h-3 w-3" />
                Long-form response — open the recruiter view for the full submission.
              </div>
            )}

            {result.grader_comment ? (
              <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  <MessageSquareQuote className="h-3.5 w-3.5" /> Recruiter feedback
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{result.grader_comment}</p>
              </div>
            ) : verdict === "pending" ? (
              <p className="text-xs text-muted-foreground italic">
                Awaiting recruiter review. Comments will appear here once graded.
              </p>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

function AnswerBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "neutral";
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2",
        tone === "good"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : tone === "bad"
          ? "border-rose-500/30 bg-rose-500/5"
          : "border-border bg-muted/40"
      )}
    >
      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">
        {label}
      </div>
      <div className="text-sm whitespace-pre-wrap break-words">{value}</div>
    </div>
  );
}
