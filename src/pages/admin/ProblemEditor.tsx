import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  FullProblemPayload,
  useAdminProblem,
  useSaveProblem,
} from "@/hooks/useAdminProblems";
import { useLastPublishEvent } from "@/hooks/useLastPublishEvent";
import { useDistinctTopics } from "@/hooks/useDistinctTopics";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LANGUAGES, type LangId } from "@/data/codingProblemsData";
import { MonacoEditor, type MonacoEditorHandle } from "@/components/coding/MonacoEditor";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  X,
  Globe,
  EyeOff,
  AlertCircle,
  ExternalLink,
  Copy,
  Wand2,
  Upload,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
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
import { formatRelative } from "@/lib/formatRelative";
import { validateProblem, TAB_LABELS, type TabId } from "@/lib/admin/problemValidation";
import { TabBadge } from "@/components/admin/editor/TabBadge";
import { PublishChecklistDialog } from "@/components/admin/editor/PublishChecklistDialog";
import { useFieldHighlight, fieldHighlightClass } from "@/hooks/useFieldHighlight";
import { MarkdownToolbar } from "@/components/admin/editor/MarkdownToolbar";
import { MarkdownEditor } from "@/components/admin/editor/MarkdownEditor";
import { BulkTestsDialog } from "@/components/admin/editor/BulkTestsDialog";
import { BulkExamplesDialog } from "@/components/admin/editor/BulkExamplesDialog";
import { RunReferenceButton } from "@/components/admin/editor/RunReferenceButton";
import { RunHistoryPanel } from "@/components/admin/editor/RunHistoryPanel";
import { useRunHistory, buildLineDiff, type RunHistoryCase } from "@/hooks/useRunHistory";
import { HintsPreview } from "@/components/admin/editor/HintsPreview";
import { scaffoldStarterFromReference } from "@/lib/admin/codeScaffold";
import { supabase } from "@/integrations/supabase/client";

const ACTIVE_TAB_KEY = "admin:problem-editor:tab";

const COMMON_CONSTRAINT_PRESETS = [
  "1 <= n <= 10^5",
  "1 <= n <= 10^9",
  "-10^9 <= a[i] <= 10^9",
  "1 <= a[i] <= 10^4",
  "All values are unique",
  "The answer is guaranteed to fit in a 32-bit integer",
];

const LIMIT_PRESETS = [
  { label: "Fast (1s / 128 MB)", cpu: 1, mem: 128000 },
  { label: "Default (2s / 256 MB)", cpu: 2, mem: 256000 },
  { label: "Heavy (5s / 512 MB)", cpu: 5, mem: 512000 },
];

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
  const { data: loaded, isLoading, error: loadError } = useAdminProblem(slug);
  const save = useSaveProblem();
  const { data: lastPublishEvent } = useLastPublishEvent(slug);
  const [form, setForm] = useState<FullProblemPayload>(emptyPayload());
  const [topicInput, setTopicInput] = useState("");
  const [activeLang, setActiveLang] = useState<LangId>("python");
  const [dirty, setDirty] = useState(false);
  const [slugTaken, setSlugTaken] = useState(false);
  const [draftRestoredAt, setDraftRestoredAt] = useState<string | null>(null);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  // Tick every 15s so the "Draft saved Xs ago" label stays fresh.
  const [, setNowTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setNowTick((n) => n + 1), 15000);
    return () => window.clearInterval(id);
  }, []);
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    try {
      const t = localStorage.getItem(ACTIVE_TAB_KEY) as TabId | null;
      return t ?? "basics";
    } catch { return "basics"; }
  });
  const [publishOpen, setPublishOpen] = useState(false);
  const [refValidation, setRefValidation] = useState<{
    running: boolean;
    results: { idx: number; pass: boolean; got: string; expected: string }[] | null;
  }>({ running: false, results: null });
  const descRef = useRef<HTMLTextAreaElement>(null);
  const { data: distinctTopics } = useDistinctTopics();
  const report = useMemo(() => validateProblem(form), [form]);
  const runHistory = useRunHistory(slug ?? "");
  const { highlightedField, flash: flashField } = useFieldHighlight();

  const jumpToField = (field: string, tab: TabId) => {
    setActiveTab(tab);
    setPublishOpen(false);
    // Wait for the tab content to mount before scrolling/focusing.
    requestAnimationFrame(() => flashField(field));
  };

  useEffect(() => {
    try { localStorage.setItem(ACTIVE_TAB_KEY, activeTab); } catch {}
  }, [activeTab]);

  // Restore localStorage draft on first mount (works for new + existing problems).
  // For existing problems we wait until the loaded problem arrives so we can compare.
  const draftLoadedRef = useRef(false);
  useEffect(() => {
    if (draftLoadedRef.current) return;
    if (!isNew && !loaded?.problem) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY(slug));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.form) {
        draftLoadedRef.current = true;
        setForm(parsed.form);
        setDraftRestoredAt(parsed.savedAt ?? null);
        setLastDraftSavedAt(parsed.savedAt ?? null);
        setDirty(true);
      }
    } catch (_) {}
  }, [isNew, loaded, slug]);

  useEffect(() => {
    if (loaded?.problem && !draftLoadedRef.current) {
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

  const discardDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY(slug)); } catch (_) {}
    setDraftRestoredAt(null);
    setLastDraftSavedAt(null);
    draftLoadedRef.current = false;
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
    } else {
      setForm(emptyPayload());
    }
    setDirty(false);
    toast({ title: "Draft discarded" });
  };

  // Autosave drafts to localStorage every 3 seconds while dirty (any problem).
  useEffect(() => {
    if (!dirty) return;
    const id = window.setTimeout(() => {
      try {
        const savedAt = new Date().toISOString();
        localStorage.setItem(
          DRAFT_KEY(slug),
          JSON.stringify({ form, savedAt }),
        );
        setLastDraftSavedAt(savedAt);
      } catch (_) {}
    }, 3000);
    return () => window.clearTimeout(id);
  }, [form, dirty, slug]);

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
    try {
      await save.mutateAsync(cleaned);
    } catch (err: any) {
      // Surface exact server / validation error
      const code = err?.code ? ` [${err.code}]` : "";
      const details = err?.details ?? err?.hint ?? "";
      const message = err?.message ?? "Unknown error";
      toast({
        title: `Save failed${code}`,
        description: details ? `${message} — ${details}` : message,
        variant: "destructive",
      });
      // Also log full error for debugging
      console.error("[ProblemEditor] Save failed", err);
      return;
    }
    setDirty(false);
    try {
      localStorage.removeItem(DRAFT_KEY(slug));
      // For brand-new problems, also clear the temp "__new__" draft so the next /new is empty.
      if (isNew) localStorage.removeItem(DRAFT_KEY(undefined));
    } catch (_) {}
    setLastDraftSavedAt(null);
    setDraftRestoredAt(null);
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
        <div className="mx-auto max-w-3xl space-y-3 p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> 
          </div>
          <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-32 w-full animate-pulse rounded bg-muted" />
          <div className="h-32 w-full animate-pulse rounded bg-muted" />
        </div>
      </AdminShell>
    );
  }

  if (!isNew && (loadError || (!isLoading && !loaded?.problem))) {
    const isNotFound =
      !loadError &&
      !loaded?.problem;
    return (
      <AdminShell>
        <div className="mx-auto max-w-xl rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
          <h2 className="text-lg font-semibold">
            {isNotFound ? "Problem not found" : "Couldn’t load problem"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isNotFound ? (
              <>
                No problem exists with slug <code className="rounded bg-muted px-1">{slug}</code>.
                It may have been deleted or renamed.
              </>
            ) : (
              <>{(loadError as Error)?.message ?? "An unexpected error occurred."}</>
            )}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={() => nav("/admin/problems")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to problems
            </Button>
            {!isNotFound && (
              <Button onClick={() => window.location.reload()}>Retry</Button>
            )}
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => nav("/admin/problems")} aria-label="Back to problems">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">
            {isNew ? "New Problem" : `Edit: ${form.title || form.slug}`}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {dirty && lastDraftSavedAt && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-500"
              title={`Auto-saved at ${new Date(lastDraftSavedAt).toLocaleString()}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Draft saved {formatRelative(lastDraftSavedAt)}
            </span>
          )}
          {dirty && !lastDraftSavedAt && (
            <span className="text-xs text-amber-500">● Unsaved — autosave in a moment…</span>
          )}
          {!dirty && draftRestoredAt && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              Draft restored from {formatRelative(draftRestoredAt)}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[11px]"
                onClick={discardDraft}
              >
                Discard
              </Button>
            </span>
          )}
          {form.is_published ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <EyeOff className="mr-2 h-4 w-4" /> Unpublish
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unpublish this problem?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Learners will no longer see "{form.title || form.slug}" in the
                    library. Existing submissions are kept. You can re-publish at any
                    time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => update("is_published", false)}>
                    Unpublish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <PublishChecklistDialog
              open={publishOpen}
              onOpenChange={setPublishOpen}
              report={report}
              onJumpTo={(t) => { setActiveTab(t); setPublishOpen(false); }}
              onJumpToField={jumpToField}
              onConfirm={() => { update("is_published", true); setPublishOpen(false); }}
              trigger={
                <Button
                  variant="default"
                  size="sm"
                  disabled={!form.title.trim() || !form.slug.trim()}
                >
                  <Globe className="mr-2 h-4 w-4" /> Publish
                  {!report.canPublish && (
                    <Badge variant="outline" className="ml-2 border-destructive/50 text-destructive">
                      {report.blockingErrors.length}
                    </Badge>
                  )}
                </Button>
              }
            />
          )}
          {!isNew && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/library/problems/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" /> View as learner
              </a>
            </Button>
          )}
          <Button onClick={handleSave} disabled={save.isPending || (isNew && slugTaken)}>
            <Save className="mr-2 h-4 w-4" />
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div
        className={`sticky top-2 z-30 mb-4 flex items-start gap-3 rounded-lg border p-3 text-sm shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70 ${
          form.is_published
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-amber-500/30 bg-amber-500/5"
        }`}
        role="status"
        aria-live="polite"
      >
        {form.is_published ? (
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">
              {form.is_published ? "Published" : "Draft — not visible to learners"}
            </p>
            <Badge
              variant="outline"
              className={
                form.is_published
                  ? "border-emerald-500/40 text-emerald-500"
                  : "border-amber-500/40 text-amber-500"
              }
            >
              {form.is_published ? "Live" : "Draft"}
            </Badge>
            {lastPublishEvent && (
              <span className="text-xs text-muted-foreground">
                Last {lastPublishEvent.action === "publish" ? "published" : "unpublished"}{" "}
                <time dateTime={lastPublishEvent.created_at} title={new Date(lastPublishEvent.created_at).toLocaleString()}>
                  {formatRelative(lastPublishEvent.created_at)}
                </time>
              </span>
            )}
            {!lastPublishEvent && !isNew && (
              <span className="text-xs text-muted-foreground">
                No publish history yet
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {form.is_published
              ? "Visible to all learners. Edits save as drafts here until you press Save."
              : isNew
                ? "New problems save as Private. After saving you can publish them to the library or attach them to a contest from the Problems list."
                : "Private — visible only to admins and to registered contestants while attached to a live contest. Press Publish above to make it live in the library."}
          </p>
        </div>
        {dirty && (
          <Badge variant="outline" className="border-amber-500/40 text-amber-500">
            Unsaved
          </Badge>
        )}
      </div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
        <TabsList className="flex flex-wrap h-auto">
          {(Object.keys(TAB_LABELS) as TabId[]).map((id) => (
            <TabsTrigger key={id} value={id}>
              {TAB_LABELS[id]}
              <TabBadge status={report.sections[id].status} />
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="basics">
          <Card className="space-y-4 p-4">
            <div>
              <Label htmlFor="problem-editor-title">Title</Label>
              <Input
                id="problem-editor-title"
                data-field="title"
                className={fieldHighlightClass("title", highlightedField)}
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
              <Label htmlFor="problem-editor-slug">Slug</Label>
              {isNew ? (
                <>
                  <Input
                    id="problem-editor-slug"
                    data-field="slug"
                    className={fieldHighlightClass("slug", highlightedField)}
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
              {form.slug && (
                <div className="mt-2 flex items-center gap-2 rounded-md border border-dashed bg-muted/20 px-2 py-1.5 text-xs text-muted-foreground">
                  <span className="truncate">
                    Public URL: <code className="font-mono">/library/problems/{form.slug}</code>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-6 w-6"
                    aria-label="Copy public URL"
                    onClick={() => {
                      navigator.clipboard.writeText(`${location.origin}/library/problems/${form.slug}`);
                      toast({ title: "Copied", description: "Public URL copied to clipboard." });
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="problem-editor-difficulty">Difficulty</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v: any) => update("difficulty", v)}
              >
                <SelectTrigger id="problem-editor-difficulty"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2">
                <Badge
                  className={
                    form.difficulty === "easy"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                      : form.difficulty === "medium"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                      : "border-destructive/40 bg-destructive/10 text-destructive"
                  }
                  variant="outline"
                >
                  Preview: {form.difficulty.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <Label htmlFor="problem-editor-topics">Topics</Label>
              <div className="flex gap-2">
                <Input
                  id="problem-editor-topics"
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
                      aria-label={`Remove topic ${t}`}
                      onClick={() => update("topics", form.topics.filter((x) => x !== t))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {distinctTopics && distinctTopics.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs text-muted-foreground">Suggested (click to add)</p>
                  <div className="flex flex-wrap gap-1">
                    {distinctTopics
                      .filter((t) => !form.topics.includes(t))
                      .slice(0, 18)
                      .map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => update("topics", [...form.topics, t])}
                          className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground hover:border-solid hover:bg-accent hover:text-accent-foreground"
                        >
                          + {t}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="statement">
          <MarkdownEditor
            value={form.description}
            onChange={(v) => update("description", v)}
            slug={form.slug || undefined}
            fieldId="description"
            highlightClassName={fieldHighlightClass("description", highlightedField)}
            onInsertExamples={() => {
              const real = form.examples.filter((e) => e.input || e.output);
              if (!real.length) {
                toast({ title: "No examples", description: "Add examples first.", variant: "destructive" });
                return;
              }
              const md =
                "\n\n## Examples\n\n" +
                real
                  .map(
                    (ex, i) =>
                      `**Example ${i + 1}**\n\n\`\`\`\nInput: ${ex.input}\nOutput: ${ex.output}${
                        ex.explanation ? `\nExplanation: ${ex.explanation}` : ""
                      }\n\`\`\``,
                  )
                  .join("\n\n") + "\n";
              update("description", form.description + md);
              toast({ title: "Inserted", description: `${real.length} example(s) appended.` });
            }}
          />
        </TabsContent>

        <TabsContent value="examples">
          <Card className="space-y-3 p-4">
            {form.examples.map((ex, i) => (
              <div key={i} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Example {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={i === 0}
                      onClick={() => {
                        const next = [...form.examples];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        update("examples", next);
                      }}
                      aria-label={`Move example ${i + 1} up`}
                      title="Move up"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={i === form.examples.length - 1}
                      onClick={() => {
                        const next = [...form.examples];
                        [next[i + 1], next[i]] = [next[i], next[i + 1]];
                        update("examples", next);
                      }}
                      aria-label={`Move example ${i + 1} down`}
                      title="Move down"
                    >
                      ↓
                    </Button>
                    <RunReferenceButton
                      source={form.reference_solution[activeLang] ?? ""}
                      language={activeLang}
                      stdin={ex.input}
                      expected={ex.output}
                      label={`Run (${activeLang})`}
                      onResult={(out) => {
                        const next = [...form.examples];
                        next[i] = { ...ex, output: out };
                        update("examples", next);
                      }}
                      onSavedRun={(res) => {
                        const got = res.stdout;
                        const expected = (ex.output ?? "").trimEnd();
                        const pass = got === expected;
                        runHistory.append({
                          kind: "run-example",
                          language: activeLang,
                          label: `Example ${i + 1}`,
                          passed: pass ? 1 : 0,
                          total: 1,
                          note: res.stderr ? `stderr: ${res.stderr.slice(0, 120)}` : undefined,
                          cases: [
                            {
                              index: i,
                              pass,
                              input: ex.input,
                              expected,
                              got,
                              diff: pass ? undefined : buildLineDiff(expected, got),
                            },
                          ],
                        });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove example ${i + 1}`}
                      onClick={() =>
                        update("examples", form.examples.filter((_, x) => x !== i))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <Textarea
                    rows={3}
                    placeholder="Input"
                    data-field={`examples[${i}].input`}
                    value={ex.input}
                    onChange={(e) => {
                      const next = [...form.examples];
                      next[i] = { ...ex, input: e.target.value };
                      update("examples", next);
                    }}
                    className={`font-mono text-xs ${fieldHighlightClass(`examples[${i}].input`, highlightedField)}`}
                  />
                  <Textarea
                    rows={3}
                    placeholder="Output"
                    data-field={`examples[${i}].output`}
                    value={ex.output}
                    onChange={(e) => {
                      const next = [...form.examples];
                      next[i] = { ...ex, output: e.target.value };
                      update("examples", next);
                    }}
                    className={`font-mono text-xs ${fieldHighlightClass(`examples[${i}].output`, highlightedField)}`}
                  />
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
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  update("examples", [...form.examples, { input: "", output: "" }])
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add example
              </Button>
              <BulkExamplesDialog
                existing={form.examples.filter((e) => e.input || e.output)}
                onAdd={(added) => update("examples", [...form.examples, ...added])}
                onReplace={(items) => update("examples", items.length ? items : [{ input: "", output: "" }])}
                trigger={
                  <Button variant="outline" type="button">
                    <Upload className="mr-2 h-4 w-4" /> Import / export JSON
                  </Button>
                }
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="constraints">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="space-y-3 p-4">
              <ListEditor
                title="Constraints"
                items={form.constraints}
                onChange={(v) => update("constraints", v)}
                placeholder="1 <= n <= 10^5"
                fieldPrefix="constraints"
                highlightedField={highlightedField}
                multiline
                inline
              />
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Quick presets</p>
                <div className="flex flex-wrap gap-1">
                  {COMMON_CONSTRAINT_PRESETS.filter((p) => !form.constraints.includes(p)).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => update("constraints", [...form.constraints, p])}
                      className="rounded-full border border-dashed px-2 py-0.5 font-mono text-xs text-muted-foreground hover:border-solid hover:bg-accent hover:text-accent-foreground"
                    >
                      + {p}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <ListEditor
                title="Hints (revealed in order)"
                items={form.hints}
                onChange={(v) => update("hints", v)}
                placeholder="Try a hash map…"
                fieldPrefix="hints"
                highlightedField={highlightedField}
                numbered
                multiline
                inline
              />
            </Card>
            <div className="md:col-span-2">
              <HintsPreview hints={form.hints} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="starter">
          <CodePerLanguage
            value={form.starter_code}
            onChange={(v) => update("starter_code", v)}
            fieldPrefix="starter_code"
            highlightedField={highlightedField}
            activeLang={activeLang}
            setActiveLang={setActiveLang}
            extraActions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    const ref = form.reference_solution[activeLang];
                    if (!ref?.trim()) {
                      toast({ title: "No reference", description: `Add a ${activeLang} reference solution first.`, variant: "destructive" });
                      return;
                    }
                    update("starter_code", { ...form.starter_code, [activeLang]: scaffoldStarterFromReference(activeLang, ref) });
                    toast({ title: "Scaffold generated", description: "Review the body and adjust as needed." });
                  }}
                >
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" /> Generate from reference
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" type="button">
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy from…
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {LANGUAGES.filter((l) => l.id !== activeLang && (form.starter_code[l.id] ?? "").trim()).map((l) => (
                      <DropdownMenuItem
                        key={l.id}
                        onClick={() =>
                          update("starter_code", { ...form.starter_code, [activeLang]: form.starter_code[l.id] })
                        }
                      >
                        {l.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            }
          />
        </TabsContent>

        <TabsContent value="reference">
          <CodePerLanguage
            value={form.reference_solution}
            onChange={(v) => update("reference_solution", v)}
            fieldPrefix="reference_solution"
            highlightedField={highlightedField}
            activeLang={activeLang}
            setActiveLang={setActiveLang}
            extraActions={
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={refValidation.running}
                onClick={async () => {
                  const ref = form.reference_solution[activeLang];
                  if (!ref?.trim()) { toast({ title: "No reference", variant: "destructive" }); return; }
                  if (!form.sample_tests.length) { toast({ title: "No sample tests" }); return; }
                  setRefValidation({ running: true, results: null });
                  const langInfo = LANGUAGES.find((l) => l.id === activeLang)!;
                  const results: { idx: number; pass: boolean; got: string; expected: string }[] = [];
                  for (let i = 0; i < form.sample_tests.length; i++) {
                    const t = form.sample_tests[i];
                    try {
                      const { data } = await supabase.functions.invoke("run-code", {
                        body: { source_code: ref, language_id: langInfo.judge0Id, language: activeLang, stdin: t.input },
                      });
                      const payload = (data as any)?.data ?? data;
                      const got = ((payload?.stdout ?? "") as string).trimEnd();
                      results.push({ idx: i, pass: got === t.expected.trimEnd(), got, expected: t.expected });
                    } catch (err: any) {
                      results.push({ idx: i, pass: false, got: `ERROR: ${err?.message ?? "?"}`, expected: t.expected });
                    }
                  }
                  setRefValidation({ running: false, results });
                  const ok = results.filter((r) => r.pass).length;
                  // Save to run history for troubleshooting / diff comparison.
                  runHistory.append({
                    kind: "validate-samples",
                    language: activeLang,
                    label: "Validate against samples",
                    passed: ok,
                    total: results.length,
                    cases: results.map<RunHistoryCase>((r) => ({
                      index: r.idx,
                      pass: r.pass,
                      input: form.sample_tests[r.idx]?.input ?? "",
                      expected: (r.expected ?? "").trimEnd(),
                      got: r.got,
                      diff: r.pass ? undefined : buildLineDiff((r.expected ?? "").trimEnd(), r.got),
                    })),
                  });
                  toast({ title: `Reference: ${ok}/${results.length} passed`, description: "Saved to run history." });
                }}
              >
                {refValidation.running ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
                Validate against samples
              </Button>
            }
            footer={
              refValidation.results && (
                <div className="space-y-1 rounded-md border bg-muted/20 p-2 text-xs">
                  {refValidation.results.map((r) => (
                    <div key={r.idx} className="flex items-start gap-2">
                      {r.pass ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 text-destructive" />}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">Sample #{r.idx + 1} — {r.pass ? "pass" : "fail"}</p>
                        {!r.pass && (
                          <pre className="mt-0.5 max-h-24 overflow-auto whitespace-pre-wrap font-mono text-[10px] text-muted-foreground">
                            expected: {r.expected}
                            {"\n"}got: {r.got}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          />
          <div className="mt-4">
            <RunHistoryPanel
              entries={runHistory.entries}
              onClear={runHistory.clear}
              onRemove={runHistory.remove}
            />
          </div>
        </TabsContent>

        <TabsContent value="tests">
          <div className="space-y-4">
            <TestsTable
              title="Sample tests"
              subtitle="visible to user"
              tests={form.sample_tests}
              onChange={(t) => update("sample_tests", t)}
              referenceSource={form.reference_solution[activeLang] ?? ""}
              referenceLang={activeLang}
              fieldKey="sample_tests"
              highlightedField={highlightedField}
              onSaveRun={(idx, t, res) => {
                const expected = (t.expected ?? "").trimEnd();
                const got = res.stdout;
                const pass = got === expected;
                runHistory.append({
                  kind: "run-test",
                  language: activeLang,
                  label: `Sample test #${idx + 1}`,
                  passed: pass ? 1 : 0,
                  total: 1,
                  note: res.stderr ? `stderr: ${res.stderr.slice(0, 120)}` : undefined,
                  cases: [{
                    index: idx,
                    pass,
                    input: t.input,
                    expected,
                    got,
                    diff: pass ? undefined : buildLineDiff(expected, got),
                  }],
                });
              }}
            />
            <TestsTable
              title="Hidden tests"
              subtitle="used at submit"
              tests={form.hidden_tests}
              onChange={(t) => update("hidden_tests", t)}
              referenceSource={form.reference_solution[activeLang] ?? ""}
              referenceLang={activeLang}
              fieldKey="hidden_tests"
              highlightedField={highlightedField}
              onSaveRun={(idx, t, res) => {
                const expected = (t.expected ?? "").trimEnd();
                const got = res.stdout;
                const pass = got === expected;
                runHistory.append({
                  kind: "run-test",
                  language: activeLang,
                  label: `Hidden test #${idx + 1}`,
                  passed: pass ? 1 : 0,
                  total: 1,
                  note: res.stderr ? `stderr: ${res.stderr.slice(0, 120)}` : undefined,
                  cases: [{
                    index: idx,
                    pass,
                    input: t.input,
                    expected,
                    got,
                    diff: pass ? undefined : buildLineDiff(expected, got),
                  }],
                });
              }}
            />
            <RunHistoryPanel
              entries={runHistory.entries}
              onClear={runHistory.clear}
              onRemove={runHistory.remove}
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
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.sql_spec.order_matters}
                      onCheckedChange={(v) =>
                        update("sql_spec", { ...form.sql_spec!, order_matters: v })
                      }
                    />
                    <Label>Row order matters</Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const { data } = await supabase.functions.invoke("run-sql", {
                          body: {
                            source_code: form.sql_spec!.reference_query,
                            language: "sql",
                            schema: form.sql_spec!.schema_sql,
                            seed: form.sql_spec!.seed_sql,
                          },
                        });
                        const payload = (data as any)?.data ?? data;
                        const out = (payload?.stdout ?? "").toString();
                        const stderr = (payload?.stderr ?? "").toString();
                        if (stderr && !out) {
                          toast({ title: "SQL error", description: stderr.slice(0, 300), variant: "destructive" });
                          return;
                        }
                        toast({ title: "Reference query ran", description: out.slice(0, 300) || "(no rows)" });
                      } catch (err: any) {
                        toast({ title: "Run failed", description: err?.message, variant: "destructive" });
                      }
                    }}
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5" /> Run reference query
                  </Button>
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="limits">
          <Card className="space-y-4 p-4">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Presets</p>
              <div className="flex flex-wrap gap-2">
                {LIMIT_PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    variant={form.cpu_time_limit_sec === p.cpu && form.memory_limit_kb === p.mem ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      update("cpu_time_limit_sec", p.cpu);
                      update("memory_limit_kb", p.mem);
                    }}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="problem-editor-cpu-limit">CPU time limit (seconds)</Label>
                <Input
                  id="problem-editor-cpu-limit"
                  data-field="cpu_time_limit_sec"
                  className={fieldHighlightClass("cpu_time_limit_sec", highlightedField)}
                  type="number"
                  step="0.5"
                  value={form.cpu_time_limit_sec}
                  onChange={(e) =>
                    update("cpu_time_limit_sec", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <Label htmlFor="problem-editor-memory-limit">Memory limit (KB)</Label>
                <Input
                  id="problem-editor-memory-limit"
                  data-field="memory_limit_kb"
                  className={fieldHighlightClass("memory_limit_kb", highlightedField)}
                  type="number"
                  value={form.memory_limit_kb}
                  onChange={(e) => update("memory_limit_kb", Number(e.target.value))}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  ≈ {Math.round((form.memory_limit_kb ?? 0) / 1024)} MB
                </p>
              </div>
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
  numbered,
  inline,
  fieldPrefix,
  highlightedField,
  multiline,
}: {
  title: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  numbered?: boolean;
  inline?: boolean;
  /** Validation field id base, e.g. "constraints" or "hints". When set, each row
   *  exposes data-field="<prefix>[i]" and gets the highlight ring. */
  fieldPrefix?: string;
  highlightedField?: string | null;
  /** Use a textarea instead of an input for inline editing (preserves newlines). */
  multiline?: boolean;
}) => {
  const [val, setVal] = useState("");
  const [editing, setEditing] = useState<{ idx: number; value: string } | null>(null);
  const Wrapper: any = inline ? "div" : Card;
  const groupId = `${fieldPrefix ?? title.toLowerCase()}-listeditor`;

  // When the validation flash targets one of our rows, automatically open it
  // for editing so the admin can fix the failing content in-place.
  useEffect(() => {
    if (!fieldPrefix || !highlightedField) return;
    const m = highlightedField.match(/^([^\[]+)\[(\d+)\]$/);
    if (!m || m[1] !== fieldPrefix) return;
    const idx = Number(m[2]);
    if (!Number.isFinite(idx) || idx < 0 || idx >= items.length) return;
    setEditing((prev) => (prev?.idx === idx ? prev : { idx, value: items[idx] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedField, fieldPrefix]);

  const commitEditing = () => {
    if (!editing) return;
    const v = editing.value.replace(/[ \t]+$/gm, "").replace(/\s+$/g, "");
    if (v) {
      const next = [...items];
      next[editing.idx] = v;
      onChange(next);
    } else {
      // empty value removes the row
      onChange(items.filter((_, x) => x !== editing.idx));
    }
    setEditing(null);
  };

  return (
    <Wrapper className={inline ? "space-y-2" : "space-y-2 p-4"} data-field={fieldPrefix} id={groupId}>
      <Label htmlFor={`${groupId}-input`}>{title}</Label>
      <div className="flex gap-2">
        <Input
          id={`${groupId}-input`}
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
        {items.map((it, i) => {
          const fid = fieldPrefix ? `${fieldPrefix}[${i}]` : undefined;
          const highlighted = !!fid && highlightedField === fid;
          const isEditing = editing?.idx === i;
          return (
            <li
              key={i}
              data-field={fid}
              className={`flex items-start justify-between gap-2 rounded-md bg-muted px-3 py-1.5 text-sm ${
                fid ? fieldHighlightClass(fid, highlightedField ?? null) : ""
              } ${highlighted ? "border border-destructive/50" : ""}`}
            >
              {isEditing ? (
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Textarea
                    autoFocus
                    rows={multiline ? 3 : 1}
                    value={editing!.value}
                    onChange={(e) => setEditing({ idx: i, value: e.target.value })}
                    onBlur={commitEditing}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setEditing(null);
                      }
                      // Cmd/Ctrl+Enter saves; Enter alone inserts a newline
                      // when multi-line, otherwise saves.
                      if (e.key === "Enter") {
                        if (e.metaKey || e.ctrlKey || !multiline) {
                          e.preventDefault();
                          (e.target as HTMLTextAreaElement).blur();
                        }
                      }
                    }}
                    className="min-h-[36px] resize-y font-mono text-xs leading-relaxed"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {multiline ? "Enter for newline · " : ""}⌘/Ctrl+Enter to save · Esc to cancel · empty = delete
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing({ idx: i, value: it })}
                  className="min-w-0 flex-1 whitespace-pre-wrap break-words text-left hover:underline"
                  title="Click to edit"
                >
                  {numbered && <span className="mr-2 text-xs text-muted-foreground">Hint {i + 1}</span>}
                  {it}
                </button>
              )}
              <div className="flex shrink-0 items-center gap-1">
                {numbered && (
                  <>
                    <Button variant="ghost" size="icon" disabled={i === 0} aria-label={`Move ${title.toLowerCase()} ${i + 1} up`} onClick={() => {
                      const next = [...items];
                      [next[i - 1], next[i]] = [next[i], next[i - 1]];
                      onChange(next);
                    }}>↑</Button>
                    <Button variant="ghost" size="icon" disabled={i === items.length - 1} aria-label={`Move ${title.toLowerCase()} ${i + 1} down`} onClick={() => {
                      const next = [...items];
                      [next[i + 1], next[i]] = [next[i], next[i + 1]];
                      onChange(next);
                    }}>↓</Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${title.toLowerCase()} ${i + 1}`}
                  onClick={() => onChange(items.filter((_, x) => x !== i))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Wrapper>
  );
};

const CodePerLanguage = ({
  value,
  onChange,
  activeLang,
  setActiveLang,
  extraActions,
  footer,
  fieldPrefix,
  highlightedField,
}: {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  activeLang: LangId;
  setActiveLang: (l: LangId) => void;
  extraActions?: React.ReactNode;
  footer?: React.ReactNode;
  /** "starter_code" or "reference_solution" — drives data-field IDs. */
  fieldPrefix?: "starter_code" | "reference_solution";
  highlightedField?: string | null;
}) => {
  const lang = LANGUAGES.find((l) => l.id === activeLang)!;
  const editorRef = useRef<MonacoEditorHandle>(null);

  // If validation jumps to a per-language field for a non-active language,
  // switch tabs automatically so the editor surface shows the failing code.
  useEffect(() => {
    if (!fieldPrefix || !highlightedField) return;
    const prefix = `${fieldPrefix}.`;
    if (highlightedField.startsWith(prefix)) {
      const targetLang = highlightedField.slice(prefix.length) as LangId;
      if (targetLang && targetLang !== activeLang && LANGUAGES.some((l) => l.id === targetLang)) {
        setActiveLang(targetLang);
      }
    }
  }, [highlightedField, fieldPrefix, activeLang, setActiveLang]);

  const editorFieldId = fieldPrefix ? `${fieldPrefix}.${activeLang}` : undefined;
  const sectionFieldId = fieldPrefix;
  const editorHighlight = editorFieldId
    ? fieldHighlightClass(editorFieldId, highlightedField ?? null)
    : "";
  const sectionHighlight = sectionFieldId
    ? fieldHighlightClass(sectionFieldId, highlightedField ?? null)
    : "";

  return (
    <Card className={`space-y-3 p-4 ${sectionHighlight}`} data-field={sectionFieldId}>
      <div className="flex flex-wrap items-center gap-2">
        {LANGUAGES.map((l) => {
          const fid = fieldPrefix ? `${fieldPrefix}.${l.id}` : undefined;
          const isFailing = !!fid && highlightedField === fid && l.id !== activeLang;
          return (
            <Button
              key={l.id}
              data-field={fid}
              variant={l.id === activeLang ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveLang(l.id)}
              className={isFailing ? "ring-2 ring-destructive ring-offset-2 ring-offset-background" : ""}
            >
              {l.label}
              {value[l.id] ? <CheckCircle2 className="ml-1.5 h-3 w-3 text-emerald-500" /> : null}
            </Button>
          );
        })}
        <div className="ml-auto flex flex-wrap gap-2">
          {extraActions}
          <Button variant="ghost" size="sm" type="button" onClick={() => editorRef.current?.format()}>
            Format
          </Button>
        </div>
      </div>
      <div
        data-field={editorFieldId}
        className={`h-[420px] overflow-hidden rounded-md border ${editorHighlight}`}
      >
        <MonacoEditor
          ref={editorRef}
          value={value[activeLang] ?? ""}
          onChange={(v) => onChange({ ...value, [activeLang]: v })}
          language={lang.monaco}
        />
      </div>
      {footer}
    </Card>
  );
};

const TestsTable = ({
  title,
  subtitle,
  tests,
  onChange,
  referenceSource,
  referenceLang,
  onSaveRun,
  fieldKey,
  highlightedField,
}: {
  title: string;
  subtitle?: string;
  tests: { input: string; expected: string }[];
  onChange: (v: { input: string; expected: string }[]) => void;
  referenceSource?: string;
  referenceLang?: LangId;
  onSaveRun?: (
    idx: number,
    test: { input: string; expected: string },
    res: { stdout: string; stderr: string; ok: boolean; expected?: string },
  ) => void;
  /** "sample_tests" or "hidden_tests" — drives data-field IDs for jumping. */
  fieldKey?: "sample_tests" | "hidden_tests";
  highlightedField?: string | null;
}) => (
  <Card className="space-y-3 p-4">
    <div className="flex flex-wrap items-center gap-2">
      <Label className="flex items-center gap-2">
        {title}
        <Badge variant="secondary" className="ml-1">{tests.length}</Badge>
        {subtitle && <span className="text-xs font-normal text-muted-foreground">({subtitle})</span>}
      </Label>
      <div className="ml-auto flex flex-wrap gap-2">
        <BulkTestsDialog
          existing={tests}
          onAdd={(added) => onChange([...tests, ...added])}
          trigger={
            <Button variant="outline" size="sm" type="button">
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Bulk add
            </Button>
          }
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange([...tests, { input: "", expected: "" }])}
        >
          <Plus className="mr-2 h-4 w-4" /> Add test
        </Button>
      </div>
    </div>
    {tests.length === 0 && (
      <p className="text-sm text-muted-foreground">No tests yet.</p>
    )}
    {tests.map((t, i) => (
      <div key={i} className="space-y-2 rounded-md border p-2">
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <Textarea
            rows={3}
            placeholder="stdin"
            data-field={fieldKey ? `${fieldKey}[${i}].input` : undefined}
            value={t.input}
            onChange={(e) => {
              const next = [...tests];
              next[i] = { ...t, input: e.target.value };
              onChange(next);
            }}
            className={`font-mono text-xs ${fieldKey ? fieldHighlightClass(`${fieldKey}[${i}].input`, highlightedField ?? null) : ""}`}
          />
          <Textarea
            rows={3}
            placeholder="expected stdout"
            data-field={fieldKey ? `${fieldKey}[${i}].expected` : undefined}
            value={t.expected}
            onChange={(e) => {
              const next = [...tests];
              next[i] = { ...t, expected: e.target.value };
              onChange(next);
            }}
            className={`font-mono text-xs ${fieldKey ? fieldHighlightClass(`${fieldKey}[${i}].expected`, highlightedField ?? null) : ""}`}
          />
          <div className="flex flex-col gap-1">
            {referenceLang && (
              <RunReferenceButton
                source={referenceSource ?? ""}
                language={referenceLang}
                stdin={t.input}
                expected={t.expected}
                label="Fill expected"
                onResult={(out) => {
                  const next = [...tests];
                  next[i] = { ...t, expected: out };
                  onChange(next);
                }}
                onSavedRun={onSaveRun ? (res) => onSaveRun(i, t, res) : undefined}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${title.toLowerCase()} ${i + 1}`}
              onClick={() => onChange(tests.filter((_, x) => x !== i))}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
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
}) => {
  const inputId = useId();
  return (
    <div>
      <Label htmlFor={inputId}>{label}</Label>
      <Textarea
        id={inputId}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-xs"
      />
    </div>
  );
};

export default ProblemEditor;
