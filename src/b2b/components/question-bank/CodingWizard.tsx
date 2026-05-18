import { useEffect, useMemo, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateQuestion,
  useUpdateQuestion,
  useTestCases,
  useUpsertTestCase,
  useDeleteTestCase,
  type Question,
} from "../../hooks/useQuestions";
import { WizardShell, type WizardStep } from "./WizardShell";
import {
  DifficultyPicker,
  StringListEditor,
  TagInput,
  ValidationHint,
} from "./widgets";
import {
  LANGUAGES,
  type CodingExample,
  type CodingMeta,
  type CodingTestCase,
  type Difficulty,
  type Language,
} from "./types";

const STEPS: WizardStep[] = [
  { key: "basics",  label: "Basics",         description: "Title, difficulty, points" },
  { key: "problem", label: "Problem",        description: "Prompt, constraints, examples" },
  { key: "code",    label: "Code setup",     description: "Languages & starter code" },
  { key: "tests",   label: "Tests & solution", description: "Sample + hidden tests" },
];

type Draft = {
  title: string;
  body_md: string;
  points: number;
  difficulty: Difficulty;
  tags: string[];
  time_limit_ms: number;
  est_minutes: number;
  constraints: string[];
  examples: CodingExample[];
  primary_language: Language;
  function_signature: string;
  starter_code: Partial<Record<Language, string>>;
  allowed_languages: Language[];
  reference_solution: { language: Language; code: string };
  complexity: { time: string; space: string };
  hints: string[];
  pending_tests: CodingTestCase[]; // only used when no question id yet
};

const EMPTY: Draft = {
  title: "",
  body_md: "",
  points: 20,
  difficulty: "medium",
  tags: [],
  time_limit_ms: 2000,
  est_minutes: 20,
  constraints: [""],
  examples: [{ input: "", output: "", explanation: "" }],
  primary_language: "javascript",
  function_signature: "",
  starter_code: { javascript: "" },
  allowed_languages: ["javascript"],
  reference_solution: { language: "javascript", code: "" },
  complexity: { time: "", space: "" },
  hints: [],
  pending_tests: [],
};

function fromQuestion(q: Question): Draft {
  const m = (q.meta ?? {}) as CodingMeta;
  return {
    title: q.title,
    body_md: q.body_md ?? "",
    points: q.points,
    difficulty: m.difficulty ?? "medium",
    tags: m.tags ?? [],
    time_limit_ms: m.time_limit_ms ?? 2000,
    est_minutes: m.est_minutes ?? 20,
    constraints: m.constraints?.length ? m.constraints : [""],
    examples: m.examples?.length ? m.examples : [{ input: "", output: "", explanation: "" }],
    primary_language: (q.language as Language) ?? m.allowed_languages?.[0] ?? "javascript",
    function_signature: m.function_signature ?? "",
    starter_code: m.starter_code ?? (q.starter_code ? { [(q.language as Language) ?? "javascript"]: q.starter_code } : { javascript: "" }),
    allowed_languages: m.allowed_languages?.length ? m.allowed_languages : [(q.language as Language) ?? "javascript"],
    reference_solution: m.reference_solution ?? { language: (q.language as Language) ?? "javascript", code: "" },
    complexity: { time: m.complexity?.time ?? "", space: m.complexity?.space ?? "" },
    hints: m.hints ?? [],
    pending_tests: [],
  };
}

export function CodingWizard({
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
    ((initial?.meta as CodingMeta | undefined)?.status) === "published"
      ? "published"
      : "draft";
  const [status, setStatus] = useState<"draft" | "published">(initialStatus);

  const create = useCreateQuestion();
  const update = useUpdateQuestion();
  const { data: persistedTests } = useTestCases(questionId);
  const testCount = persistedTests?.length ?? 0;
  const hiddenCount = (persistedTests ?? []).filter((t) => t.is_hidden).length;
  const sampleCount = testCount - hiddenCount;
  const badWeightTest = (persistedTests ?? []).find(
    (t) => !t.expected_output?.toString().trim() || (t.weight ?? 0) < 1,
  );

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const canStep = useMemo(() => {
    return [
      draft.title.trim().length > 0,
      draft.body_md.trim().length > 10 &&
        draft.examples.some((e) => e.input.trim() && e.output.trim()),
      draft.allowed_languages.length > 0 &&
        (draft.starter_code[draft.primary_language] ?? "").trim().length > 0 &&
        draft.function_signature.trim().length > 0,
      true,
    ];
  }, [draft]);
  const canAdvance = canStep[step];

  const publishErrors = useMemo(() => {
    const errs: string[] = [];
    if (!draft.title.trim()) errs.push("Title is required.");
    if (draft.body_md.trim().length < 10)
      errs.push("Problem statement must be at least 10 characters.");
    if (!draft.examples.some((e) => e.input.trim() && e.output.trim()))
      errs.push("Add at least one worked example with both input and output.");
    if (draft.allowed_languages.length === 0)
      errs.push("Pick at least one allowed language.");
    if (!draft.function_signature.trim())
      errs.push("Function signature is required.");
    if (!(draft.starter_code[draft.primary_language] ?? "").trim())
      errs.push("Starter code for the primary language is required.");
    if (!draft.reference_solution.code.trim())
      errs.push("Reference solution is required.");
    if (testCount === 0) errs.push("Add at least one test case.");
    else {
      if (sampleCount === 0) errs.push("Add at least one sample (visible) test.");
      if (hiddenCount === 0) errs.push("Add at least one hidden test.");
      if (badWeightTest)
        errs.push("Every test needs a non-empty expected output and weight ≥ 1.");
    }
    return errs;
  }, [draft, testCount, sampleCount, hiddenCount, badWeightTest]);

  const buildMeta = (status: "draft" | "published"): CodingMeta => ({
    status,
    difficulty: draft.difficulty,
    tags: draft.tags,
    time_limit_ms: draft.time_limit_ms,
    est_minutes: draft.est_minutes,
    constraints: draft.constraints.map((c) => c.trim()).filter(Boolean),
    examples: draft.examples
      .map((e) => ({
        input: e.input.trim(),
        output: e.output.trim(),
        explanation: e.explanation?.trim() || undefined,
      }))
      .filter((e) => e.input || e.output),
    function_signature: draft.function_signature || undefined,
    starter_code: draft.starter_code,
    allowed_languages: draft.allowed_languages,
    reference_solution: draft.reference_solution.code
      ? draft.reference_solution
      : undefined,
    complexity:
      draft.complexity.time || draft.complexity.space ? draft.complexity : undefined,
    hints: draft.hints.filter(Boolean),
  });

  const persist = async (status: "draft" | "published") => {
    setSaving(true);
    try {
      const meta = buildMeta(status);
      const payload = {
        org_id: orgId,
        type: "coding" as const,
        title: draft.title.trim() || "Untitled coding question",
        body_md: draft.body_md || undefined,
        language: draft.primary_language,
        starter_code: draft.starter_code[draft.primary_language] || undefined,
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
      canAdvance={canAdvance}
      onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
      onNext={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
      onSaveDraft={() => persist("draft")}
      onPublish={() => persist("published")}
      saving={saving}
      isLast={step === STEPS.length - 1}
      status={status}
      onStatusChange={setStatus}
      rightPane={<CodingPreview draft={draft} />}
    >
      {step === 0 && <BasicsStep draft={draft} patch={patch} />}
      {step === 1 && <ProblemStep draft={draft} patch={patch} />}
      {step === 2 && <CodeStep draft={draft} patch={patch} />}
      {step === 3 && (
        <TestsStep
          draft={draft}
          patch={patch}
          questionId={questionId}
          ensureQuestion={async () => {
            if (questionId) return questionId;
            const meta = buildMeta("draft");
            const q = await create.mutateAsync({
              org_id: orgId,
              type: "coding",
              title: draft.title.trim() || "Untitled coding question",
              body_md: draft.body_md || undefined,
              language: draft.primary_language,
              starter_code: draft.starter_code[draft.primary_language] || undefined,
              points: draft.points,
              meta: meta as unknown as Record<string, unknown>,
            });
            setQuestionId(q.id);
            return q.id;
          }}
        />
      )}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </WizardShell>
  );
}

// ────────── Step 1: Basics ──────────
function BasicsStep({
  draft,
  patch,
}: {
  draft: Draft;
  patch: (p: Partial<Draft>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Title <span className="text-rose-500">*</span></Label>
        <Input
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Two Sum, Validate BST, Rate Limiter…"
          className="mt-1"
        />
        <ValidationHint ok={draft.title.trim().length > 0}>
          A clear, concise name candidates will see at the top of the editor.
        </ValidationHint>
      </div>
      <div>
        <Label>Difficulty</Label>
        <div className="mt-1">
          <DifficultyPicker
            value={draft.difficulty}
            onChange={(v) => patch({ difficulty: v })}
          />
        </div>
      </div>
      <div>
        <Label>Tags</Label>
        <div className="mt-1">
          <TagInput
            value={draft.tags}
            onChange={(tags) => patch({ tags })}
            placeholder="arrays, hashmap, two-pointer…"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Points</Label>
          <Input
            type="number"
            min={1}
            value={draft.points}
            onChange={(e) => patch({ points: Number(e.target.value) || 0 })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Time limit (ms)</Label>
          <Input
            type="number"
            min={100}
            step={100}
            value={draft.time_limit_ms}
            onChange={(e) => patch({ time_limit_ms: Number(e.target.value) || 0 })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Est. minutes</Label>
          <Input
            type="number"
            min={1}
            value={draft.est_minutes}
            onChange={(e) => patch({ est_minutes: Number(e.target.value) || 0 })}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

// ────────── Step 2: Problem ──────────
function ProblemStep({
  draft,
  patch,
}: {
  draft: Draft;
  patch: (p: Partial<Draft>) => void;
}) {
  const updateExample = (i: number, p: Partial<CodingExample>) =>
    patch({
      examples: draft.examples.map((e, idx) => (idx === i ? { ...e, ...p } : e)),
    });
  return (
    <div className="space-y-4">
      <div>
        <Label>Problem statement (Markdown) <span className="text-rose-500">*</span></Label>
        <Textarea
          value={draft.body_md}
          onChange={(e) => patch({ body_md: e.target.value })}
          placeholder={"Describe the problem clearly.\n\n- What input does the function receive?\n- What should it return?\n- Any edge cases to be aware of?"}
          className="mt-1 min-h-[160px] font-mono text-sm"
        />
        <ValidationHint ok={draft.body_md.trim().length > 10}>
          Aim for at least a short paragraph plus input/output spec.
        </ValidationHint>
      </div>

      <div>
        <Label>Constraints</Label>
        <div className="mt-1">
          <StringListEditor
            value={draft.constraints}
            onChange={(constraints) => patch({ constraints })}
            placeholder="1 ≤ n ≤ 10^5"
            addLabel="Add constraint"
          />
        </div>
      </div>

      <div>
        <Label>Worked examples</Label>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 mb-2">
          Shown to candidates as the visible spec. Add 1–3.
        </p>
        <div className="space-y-3">
          {draft.examples.map((ex, i) => (
            <div key={i} className="border rounded-md p-3 space-y-2 bg-[hsl(var(--secondary))/0.3]">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Example {i + 1}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    patch({ examples: draft.examples.filter((_, idx) => idx !== i) })
                  }
                  disabled={draft.examples.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Input</Label>
                  <Textarea
                    value={ex.input}
                    onChange={(e) => updateExample(i, { input: e.target.value })}
                    className="mt-1 min-h-[60px] font-mono text-xs"
                    placeholder="nums = [2,7,11,15], target = 9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Output</Label>
                  <Textarea
                    value={ex.output}
                    onChange={(e) => updateExample(i, { output: e.target.value })}
                    className="mt-1 min-h-[60px] font-mono text-xs"
                    placeholder="[0, 1]"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Explanation (optional)</Label>
                <Textarea
                  value={ex.explanation ?? ""}
                  onChange={(e) => updateExample(i, { explanation: e.target.value })}
                  className="mt-1 min-h-[40px] text-xs"
                  placeholder="Because nums[0] + nums[1] == 9."
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() =>
            patch({
              examples: [
                ...draft.examples,
                { input: "", output: "", explanation: "" },
              ],
            })
          }
          disabled={draft.examples.length >= 5}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add example
        </Button>
      </div>
    </div>
  );
}

// ────────── Step 3: Code setup ──────────
function CodeStep({
  draft,
  patch,
}: {
  draft: Draft;
  patch: (p: Partial<Draft>) => void;
}) {
  const toggleLanguage = (lang: Language) => {
    const has = draft.allowed_languages.includes(lang);
    const next = has
      ? draft.allowed_languages.filter((l) => l !== lang)
      : [...draft.allowed_languages, lang];
    if (next.length === 0) return;
    const sc = { ...draft.starter_code };
    if (!has && sc[lang] === undefined) sc[lang] = "";
    const primary = next.includes(draft.primary_language) ? draft.primary_language : next[0];
    patch({ allowed_languages: next, starter_code: sc, primary_language: primary });
  };

  const updateStarter = (lang: Language, code: string) =>
    patch({ starter_code: { ...draft.starter_code, [lang]: code } });

  return (
    <div className="space-y-4">
      <div>
        <Label>Allowed languages</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {LANGUAGES.map((l) => {
            const active = draft.allowed_languages.includes(l.value);
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => toggleLanguage(l.value)}
                className={`px-3 py-1.5 rounded-md border text-xs font-medium transition ${
                  active
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]"
                    : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </div>
        <ValidationHint ok={draft.allowed_languages.length > 0}>
          Pick one or more languages candidates can choose.
        </ValidationHint>
      </div>

      <div>
        <Label>Primary language</Label>
        <Select
          value={draft.primary_language}
          onValueChange={(v) => patch({ primary_language: v as Language })}
        >
          <SelectTrigger className="mt-1 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {draft.allowed_languages.map((l) => (
              <SelectItem key={l} value={l}>
                {LANGUAGES.find((x) => x.value === l)?.label ?? l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Function signature (optional)</Label>
        <Input
          value={draft.function_signature}
          onChange={(e) => patch({ function_signature: e.target.value })}
          placeholder="function twoSum(nums: number[], target: number): number[]"
          className="mt-1 font-mono text-xs"
        />
      </div>

      <div>
        <Label>Starter code per language</Label>
        <Tabs
          value={draft.primary_language}
          onValueChange={(v) => patch({ primary_language: v as Language })}
          className="mt-1"
        >
          <TabsList>
            {draft.allowed_languages.map((l) => (
              <TabsTrigger key={l} value={l}>
                {LANGUAGES.find((x) => x.value === l)?.label ?? l}
              </TabsTrigger>
            ))}
          </TabsList>
          {draft.allowed_languages.map((l) => (
            <TabsContent key={l} value={l}>
              <Textarea
                value={draft.starter_code[l] ?? ""}
                onChange={(e) => updateStarter(l, e.target.value)}
                className="min-h-[180px] font-mono text-xs"
                placeholder={`// ${LANGUAGES.find((x) => x.value === l)?.label} starter`}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

// ────────── Step 4: Tests + Solution ──────────
function TestsStep({
  draft,
  patch,
  questionId,
  ensureQuestion,
}: {
  draft: Draft;
  patch: (p: Partial<Draft>) => void;
  questionId?: string;
  ensureQuestion: () => Promise<string>;
}) {
  return (
    <div className="space-y-5">
      <PersistedTestCases
        questionId={questionId}
        ensureQuestion={ensureQuestion}
      />

      <div className="border-t pt-4">
        <Label>Reference solution (private)</Label>
        <Select
          value={draft.reference_solution.language}
          onValueChange={(v) =>
            patch({
              reference_solution: {
                ...draft.reference_solution,
                language: v as Language,
              },
            })
          }
        >
          <SelectTrigger className="mt-1 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {draft.allowed_languages.map((l) => (
              <SelectItem key={l} value={l}>
                {LANGUAGES.find((x) => x.value === l)?.label ?? l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          value={draft.reference_solution.code}
          onChange={(e) =>
            patch({
              reference_solution: { ...draft.reference_solution, code: e.target.value },
            })
          }
          className="mt-2 min-h-[160px] font-mono text-xs"
          placeholder="Reviewer-only solution used to grade & sanity-check tests."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Expected time complexity</Label>
          <Input
            value={draft.complexity.time}
            onChange={(e) =>
              patch({ complexity: { ...draft.complexity, time: e.target.value } })
            }
            placeholder="O(n)"
            className="mt-1 font-mono"
          />
        </div>
        <div>
          <Label>Expected space complexity</Label>
          <Input
            value={draft.complexity.space}
            onChange={(e) =>
              patch({ complexity: { ...draft.complexity, space: e.target.value } })
            }
            placeholder="O(1)"
            className="mt-1 font-mono"
          />
        </div>
      </div>

      <div>
        <Label>Hints (shown progressively)</Label>
        <div className="mt-1">
          <StringListEditor
            value={draft.hints}
            onChange={(hints) => patch({ hints })}
            placeholder="Think about a hash map…"
            addLabel="Add hint"
          />
        </div>
      </div>
    </div>
  );
}

function PersistedTestCases({
  questionId,
  ensureQuestion,
}: {
  questionId?: string;
  ensureQuestion: () => Promise<string>;
}) {
  const [activeId, setActiveId] = useState<string | undefined>(questionId);
  useEffect(() => setActiveId(questionId), [questionId]);

  const { data: cases } = useTestCases(activeId);
  const upsert = useUpsertTestCase();
  const del = useDeleteTestCase();

  const [input, setInput] = useState("");
  const [expected, setExpected] = useState("");
  const [hidden, setHidden] = useState(true);
  const [weight, setWeight] = useState(1);
  const [label, setLabel] = useState("");

  const samples = (cases ?? []).filter((c) => !c.is_hidden);
  const hiddens = (cases ?? []).filter((c) => c.is_hidden);

  const add = async () => {
    if (!expected.trim()) return;
    const id = activeId ?? (await ensureQuestion());
    setActiveId(id);
    await upsert.mutateAsync({
      question_id: id,
      input,
      expected_output: expected,
      is_hidden: hidden,
      weight,
      order_index: cases?.length ?? 0,
    });
    setInput("");
    setExpected("");
    setLabel("");
    setWeight(1);
    toast.success(`${hidden ? "Hidden" : "Sample"} test added`);
  };

  const move = async (id: string, dir: -1 | 1) => {
    const all = cases ?? [];
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const target = all[idx];
    // Find nearest neighbor in the same group (sample/hidden)
    let neighborIdx = -1;
    for (let i = idx + dir; i >= 0 && i < all.length; i += dir) {
      if (all[i].is_hidden === target.is_hidden) {
        neighborIdx = i;
        break;
      }
    }
    if (neighborIdx === -1) return;
    const neighbor = all[neighborIdx];
    // Swap their order_index values
    await Promise.all([
      upsert.mutateAsync({
        id: target.id,
        question_id: target.question_id,
        input: target.input,
        expected_output: target.expected_output,
        is_hidden: target.is_hidden,
        weight: target.weight,
        order_index: neighbor.order_index,
      }),
      upsert.mutateAsync({
        id: neighbor.id,
        question_id: neighbor.question_id,
        input: neighbor.input,
        expected_output: neighbor.expected_output,
        is_hidden: neighbor.is_hidden,
        weight: neighbor.weight,
        order_index: target.order_index,
      }),
    ]);
  };

  const renderCase = (t: NonNullable<typeof cases>[number], list: NonNullable<typeof cases>) => {
    const pos = list.findIndex((x) => x.id === t.id);
    const isFirst = pos === 0;
    const isLast = pos === list.length - 1;
    return (
      <div key={t.id} className="border rounded-md p-2.5 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Badge variant={t.is_hidden ? "secondary" : "outline"} className="gap-1">
              {t.is_hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {t.is_hidden ? "Hidden" : "Sample"} #{pos + 1}
            </Badge>
            <span className="text-[hsl(var(--muted-foreground))]">weight {t.weight}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={isFirst || upsert.isPending}
              onClick={() => move(t.id, -1)}
              aria-label="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={isLast || upsert.isPending}
              onClick={() => move(t.id, 1)}
              aria-label="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => del.mutate({ id: t.id, question_id: t.question_id })}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] uppercase text-[hsl(var(--muted-foreground))]">In</div>
            <pre className="whitespace-pre-wrap font-mono">{t.input || "—"}</pre>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[hsl(var(--muted-foreground))]">Out</div>
            <pre className="whitespace-pre-wrap font-mono">{t.expected_output}</pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <Label className="text-sm">Test cases</Label>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {samples.length} sample · {hiddens.length} hidden
        </span>
      </div>

      {!activeId && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Adding a test case will auto-save this question as a draft so tests can be linked to it.
        </p>
      )}

      {samples.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Sample (visible)</div>
          {samples.map((t) => renderCase(t, samples))}
        </div>
      )}

      {hiddens.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Hidden</div>
          {hiddens.map((t) => renderCase(t, hiddens))}
        </div>
      )}


      <div className="border rounded-md p-3 space-y-2 bg-[hsl(var(--secondary))/0.3]">
        <div className="grid grid-cols-2 gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Input"
            className="min-h-[60px] font-mono text-xs"
          />
          <Textarea
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder="Expected output"
            className="min-h-[60px] font-mono text-xs"
          />
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={hidden}
                onCheckedChange={(v) => setHidden(!!v)}
              />
              Hidden
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              Weight
              <Input
                type="number"
                min={1}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value) || 1)}
                className="h-7 w-16"
              />
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={add}
            disabled={!expected.trim()}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add test case
          </Button>
        </div>
      </div>
    </div>
  );
}

// ────────── Live candidate preview ──────────
function CodingPreview({ draft }: { draft: Draft }) {
  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className="text-sm font-semibold">{draft.title || "Untitled"}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          <Badge variant="outline" className="capitalize">{draft.difficulty}</Badge>
          {draft.tags.slice(0, 4).map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
        </div>
      </div>
      {draft.body_md && (
        <div className="whitespace-pre-wrap text-[hsl(var(--muted-foreground))] line-clamp-6">
          {draft.body_md}
        </div>
      )}
      {draft.examples.filter((e) => e.input || e.output).slice(0, 1).map((e, i) => (
        <div key={i} className="border rounded p-2 space-y-1">
          <div className="font-medium">Example</div>
          <div><span className="text-[hsl(var(--muted-foreground))]">In:</span> <code>{e.input}</code></div>
          <div><span className="text-[hsl(var(--muted-foreground))]">Out:</span> <code>{e.output}</code></div>
        </div>
      ))}
      {draft.starter_code[draft.primary_language] && (
        <pre className="border rounded p-2 font-mono whitespace-pre-wrap text-[11px] max-h-40 overflow-auto">
          {draft.starter_code[draft.primary_language]}
        </pre>
      )}
    </div>
  );
}
