import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useCreateQuestion,
  useUpdateQuestion,
  type Question,
} from "../../hooks/useQuestions";
import { WizardShell, type WizardStep } from "./WizardShell";
import { DifficultyPicker, StringListEditor, TagInput, ValidationHint } from "./widgets";
import { SQL_DIALECTS, type Difficulty, type SqlDialect, type SqlMeta } from "./types";

const STEPS: WizardStep[] = [
  { key: "basics",   label: "Basics",       description: "Title, dialect, difficulty" },
  { key: "schema",   label: "Schema & data", description: "DDL + seed inserts" },
  { key: "solution", label: "Solution",     description: "Reference query & options" },
];

type Draft = {
  title: string;
  body_md: string;
  points: number;
  difficulty: Difficulty;
  tags: string[];
  dialect: SqlDialect;
  schema_ddl: string;
  seed_sql: string;
  reference_query: string;
  order_sensitive: boolean;
  hints: string[];
};

const EMPTY: Draft = {
  title: "",
  body_md: "",
  points: 15,
  difficulty: "medium",
  tags: [],
  dialect: "postgres",
  schema_ddl: "",
  seed_sql: "",
  reference_query: "",
  order_sensitive: false,
  hints: [],
};

function fromQuestion(q: Question): Draft {
  const m = (q.meta ?? {}) as SqlMeta;
  return {
    title: q.title,
    body_md: q.body_md ?? "",
    points: q.points,
    difficulty: m.difficulty ?? "medium",
    tags: m.tags ?? [],
    dialect: m.dialect ?? (q.language as SqlDialect) ?? "postgres",
    schema_ddl: m.schema_ddl ?? "",
    seed_sql: m.seed_sql ?? "",
    reference_query: m.reference_query ?? "",
    order_sensitive: !!m.order_sensitive,
    hints: m.hints ?? [],
  };
}

export function SqlWizard({
  orgId,
  initial,
  startStep = 0,
  onDone,
  onCancel,
}: {
  orgId: string;
  initial?: Question;
  startStep?: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(startStep);
  const [draft, setDraft] = useState<Draft>(initial ? fromQuestion(initial) : EMPTY);
  const [questionId, setQuestionId] = useState<string | undefined>(initial?.id);
  const [saving, setSaving] = useState(false);
  const initialStatus: "draft" | "published" =
    ((initial?.meta as SqlMeta | undefined)?.status) === "published"
      ? "published"
      : "draft";
  const [status, setStatus] = useState<"draft" | "published">(initialStatus);

  const create = useCreateQuestion();
  const update = useUpdateQuestion();

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const canStep = useMemo(
    () => [
      draft.title.trim().length > 0,
      draft.schema_ddl.trim().length > 0,
      draft.reference_query.trim().length > 0,
    ],
    [draft],
  );

  const publishErrors = useMemo(() => {
    const errs: string[] = [];
    if (!draft.title.trim()) errs.push("Title is required.");
    if (draft.schema_ddl.trim().length < 10)
      errs.push("Schema DDL must include at least one CREATE TABLE.");
    if (!/create\s+table/i.test(draft.schema_ddl))
      errs.push("Schema must contain a CREATE TABLE statement.");
    if (!draft.reference_query.trim())
      errs.push("Reference query is required.");
    else if (!/select/i.test(draft.reference_query))
      errs.push("Reference query must be a SELECT statement.");
    if (draft.points < 1) errs.push("Points must be at least 1.");
    return errs;
  }, [draft]);

  const buildMeta = (status: "draft" | "published"): SqlMeta => ({
    status,
    difficulty: draft.difficulty,
    tags: draft.tags,
    dialect: draft.dialect,
    schema_ddl: draft.schema_ddl,
    seed_sql: draft.seed_sql,
    reference_query: draft.reference_query,
    order_sensitive: draft.order_sensitive,
    hints: draft.hints.filter(Boolean),
  });

  const persist = async (status: "draft" | "published") => {
    setSaving(true);
    try {
      const meta = buildMeta(status);
      const payload = {
        org_id: orgId,
        type: "sql" as const,
        title: draft.title.trim() || "Untitled SQL question",
        body_md: draft.body_md || undefined,
        language: draft.dialect,
        points: draft.points,
        meta: meta as unknown as Record<string, unknown>,
      };
      if (questionId) {
        await update.mutateAsync({ id: questionId, patch: payload as never });
      } else {
        const q = await create.mutateAsync(payload);
        setQuestionId(q.id);
      }
      toast.success(status === "published" ? "Question published" : "Draft saved");
      if (status === "published") onDone();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <WizardShell
      steps={STEPS}
      current={step}
      onStep={setStep}
      canAdvance={canStep[step]}
      onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
      onNext={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
      onSaveDraft={() => persist("draft")}
      onPublish={() => persist("published")}
      saving={saving}
      isLast={step === STEPS.length - 1}
      status={status}
      onStatusChange={setStatus}
      rightPane={
        <div className="space-y-3 text-xs">
          <div>
            <div className="text-sm font-semibold">{draft.title || "Untitled"}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="outline" className="uppercase">{draft.dialect}</Badge>
              <Badge variant="outline" className="capitalize">{draft.difficulty}</Badge>
            </div>
          </div>
          {draft.body_md && (
            <div className="whitespace-pre-wrap text-[hsl(var(--muted-foreground))] line-clamp-6">
              {draft.body_md}
            </div>
          )}
          {draft.schema_ddl && (
            <div>
              <div className="text-[10px] uppercase text-[hsl(var(--muted-foreground))] mb-1">Schema</div>
              <pre className="border rounded p-2 font-mono whitespace-pre-wrap text-[11px] max-h-32 overflow-auto">
                {draft.schema_ddl}
              </pre>
            </div>
          )}
        </div>
      }
    >
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <Label>Title <span className="text-rose-500">*</span></Label>
            <Input
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Top customers by revenue…"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Prompt (Markdown)</Label>
            <Textarea
              value={draft.body_md}
              onChange={(e) => patch({ body_md: e.target.value })}
              placeholder="What does the candidate need to query?"
              className="mt-1 min-h-[120px]"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Dialect</Label>
              <Select value={draft.dialect} onValueChange={(v) => patch({ dialect: v as SqlDialect })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SQL_DIALECTS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Difficulty</Label>
              <div className="mt-1">
                <DifficultyPicker value={draft.difficulty} onChange={(v) => patch({ difficulty: v })} />
              </div>
            </div>
          </div>
          <div>
            <Label>Tags</Label>
            <div className="mt-1">
              <TagInput value={draft.tags} onChange={(tags) => patch({ tags })} placeholder="joins, aggregation, window…" />
            </div>
          </div>
          <div>
            <Label>Points</Label>
            <Input
              type="number"
              min={1}
              value={draft.points}
              onChange={(e) => patch({ points: Number(e.target.value) || 0 })}
              className="mt-1 w-32"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label>Schema (DDL) <span className="text-rose-500">*</span></Label>
            <Textarea
              value={draft.schema_ddl}
              onChange={(e) => patch({ schema_ddl: e.target.value })}
              placeholder={`CREATE TABLE customers (\n  id INT PRIMARY KEY,\n  name TEXT NOT NULL\n);`}
              className="mt-1 min-h-[160px] font-mono text-xs"
            />
            <ValidationHint ok={draft.schema_ddl.trim().length > 0}>
              CREATE TABLE statements that set up the world for this question.
            </ValidationHint>
          </div>
          <div>
            <Label>Seed data (INSERTs)</Label>
            <Textarea
              value={draft.seed_sql}
              onChange={(e) => patch({ seed_sql: e.target.value })}
              placeholder={`INSERT INTO customers VALUES (1, 'Acme');`}
              className="mt-1 min-h-[120px] font-mono text-xs"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Reference query <span className="text-rose-500">*</span></Label>
            <Textarea
              value={draft.reference_query}
              onChange={(e) => patch({ reference_query: e.target.value })}
              placeholder={`SELECT name FROM customers ORDER BY revenue DESC LIMIT 5;`}
              className="mt-1 min-h-[140px] font-mono text-xs"
            />
            <ValidationHint ok={draft.reference_query.trim().length > 0}>
              Used as the source of truth — candidates are graded against this query's result set.
            </ValidationHint>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={draft.order_sensitive}
              onCheckedChange={(v) => patch({ order_sensitive: !!v })}
            />
            Result order matters (rows must match the exact ORDER BY)
          </label>
          <div>
            <Label>Hints</Label>
            <div className="mt-1">
              <StringListEditor
                value={draft.hints}
                onChange={(hints) => patch({ hints })}
                placeholder="Try a GROUP BY…"
                addLabel="Add hint"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </WizardShell>
  );
}
