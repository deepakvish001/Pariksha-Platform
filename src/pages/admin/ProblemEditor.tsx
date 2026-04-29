import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  FullProblemPayload,
  useAdminProblem,
  useSaveProblem,
} from "@/hooks/useAdminProblems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LANGUAGES, type LangId } from "@/data/codingProblemsData";
import { MonacoEditor } from "@/components/coding/MonacoEditor";
import { Plus, Trash2, Save, ArrowLeft, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const emptyPayload = (): FullProblemPayload => ({
  slug: "",
  title: "",
  difficulty: "medium",
  topics: [],
  description: "",
  examples: [{ input: "", output: "", explanation: "" }],
  constraints: [],
  hints: [],
  cpu_time_limit_sec: 2,
  memory_limit_kb: 256000,
  is_published: false,
  starter_code: {},
  reference_solution: {},
  sample_tests: [],
  hidden_tests: [],
  sql_spec: null,
});

const DRAFT_KEY = (slug?: string) => `admin:problem-draft:${slug ?? "__new__"}`;

const ProblemEditor = () => {
  const { slug } = useParams();
  const isNew = !slug;
  const nav = useNavigate();
  const { data: loaded, isLoading } = useAdminProblem(slug);
  const save = useSaveProblem();
  const [form, setForm] = useState<FullProblemPayload>(emptyPayload());
  const [topicInput, setTopicInput] = useState("");
  const [activeLang, setActiveLang] = useState<LangId>("python");
  const [dirty, setDirty] = useState(false);
  const [slugTaken, setSlugTaken] = useState(false);
  const [draftRestoredAt, setDraftRestoredAt] = useState<string | null>(null);

  // Restore localStorage draft for NEW problems on first mount.
  useEffect(() => {
    if (!isNew) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY(undefined));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.form) {
          setForm(parsed.form);
          setDraftRestoredAt(parsed.savedAt ?? null);
        }
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loaded?.problem) {
      const p = loaded.problem;
      setForm({
        slug: p.slug,
        title: p.title,
        difficulty: p.difficulty,
        topics: p.topics ?? [],
        description: p.description ?? "",
        examples: Array.isArray(p.examples) && p.examples.length > 0 ? p.examples : [{ input: "", output: "" }],
        constraints: p.constraints ?? [],
        hints: p.hints ?? [],
        cpu_time_limit_sec: Number(p.cpu_time_limit_sec ?? 2),
        memory_limit_kb: p.memory_limit_kb ?? 256000,
        is_published: !!p.is_published,
        starter_code: loaded.starter_code ?? {},
        reference_solution: loaded.reference_solution ?? {},
        sample_tests: loaded.sample_tests ?? [],
        hidden_tests: loaded.hidden_tests ?? [],
        sql_spec: loaded.sql_spec
          ? {
              schema_sql: loaded.sql_spec.schema_sql ?? "",
              seed_sql: loaded.sql_spec.seed_sql ?? "",
              reference_query: loaded.sql_spec.reference_query ?? "",
              order_matters: !!loaded.sql_spec.order_matters,
              starter: loaded.sql_spec.starter ?? "",
            }
          : null,
      });
      setDirty(false);
    }
  }, [loaded]);

  const update = <K extends keyof FullProblemPayload>(k: K, v: FullProblemPayload[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  // Autosave drafts to localStorage every 5 seconds while dirty (new problems only).
  useEffect(() => {
    if (!isNew || !dirty) return;
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY(undefined),
          JSON.stringify({ form, savedAt: new Date().toISOString() }),
        );
      } catch (_) {}
    }, 5000);
    return () => window.clearTimeout(id);
  }, [form, dirty, isNew]);

  // Block route/window unload while dirty.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Slug collision check (debounced) — only relevant for new problems.
  // Existing problems have a read-only slug, so we skip the check entirely.
  useEffect(() => {
    if (!isNew) {
      setSlugTaken(false);
      return;
    }
    const s = slugify(form.slug);
    if (!s) {
      setSlugTaken(false);
      return;
    }
    const t = window.setTimeout(async () => {
      const { data } = await import("@/integrations/supabase/client").then((m) =>
        m.supabase.from("coding_problems").select("slug").eq("slug", s).maybeSingle(),
      );
      setSlugTaken(!!data);
    }, 400);
    return () => window.clearTimeout(t);
  }, [form.slug, isNew]);

  const addTopic = () => {
    const t = topicInput.trim();
    if (!t) return;
    if (!form.topics.includes(t)) update("topics", [...form.topics, t]);
    setTopicInput("");
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.title.trim()) {
      toast({
        title: "Missing fields",
        description: "Slug and title are required.",
        variant: "destructive",
      });
      return;
    }
    if (isNew && slugTaken) {
      toast({
        title: "Slug already taken",
        description: "Pick a different slug.",
        variant: "destructive",
      });
      return;
    }
    const cleaned: FullProblemPayload = {
      ...form,
      slug: slugify(form.slug),
      examples: form.examples.filter((e) => e.input || e.output),
      constraints: form.constraints.filter(Boolean),
      hints: form.hints.filter(Boolean),
    };
    await save.mutateAsync(cleaned);
    setDirty(false);
    try {
      localStorage.removeItem(DRAFT_KEY(undefined));
    } catch (_) {}
    if (isNew) nav(`/admin/problems/${cleaned.slug}/edit`, { replace: true });
  };

  // Cmd/Ctrl+S to save.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, slugTaken]);

  const previewMd = useMemo(() => form.description, [form.description]);

  if (!isNew && isLoading) {
    return (
      <AdminShell>
        <p className="text-muted-foreground">Loading…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => nav("/admin/problems")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">
            {isNew ? "New Problem" : `Edit: ${form.title || form.slug}`}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="text-xs text-amber-500">● Unsaved changes</span>
          )}
          {!dirty && draftRestoredAt && isNew && (
            <span className="text-xs text-muted-foreground">
              Draft restored
            </span>
          )}
          <div className="flex items-center gap-2">
            <Switch
              checked={form.is_published}
              onCheckedChange={(v) => update("is_published", v)}
            />
            <span className="text-sm">{form.is_published ? "Published" : "Draft"}</span>
          </div>
          <Button onClick={handleSave} disabled={save.isPending || (isNew && slugTaken)}>
            <Save className="mr-2 h-4 w-4" />
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basics">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="statement">Statement</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="constraints">Constraints &amp; Hints</TabsTrigger>
          <TabsTrigger value="starter">Starter Code</TabsTrigger>
          <TabsTrigger value="reference">Reference Solution</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="sql">SQL Spec</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="basics">
          <Card className="space-y-4 p-4">
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  update("title", e.target.value);
                  if (isNew && !form.slug)
                    update("slug" as any, slugify(e.target.value));
                }}
                placeholder="Two Sum"
              />
            </div>
            <div>
              <Label>Slug</Label>
              {isNew ? (
                <>
                  <Input
                    value={form.slug}
                    onChange={(e) => update("slug", slugify(e.target.value))}
                    placeholder="two-sum"
                  />
                  <p className={`mt-1 text-xs ${slugTaken ? "text-destructive" : "text-muted-foreground"}`}>
                    {slugTaken
                      ? "This slug is already taken — pick another."
                      : "URL-safe identifier; cannot be changed after creation."}
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                  <code className="font-mono text-sm">{form.slug}</code>
                  <Badge variant="outline" className="ml-auto text-xs">
                    Read-only
                  </Badge>
                </div>
              )}
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v: any) => update("difficulty", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Topics</Label>
              <div className="flex gap-2">
                <Input
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTopic();
                    }
                  }}
                  placeholder="Array, Hash Table…"
                />
                <Button type="button" variant="secondary" onClick={addTopic}>
                  Add
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {form.topics.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button
                      type="button"
                      onClick={() => update("topics", form.topics.filter((x) => x !== t))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="statement">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <Label>Description (Markdown)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            </Card>
            <Card className="p-4">
              <Label>Preview</Label>
              <div className="prose prose-invert max-w-none rounded-md border bg-muted/30 p-3 text-sm">
                <ReactMarkdown>{previewMd || "_Nothing yet._"}</ReactMarkdown>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="examples">
          <Card className="space-y-3 p-4">
            {form.examples.map((ex, i) => (
              <div key={i} className="grid gap-2 rounded-md border p-3 md:grid-cols-3">
                <Textarea
                  rows={3}
                  placeholder="Input"
                  value={ex.input}
                  onChange={(e) => {
                    const next = [...form.examples];
                    next[i] = { ...ex, input: e.target.value };
                    update("examples", next);
                  }}
                />
                <Textarea
                  rows={3}
                  placeholder="Output"
                  value={ex.output}
                  onChange={(e) => {
                    const next = [...form.examples];
                    next[i] = { ...ex, output: e.target.value };
                    update("examples", next);
                  }}
                />
                <div className="flex gap-2">
                  <Textarea
                    rows={3}
                    placeholder="Explanation (optional)"
                    value={ex.explanation ?? ""}
                    onChange={(e) => {
                      const next = [...form.examples];
                      next[i] = { ...ex, explanation: e.target.value };
                      update("examples", next);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      update("examples", form.examples.filter((_, x) => x !== i))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                update("examples", [...form.examples, { input: "", output: "" }])
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Add example
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="constraints">
          <div className="grid gap-4 md:grid-cols-2">
            <ListEditor
              title="Constraints"
              items={form.constraints}
              onChange={(v) => update("constraints", v)}
              placeholder="1 <= n <= 10^5"
            />
            <ListEditor
              title="Hints"
              items={form.hints}
              onChange={(v) => update("hints", v)}
              placeholder="Try a hash map…"
            />
          </div>
        </TabsContent>

        <TabsContent value="starter">
          <CodePerLanguage
            value={form.starter_code}
            onChange={(v) => update("starter_code", v)}
            activeLang={activeLang}
            setActiveLang={setActiveLang}
          />
        </TabsContent>

        <TabsContent value="reference">
          <CodePerLanguage
            value={form.reference_solution}
            onChange={(v) => update("reference_solution", v)}
            activeLang={activeLang}
            setActiveLang={setActiveLang}
          />
        </TabsContent>

        <TabsContent value="tests">
          <div className="space-y-4">
            <TestsTable
              title="Sample tests (visible to user)"
              tests={form.sample_tests}
              onChange={(t) => update("sample_tests", t)}
            />
            <TestsTable
              title="Hidden tests (used at submit)"
              tests={form.hidden_tests}
              onChange={(t) => update("hidden_tests", t)}
            />
          </div>
        </TabsContent>

        <TabsContent value="sql">
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <Label>Enable SQL spec</Label>
              <Switch
                checked={!!form.sql_spec}
                onCheckedChange={(v) =>
                  update(
                    "sql_spec",
                    v
                      ? {
                          schema_sql: "",
                          seed_sql: "",
                          reference_query: "",
                          order_matters: false,
                          starter: "",
                        }
                      : null,
                  )
                }
              />
            </div>
            {form.sql_spec && (
              <>
                <SqlField
                  label="Schema (CREATE TABLE…)"
                  value={form.sql_spec.schema_sql}
                  onChange={(v) =>
                    update("sql_spec", { ...form.sql_spec!, schema_sql: v })
                  }
                />
                <SqlField
                  label="Seed (INSERT…)"
                  value={form.sql_spec.seed_sql}
                  onChange={(v) =>
                    update("sql_spec", { ...form.sql_spec!, seed_sql: v })
                  }
                />
                <SqlField
                  label="Reference query"
                  value={form.sql_spec.reference_query}
                  onChange={(v) =>
                    update("sql_spec", { ...form.sql_spec!, reference_query: v })
                  }
                />
                <SqlField
                  label="Starter SQL"
                  value={form.sql_spec.starter}
                  onChange={(v) =>
                    update("sql_spec", { ...form.sql_spec!, starter: v })
                  }
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.sql_spec.order_matters}
                    onCheckedChange={(v) =>
                      update("sql_spec", { ...form.sql_spec!, order_matters: v })
                    }
                  />
                  <Label>Row order matters</Label>
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="limits">
          <Card className="grid gap-4 p-4 md:grid-cols-2">
            <div>
              <Label>CPU time limit (seconds)</Label>
              <Input
                type="number"
                step="0.5"
                value={form.cpu_time_limit_sec}
                onChange={(e) =>
                  update("cpu_time_limit_sec", Number(e.target.value))
                }
              />
            </div>
            <div>
              <Label>Memory limit (KB)</Label>
              <Input
                type="number"
                value={form.memory_limit_kb}
                onChange={(e) => update("memory_limit_kb", Number(e.target.value))}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
};

const ListEditor = ({
  title,
  items,
  onChange,
  placeholder,
}: {
  title: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) => {
  const [val, setVal] = useState("");
  return (
    <Card className="space-y-2 p-4">
      <Label>{title}</Label>
      <div className="flex gap-2">
        <Input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" && val.trim()) {
              e.preventDefault();
              onChange([...items, val.trim()]);
              setVal("");
            }
          }}
        />
        <Button
          variant="secondary"
          onClick={() => {
            if (val.trim()) {
              onChange([...items, val.trim()]);
              setVal("");
            }
          }}
        >
          Add
        </Button>
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm">
            <span>{it}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChange(items.filter((_, x) => x !== i))}
            >
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
};

const CodePerLanguage = ({
  value,
  onChange,
  activeLang,
  setActiveLang,
}: {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  activeLang: LangId;
  setActiveLang: (l: LangId) => void;
}) => {
  const lang = LANGUAGES.find((l) => l.id === activeLang)!;
  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((l) => (
          <Button
            key={l.id}
            variant={l.id === activeLang ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveLang(l.id)}
          >
            {l.label}
            {value[l.id] ? <span className="ml-2 text-xs">●</span> : null}
          </Button>
        ))}
      </div>
      <div className="h-[420px] overflow-hidden rounded-md border">
        <MonacoEditor
          value={value[activeLang] ?? ""}
          onChange={(v) => onChange({ ...value, [activeLang]: v })}
          language={lang.monaco}
        />
      </div>
    </Card>
  );
};

const TestsTable = ({
  title,
  tests,
  onChange,
}: {
  title: string;
  tests: { input: string; expected: string }[];
  onChange: (v: { input: string; expected: string }[]) => void;
}) => (
  <Card className="space-y-3 p-4">
    <div className="flex items-center justify-between">
      <Label>{title}</Label>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...tests, { input: "", expected: "" }])}
      >
        <Plus className="mr-2 h-4 w-4" /> Add test
      </Button>
    </div>
    {tests.length === 0 && (
      <p className="text-sm text-muted-foreground">No tests yet.</p>
    )}
    {tests.map((t, i) => (
      <div key={i} className="grid gap-2 rounded-md border p-2 md:grid-cols-[1fr_1fr_auto]">
        <Textarea
          rows={3}
          placeholder="stdin"
          value={t.input}
          onChange={(e) => {
            const next = [...tests];
            next[i] = { ...t, input: e.target.value };
            onChange(next);
          }}
          className="font-mono text-xs"
        />
        <Textarea
          rows={3}
          placeholder="expected stdout"
          value={t.expected}
          onChange={(e) => {
            const next = [...tests];
            next[i] = { ...t, expected: e.target.value };
            onChange(next);
          }}
          className="font-mono text-xs"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(tests.filter((_, x) => x !== i))}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    ))}
  </Card>
);

const SqlField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <Label>{label}</Label>
    <Textarea
      rows={5}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="font-mono text-xs"
    />
  </div>
);

export default ProblemEditor;
