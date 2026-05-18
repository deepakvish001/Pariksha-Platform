import { useEffect, useMemo, useState } from "react";
import { Navigate, Routes, Route, useNavigate, useParams, Link } from "react-router-dom";
import { OrgShell } from "../layouts/OrgShell";
import { useMyOrganizations } from "../hooks/useOrg";
import { supabase } from "@/integrations/supabase/client";
import {
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useMcqOptions,
  useUpsertMcqOption,
  useDeleteMcqOption,
  useTestCases,
  useUpsertTestCase,
  useDeleteTestCase,
  type QuestionType,
  type Question,
  type McqOption,
} from "../hooks/useQuestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Trash2, Library, Search, Upload, Sparkles, X, Copy, Archive, ArchiveRestore, Download, ArrowLeft, ChevronRight, Code2, Database, ListChecks, PenLine, CheckSquare, Shuffle, Type as TypeIcon, Hash, SquareDashedBottom } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CodingWizard } from "../components/question-bank/CodingWizard";
import { SqlWizard } from "../components/question-bank/SqlWizard";
import { TYPE_CARDS } from "../components/question-bank/types";

const TYPES: { value: QuestionType; label: string }[] = [
  { value: "coding", label: "Coding" },
  { value: "mcq", label: "MCQ" },
  { value: "sql", label: "SQL" },
  { value: "subjective", label: "Subjective" },
  { value: "true_false", label: "True/False" },
  { value: "matching", label: "Matching" },
  { value: "short_answer", label: "Short answer" },
  { value: "numerical", label: "Numerical" },
  { value: "fill_blanks", label: "Fill in the blanks" },
];




const TYPE_ICONS: Record<string, typeof Code2> = {
  code: Code2, database: Database, list: ListChecks, pen: PenLine,
  check: CheckSquare, shuffle: Shuffle, type: TypeIcon, hash: Hash, blank: SquareDashedBottom,
};

function useBasePath(): string {
  // Strip everything from "/question-bank" onward to get the base ("/b2b" or "/companies/:slug")
  const path = typeof window !== "undefined" ? window.location.pathname : "/b2b/question-bank";
  const idx = path.indexOf("/question-bank");
  return idx >= 0 ? path.slice(0, idx) + "/question-bank" : "/b2b/question-bank";
}

export default function QuestionBank() {
  const { data: orgs, isLoading } = useMyOrganizations();
  const org = orgs?.[0];
  if (isLoading) return null;
  if (!orgs?.length) return <Navigate to="/b2b/onboarding" replace />;

  return (
    <Routes>
      <Route index element={<HubView org={org!} />} />
      <Route path=":type" element={<ListView org={org!} />} />
      <Route path=":type/new" element={<NewView org={org!} />} />
      <Route path=":type/:id" element={<EditView org={org!} />} />
    </Routes>
  );
}

// ─────────────────────────── HUB (cards per type) ───────────────────────────
function HubView({ org }: { org: { id: string; name?: string } }) {
  const { data: questions } = useQuestions(org.id);
  const base = useBasePath();

  const stats = useMemo(() => {
    const byType: Record<string, { total: number; published: number; draft: number; archived: number }> = {};
    TYPE_CARDS.forEach((c) => (byType[c.value] = { total: 0, published: 0, draft: 0, archived: 0 }));
    let total = 0, published = 0, draft = 0, archived = 0;
    (questions ?? []).forEach((q) => {
      const m = (q.meta ?? {}) as { status?: string; archived?: boolean };
      const bucket = byType[q.type] ?? (byType[q.type] = { total: 0, published: 0, draft: 0, archived: 0 });
      bucket.total++; total++;
      if (m.archived) { bucket.archived++; archived++; return; }
      if ((m.status ?? "published") === "draft") { bucket.draft++; draft++; } else { bucket.published++; published++; }
    });
    return { byType, total, published, draft, archived };
  }, [questions]);

  return (
    <OrgShell
      title="Question Bank"
      actions={
        <div className="flex items-center gap-2">
          <AIGenerateDialog orgId={org.id} />
          <ImportQuestionsDialog orgId={org.id} />
        </div>
      }
    >
      {/* KPI strip */}
      <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {([
          { label: "Total", value: stats.total, tone: "text-foreground" },
          { label: "Published", value: stats.published, tone: "text-emerald-600 dark:text-emerald-400" },
          { label: "Drafts", value: stats.draft, tone: "text-amber-600 dark:text-amber-400" },
          { label: "Archived", value: stats.archived, tone: "text-slate-500 dark:text-slate-400" },
        ] as const).map((k) => (
          <div key={k.label} className="b2b-card px-4 py-3 flex items-baseline justify-between gap-2">
            <span className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">{k.label}</span>
            <span className={`text-xl font-semibold tabular-nums ${k.tone}`}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Type cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TYPE_CARDS.map((card) => {
          const Icon = TYPE_ICONS[card.icon] ?? Library;
          const s = stats.byType[card.value] ?? { total: 0, published: 0, draft: 0, archived: 0 };
          return (
            <div
              key={card.value}
              className="b2b-card p-4 flex flex-col gap-3 hover:border-[hsl(var(--primary))]/60 transition-colors"
            >
              <Link to={`${base}/${card.value}`} className="flex items-start gap-3 group">
                <div className="h-10 w-10 rounded-md bg-[hsl(var(--secondary))] grid place-items-center text-[hsl(var(--primary))] shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold truncate group-hover:text-[hsl(var(--primary))]">{card.label}</div>
                    <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-2">{card.description}</p>
                </div>
              </Link>

              <div className="grid grid-cols-4 gap-1 text-center">
                {[
                  { label: "Total", value: s.total, tone: "text-foreground" },
                  { label: "Pub", value: s.published, tone: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Draft", value: s.draft, tone: "text-amber-600 dark:text-amber-400" },
                  { label: "Arch", value: s.archived, tone: "text-slate-500 dark:text-slate-400" },
                ].map((m) => (
                  <div key={m.label} className="rounded-md bg-[hsl(var(--secondary))/0.5] px-2 py-1.5">
                    <div className={`text-sm font-semibold tabular-nums ${m.tone}`}>{m.value}</div>
                    <div className="text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">{m.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`${base}/${card.value}`}>Open</Link>
                </Button>
                <Button asChild size="sm" className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
                  <Link to={`${base}/${card.value}/new`}>
                    <Plus className="h-4 w-4 mr-1" /> New
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </OrgShell>
  );
}

// ─────────────────────────── LIST (type-scoped) ───────────────────────────
function ListView({ org }: { org: { id: string; name?: string } }) {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const base = useBasePath();
  const typeKey = type as QuestionType;
  const validType = TYPES.some((t) => t.value === typeKey);

  const { data: questions } = useQuestions(org.id);
  const del = useDeleteQuestion();
  const upd = useUpdateQuestion();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [tierFilter, setTierFilter] = useState<"all" | "free" | "premium">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const typeCard = TYPE_CARDS.find((c) => c.value === typeKey);
  const typeQuestions = useMemo(
    () => (questions ?? []).filter((q) => q.type === typeKey),
    [questions, typeKey],
  );

  const duplicateQuestion = async (q: Question) => {
    setDuplicatingId(q.id);
    try {
      const { data: newQ, error: qErr } = await supabase
        .from("questions")
        .insert({
          org_id: q.org_id, type: q.type, title: `${q.title} (copy)`,
          body_md: q.body_md, language: q.language, starter_code: q.starter_code,
          points: q.points, meta: (q.meta ?? {}) as never,
        })
        .select("*").single();
      if (qErr || !newQ) throw qErr ?? new Error("Failed to duplicate question");

      const [opts, tests] = await Promise.all([
        supabase.from("mcq_options").select("*").eq("question_id", q.id).order("order_index", { ascending: true }),
        supabase.from("question_test_cases").select("*").eq("question_id", q.id).order("order_index", { ascending: true }),
      ]);
      if (opts.error) throw opts.error;
      if (tests.error) throw tests.error;
      if (opts.data?.length) {
        const { error } = await supabase.from("mcq_options").insert(
          opts.data.map((o) => ({ question_id: newQ.id, body: o.body, is_correct: o.is_correct, order_index: o.order_index })),
        );
        if (error) throw error;
      }
      if (tests.data?.length) {
        const { error } = await supabase.from("question_test_cases").insert(
          tests.data.map((t) => ({
            question_id: newQ.id, input: t.input, expected_output: t.expected_output,
            is_hidden: t.is_hidden, weight: t.weight, order_index: t.order_index,
          })),
        );
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["b2b", "questions", q.org_id] });
      toast.success("Question duplicated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to duplicate question");
    } finally {
      setDuplicatingId(null);
    }
  };

  const toggleArchive = async (q: Question) => {
    const meta = (q.meta ?? {}) as Record<string, unknown>;
    const isArchived = Boolean(meta.archived);
    try {
      await upd.mutateAsync({
        id: q.id,
        patch: { meta: { ...meta, archived: !isArchived } as Record<string, unknown> } as Partial<Question>,
      });
      toast.success(isArchived ? "Question restored" : "Question archived");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update question");
    }
  };

  const setTier = async (q: Question, tier: "free" | "premium") => {
    if ((q.tier ?? "free") === tier) return;
    try {
      await upd.mutateAsync({ id: q.id, patch: { tier } as Partial<Question> });
      toast.success(`Marked as ${tier === "premium" ? "Premium" : "Free"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update tier");
    }
  };

  const runBulkSetTier = async (tier: "free" | "premium") => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const results = await Promise.allSettled(
      ids.map((id) => upd.mutateAsync({ id, patch: { tier } as Partial<Question> })),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok) toast.success(`Marked ${ok} as ${tier === "premium" ? "Premium" : "Free"}`);
    if (failed) toast.error(`Failed ${failed}`);
  };

  // Export (scoped to current type)
  const csvEscape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "string" ? v : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const triggerDownload = (filename: string, mime: string, content: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };
  const exportAs = async (format: "json" | "csv") => {
    if (exporting || !typeQuestions.length) return;
    setExporting(true);
    try {
      const ids = typeQuestions.map((q) => q.id);
      const [optsRes, testsRes] = await Promise.all([
        supabase.from("mcq_options").select("*").in("question_id", ids),
        supabase.from("question_test_cases").select("*").in("question_id", ids),
      ]);
      if (optsRes.error) throw optsRes.error;
      if (testsRes.error) throw testsRes.error;
      const stamp = new Date().toISOString().slice(0, 10);
      const baseName = `questions-${typeKey}-${org.id.slice(0, 8)}-${stamp}`;
      if (format === "json") {
        triggerDownload(`${baseName}.json`, "application/json",
          JSON.stringify({ exported_at: new Date().toISOString(), org_id: org.id, type: typeKey, questions: typeQuestions, options: optsRes.data ?? [], testCases: testsRes.data ?? [] }, null, 2));
      } else {
        const optsByQ = new Map<string, typeof optsRes.data>();
        const testsByQ = new Map<string, typeof testsRes.data>();
        (optsRes.data ?? []).forEach((o) => { const a = optsByQ.get(o.question_id) ?? []; a.push(o); optsByQ.set(o.question_id, a); });
        (testsRes.data ?? []).forEach((t) => { const a = testsByQ.get(t.question_id) ?? []; a.push(t); testsByQ.set(t.question_id, a); });
        const headers = ["id","type","title","body_md","language","starter_code","points","meta","created_at","updated_at","mcq_options_json","test_cases_json"];
        const rows = typeQuestions.map((q) => [q.id,q.type,q.title,q.body_md,q.language,q.starter_code,q.points,q.meta,q.created_at,q.updated_at,optsByQ.get(q.id) ?? [],testsByQ.get(q.id) ?? []].map(csvEscape).join(","));
        triggerDownload(`${baseName}.csv`, "text/csv;charset=utf-8", [headers.join(","), ...rows].join("\n"));
      }
      toast.success(`Exported ${typeQuestions.length} question${typeQuestions.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to export questions");
    } finally {
      setExporting(false);
    }
  };

  const filtered = useMemo(() => {
    let list = typeQuestions;
    const isArchived = (q: Question) => Boolean((q.meta as { archived?: boolean } | null)?.archived);
    if (statusFilter === "archived") list = list.filter(isArchived);
    else {
      list = list.filter((q) => !isArchived(q));
      if (statusFilter !== "all") {
        list = list.filter((q) => (((q.meta as { status?: string } | null)?.status) ?? "published") === statusFilter);
      }
    }
    if (tierFilter !== "all") list = list.filter((q) => (q.tier ?? "free") === tierFilter);
    const s = search.trim().toLowerCase();
    if (s) {
      list = list.filter((q) =>
        q.title.toLowerCase().includes(s) ||
        (q.body_md ?? "").toLowerCase().includes(s) ||
        (q.language ?? "").toLowerCase().includes(s));
    }
    // Sort: Premium pinned first, then by created_at desc (input order is already created_at desc)
    return [...list].sort((a, b) => {
      const ap = (a.tier ?? "free") === "premium" ? 0 : 1;
      const bp = (b.tier ?? "free") === "premium" ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return 0;
    });
  }, [typeQuestions, statusFilter, tierFilter, search]);

  const tierCounts = useMemo(() => {
    let premium = 0, free = 0;
    for (const q of typeQuestions) {
      if ((q.tier ?? "free") === "premium") premium++; else free++;
    }
    return { premium, free };
  }, [typeQuestions]);

  const statusCounts = useMemo(() => {
    let draft = 0, published = 0, archived = 0, active = 0;
    for (const q of typeQuestions) {
      const meta = (q.meta ?? {}) as { status?: string; archived?: boolean };
      if (meta.archived) { archived++; continue; }
      active++;
      if ((meta.status ?? "published") === "draft") draft++; else published++;
    }
    return { all: active, draft, published, archived };
  }, [typeQuestions]);

  useEffect(() => {
    if (selected.size === 0) return;
    const live = new Set(typeQuestions.map((q) => q.id));
    let changed = false;
    const next = new Set<string>();
    selected.forEach((id) => { if (live.has(id)) next.add(id); else changed = true; });
    if (changed) setSelected(next);
  }, [typeQuestions, selected]);

  const filteredIds = useMemo(() => filtered.map((q) => q.id), [filtered]);
  const allVisibleSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const someVisibleSelected = filteredIds.some((id) => selected.has(id)) && !allVisibleSelected;

  const toggleOne = (id: string) => setSelected((prev) => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });
  const toggleAllVisible = () => setSelected((prev) => {
    const next = new Set(prev);
    if (allVisibleSelected) filteredIds.forEach((id) => next.delete(id));
    else filteredIds.forEach((id) => next.add(id));
    return next;
  });
  const clearSelection = () => setSelected(new Set());

  const runBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selected);
    try {
      const results = await Promise.allSettled(ids.map((id) => del.mutateAsync({ id, org_id: org.id })));
      const failed = results.filter((r) => r.status === "rejected").length;
      const ok = results.length - failed;
      if (ok > 0) toast.success(`Deleted ${ok} question${ok === 1 ? "" : "s"}`);
      if (failed > 0) toast.error(`Failed to delete ${failed} question${failed === 1 ? "" : "s"}`);
      clearSelection();
    } finally {
      setBulkDeleting(false);
      setConfirmBulkDelete(false);
    }
  };

  if (!validType) return <Navigate to={base} replace />;

  const empty = typeQuestions.length === 0;

  return (
    <OrgShell
      title={typeCard?.label ?? "Questions"}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={base}><ArrowLeft className="h-4 w-4 mr-1" /> All types</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={exporting || empty}>
                <Download className="h-4 w-4 mr-1" />
                {exporting ? "Exporting…" : "Export"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => void exportAs("json")}>Export as JSON</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void exportAs("csv")}>Export as CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            onClick={() => navigate(`${base}/${typeKey}/new`)}
          >
            <Plus className="h-4 w-4 mr-1" /> New {typeCard?.label.toLowerCase() ?? "question"}
          </Button>
        </div>
      }
    >
      {empty ? (
        <div className="b2b-card p-12 text-center">
          <Library className="h-8 w-8 mx-auto text-[hsl(var(--muted-foreground))]" />
          <p className="mt-3 font-medium">No {typeCard?.label.toLowerCase() ?? "questions"} yet</p>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{typeCard?.description}</p>
          <div className="mt-4">
            <Button
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
              onClick={() => navigate(`${base}/${typeKey}/new`)}
            >
              <Plus className="h-4 w-4 mr-1" /> New question
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Status tabs + search */}
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div role="tablist" aria-label="Filter by status" className="inline-flex rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))/0.4] p-0.5 self-start">
              {([
                { value: "all", label: "All" },
                { value: "draft", label: "Drafts" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ] as const).map((opt) => {
                const active = statusFilter === opt.value;
                const n = statusCounts[opt.value];
                return (
                  <button key={opt.value} role="tab" aria-selected={active}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`px-2.5 h-8 rounded text-xs font-medium transition-colors ${active ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
                    {opt.label}<span className="ml-1.5 opacity-70">{n}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as typeof tierFilter)}>
                <SelectTrigger className="h-9 w-[140px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tiers · {tierCounts.premium + tierCounts.free}</SelectItem>
                  <SelectItem value="premium">★ Premium · {tierCounts.premium}</SelectItem>
                  <SelectItem value="free">Free · {tierCounts.free}</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions…" className="pl-8 h-9 text-sm" />
              </div>
            </div>
          </div>

          {selected.size > 0 && (
            <div className="sticky top-2 z-10 mb-3 flex items-center justify-between gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))/0.95] backdrop-blur px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2 text-sm">
                <Checkbox checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false} onCheckedChange={toggleAllVisible} aria-label="Select all visible" />
                <span className="font-medium">{selected.size} selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearSelection}><X className="h-4 w-4 mr-1" /> Clear</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Set tier</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => void runBulkSetTier("premium")}>★ Mark Premium</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void runBulkSetTier("free")}>Mark Free</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="destructive" size="sm" onClick={() => setConfirmBulkDelete(true)} disabled={bulkDeleting}>
                  <Trash2 className="h-4 w-4 mr-1" />Delete {selected.size}
                </Button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="b2b-card p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No questions match your filters.</div>
          ) : (
            <div className="b2b-card overflow-hidden divide-y divide-[hsl(var(--border))]">
              <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-[hsl(var(--secondary))/0.4] text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                <Checkbox checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false} onCheckedChange={toggleAllVisible} aria-label="Select all visible" className="shrink-0" />
                <span className="flex-1">Title</span>
                <span className="w-24">Tier</span>
                <span className="w-16 text-right">Points</span>
                <span className="w-24" />
              </div>
              {filtered.map((q) => {
                const meta = (q.meta ?? {}) as { status?: string; difficulty?: string; tags?: string[]; archived?: boolean };
                const status = meta.status ?? "published";
                const archived = Boolean(meta.archived);
                const diff = meta.difficulty;
                const isSelected = selected.has(q.id);
                const tier = (q.tier ?? "free") as "free" | "premium";
                return (
                  <div key={q.id} className={`group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-[hsl(var(--secondary))/0.4] ${isSelected ? "bg-[hsl(var(--primary))/0.06]" : ""} ${archived ? "opacity-70" : ""} ${tier === "premium" ? "border-l-2 border-l-amber-500/60" : ""}`}>
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(q.id)} aria-label={`Select ${q.title}`} className="shrink-0" />
                    <button onClick={() => navigate(`${base}/${typeKey}/${q.id}`)} className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{q.title}</span>
                        {status === "draft" && !archived && (<Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">Draft</Badge>)}
                        {archived && (<Badge className="bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30">Archived</Badge>)}
                        {diff && (
                          <Badge variant="outline" className={`capitalize ${diff === "easy" ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : diff === "hard" ? "border-rose-500/40 text-rose-600 dark:text-rose-400" : "border-amber-500/40 text-amber-600 dark:text-amber-400"}`}>{diff}</Badge>
                        )}
                        <span className="md:hidden"><TierBadge tier={tier} /></span>
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 flex items-center gap-2 flex-wrap">
                        {q.language && <span>{q.language}</span>}
                        {(meta.tags ?? []).slice(0, 3).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-[hsl(var(--secondary))] text-[10px]">{t}</span>
                        ))}
                      </div>
                    </button>
                    <span className="hidden md:flex w-24"><TierBadge tier={tier} /></span>
                    <span className="hidden md:inline-block w-16 text-right text-xs tabular-nums text-[hsl(var(--muted-foreground))]">{q.points}</span>
                    <div className="flex items-center md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => setTier(q, tier === "premium" ? "free" : "premium")} disabled={upd.isPending} title={tier === "premium" ? "Mark Free" : "Mark Premium"}>
                        <Sparkles className={`h-4 w-4 ${tier === "premium" ? "text-amber-500" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => duplicateQuestion(q)} disabled={duplicatingId === q.id} title="Duplicate question"><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleArchive(q)} disabled={upd.isPending} title={archived ? "Restore question" : "Archive question"}>
                        {archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (!confirm(`Delete "${q.title}"?`)) return; if (q.org_id) del.mutate({ id: q.id, org_id: q.org_id }); }} title="Delete question"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} question{selected.size === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected questions along with their tests, options, and history. Assessments that reference them may break. This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void runBulkDelete(); }} disabled={bulkDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bulkDeleting ? "Deleting…" : `Delete ${selected.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OrgShell>
  );
}

// ─────────────────────────── NEW (full-page) ───────────────────────────
function NewView({ org }: { org: { id: string; name?: string } }) {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const base = useBasePath();
  const typeKey = type as QuestionType;
  const typeCard = TYPE_CARDS.find((c) => c.value === typeKey);
  if (!typeCard) return <Navigate to={base} replace />;

  const backToList = () => navigate(`${base}/${typeKey}`);

  return (
    <OrgShell
      title={`New ${typeCard.label.toLowerCase()} question`}
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link to={`${base}/${typeKey}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back to list</Link>
        </Button>
      }
    >
      <div className="b2b-card p-4 md:p-6">
        {typeKey === "coding" && (
          <CodingWizard orgId={org.id} onDone={backToList} onCancel={backToList} />
        )}
        {typeKey === "sql" && (
          <SqlWizard orgId={org.id} onDone={backToList} onCancel={backToList} />
        )}
        {typeKey !== "coding" && typeKey !== "sql" && (
          <SimpleNewForm orgId={org.id} type={typeKey} onDone={(id) => navigate(`${base}/${typeKey}/${id}`)} onCancel={backToList} />
        )}
      </div>
    </OrgShell>
  );
}

// Inline simple form (replaces NewQuestionDialog popup)
function SimpleNewForm({
  orgId, type, onDone, onCancel,
}: { orgId: string; type: QuestionType; onDone: (id: string) => void; onCancel: () => void; }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [points, setPoints] = useState(10);
  const [tier, setTier] = useState<"free" | "premium">("free");
  const create = useCreateQuestion();
  const upsertOption = useUpsertMcqOption();

  const submit = async () => {
    const meta: Record<string, unknown> =
      type === "matching" ? { pairs: [] } :
      type === "short_answer" ? { accepted: [], case_sensitive: false, max_length: 200 } :
      type === "true_false" ? { correct: true } :
      type === "numerical" ? { expected: "", tolerance: 0, unit: "" } :
      type === "fill_blanks" ? { blanks: [] } : {};
    const q = await create.mutateAsync({
      org_id: orgId, type, title: title.trim(),
      body_md: body || undefined, points, meta, tier,
    });
    if (type === "true_false") {
      await upsertOption.mutateAsync({ question_id: q.id, body: "True", is_correct: true, order_index: 0 });
      await upsertOption.mutateAsync({ question_id: q.id, body: "False", is_correct: false, order_index: 1 });
    }
    toast.success("Question created");
    onDone(q.id);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Prompt (Markdown)</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 min-h-[140px]" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Points</Label>
          <Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value) || 0)} className="mt-1 w-32" />
        </div>
        <div>
          <Label>Tier</Label>
          <TierPicker value={tier} onChange={setTier} className="mt-1" />
          <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
            Premium questions are only attemptable by candidates with premium access.
          </p>
        </div>
      </div>
      {type === "true_false" && <p className="text-xs text-[hsl(var(--muted-foreground))]">Two options (True / False) will be created. Set the correct one on the next screen.</p>}
      {type === "matching" && <p className="text-xs text-[hsl(var(--muted-foreground))]">Add Left → Right pairs on the next screen.</p>}
      {type === "short_answer" && <p className="text-xs text-[hsl(var(--muted-foreground))]">Add accepted answer variants on the next screen.</p>}
      {type === "numerical" && <p className="text-xs text-[hsl(var(--muted-foreground))]">Set the expected number, tolerance, and unit on the next screen.</p>}
      {type === "fill_blanks" && <p className="text-xs text-[hsl(var(--muted-foreground))]">Use <code>{`{{1}}`}</code>, <code>{`{{2}}`}</code>… placeholders in the prompt and define each blank's answer on the next screen.</p>}
      <div className="flex justify-end gap-2 pt-2 border-t border-[hsl(var(--border))]">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button disabled={!title.trim() || create.isPending} onClick={submit}
          className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
          {create.isPending ? "Creating…" : "Create question"}
        </Button>
      </div>
    </div>
  );
}

// ───────────────── Tier helpers ─────────────────
function TierPicker({
  value, onChange, className = "",
}: { value: "free" | "premium"; onChange: (v: "free" | "premium") => void; className?: string }) {
  return (
    <div className={`inline-flex rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--secondary))/0.4] p-0.5 ${className}`}>
      {(["free", "premium"] as const).map((t) => {
        const active = value === t;
        return (
          <button
            type="button"
            key={t}
            onClick={() => onChange(t)}
            className={`px-3 h-8 rounded text-xs font-medium capitalize transition-colors ${
              active
                ? t === "premium"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 shadow-sm"
                  : "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            {t === "premium" ? "★ Premium" : "Free"}
          </button>
        );
      })}
    </div>
  );
}

function TierBadge({ tier }: { tier: "free" | "premium" }) {
  if (tier === "premium") {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
        ★ Premium
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]">
      Free
    </Badge>
  );
}

function TierToggle({ question }: { question: Question }) {
  const upd = useUpdateQuestion();
  const tier = (question.tier ?? "free") as "free" | "premium";
  return (
    <TierPicker
      value={tier}
      onChange={async (next) => {
        if (next === tier) return;
        try {
          await upd.mutateAsync({ id: question.id, patch: { tier: next } as Partial<Question> });
          toast.success(`Marked as ${next === "premium" ? "Premium" : "Free"}`);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed to update tier");
        }
      }}
    />
  );
}

// ─────────────────────────── EDIT (full-page) ───────────────────────────
function EditView({ org }: { org: { id: string; name?: string } }) {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const base = useBasePath();
  const typeKey = type as QuestionType;
  const typeCard = TYPE_CARDS.find((c) => c.value === typeKey);
  const { data: questions } = useQuestions(org.id);
  const question = (questions ?? []).find((q) => q.id === id);
  const { data: options } = useMcqOptions(
    question && (question.type === "mcq" || question.type === "true_false") ? question.id : undefined,
  );

  const backToList = () => navigate(`${base}/${typeKey}`);

  if (!typeCard) return <Navigate to={base} replace />;
  if (!questions) return null;
  if (!question) {
    return (
      <OrgShell title="Question not found" actions={<Button variant="ghost" size="sm" asChild><Link to={`${base}/${typeKey}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link></Button>}>
        <div className="b2b-card p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">This question doesn't exist or was deleted.</div>
      </OrgShell>
    );
  }

  const tierBar = (
    <div className="mb-4 b2b-card px-3 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[hsl(var(--muted-foreground))]">Visibility tier:</span>
        <TierBadge tier={(question.tier ?? "free") as "free" | "premium"} />
      </div>
      <TierToggle question={question} />
    </div>
  );

  // Coding & SQL use the existing multi-step wizard, full-page
  if (question.type === "coding") {
    return (
      <OrgShell title={`Edit · ${question.title}`} actions={<Button variant="ghost" size="sm" asChild><Link to={`${base}/${typeKey}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back to list</Link></Button>}>
        {tierBar}
        <div className="b2b-card p-4 md:p-6">
          <CodingWizard orgId={org.id} initial={question} onDone={backToList} onCancel={backToList} />
        </div>
      </OrgShell>
    );
  }
  if (question.type === "sql") {
    return (
      <OrgShell title={`Edit · ${question.title}`} actions={<Button variant="ghost" size="sm" asChild><Link to={`${base}/${typeKey}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back to list</Link></Button>}>
        {tierBar}
        <div className="b2b-card p-4 md:p-6">
          <SqlWizard orgId={org.id} initial={question} onDone={backToList} onCancel={backToList} />
        </div>
      </OrgShell>
    );
  }

  // All other types — inline editor body
  return (
    <OrgShell
      title={`Edit · ${question.title}`}
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link to={`${base}/${typeKey}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back to list</Link>
        </Button>
      }
    >
      {tierBar}
      <div className="b2b-card p-4 md:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{question.type}</Badge>
          <h2 className="text-base font-semibold truncate">{question.title}</h2>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Edit the answer key below. Changes are saved automatically.</p>

        {question.body_md && (
          <div className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap border rounded-md p-3 bg-[hsl(var(--secondary))]">
            {question.body_md}
          </div>
        )}

        {question.type === "mcq" && <McqEditor questionId={question.id} />}
        {question.type === "true_false" && <TrueFalseEditor question={question} />}
        {question.type === "matching" && <MatchingEditor question={question} />}
        {question.type === "short_answer" && <ShortAnswerEditor question={question} />}
        {question.type === "numerical" && <NumericalEditor question={question} />}
        {question.type === "fill_blanks" && <FillBlanksEditor question={question} />}
        {question.type === "subjective" && (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Subjective answers are graded manually from the results dashboard.
          </p>
        )}

        <div className="border-t pt-4 mt-2">
          <h4 className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-2">Candidate preview</h4>
          <div className="border rounded-md p-3 bg-[hsl(var(--background))]">
            <CandidatePreview question={question} options={options ?? []} />
          </div>
        </div>
      </div>
    </OrgShell>
  );
}


function ImportQuestionsDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);
  const create = useCreateQuestion();

  const SAMPLE = JSON.stringify(
    [
      { type: "mcq", title: "What does HTTP stand for?", body_md: "Pick the correct expansion.", points: 5 },
      { type: "coding", title: "Two Sum", body_md: "Return indices of two numbers that add up to target.", points: 20, language: "javascript" },
    ],
    null,
    2,
  );

  const onImport = async () => {
    let arr: any;
    try {
      arr = JSON.parse(json);
    } catch (e: any) {
      toast.error("Invalid JSON: " + e.message);
      return;
    }
    if (!Array.isArray(arr)) {
      toast.error("JSON must be an array of questions");
      return;
    }
    const valid: QuestionType[] = ["coding", "mcq", "sql", "subjective"];
    setBusy(true);
    let ok = 0;
    let failed = 0;
    for (const item of arr) {
      try {
        if (!item?.title || !valid.includes(item.type)) {
          failed++;
          continue;
        }
        await create.mutateAsync({
          org_id: orgId,
          type: item.type,
          title: String(item.title),
          body_md: item.body_md ? String(item.body_md) : undefined,
          points: Number(item.points) || 10,
          language: item.language ? String(item.language) : undefined,
        });
        ok++;
      } catch {
        failed++;
      }
    }
    setBusy(false);
    toast.success(`Imported ${ok} question${ok === 1 ? "" : "s"}${failed ? ` · ${failed} failed` : ""}`);
    if (ok > 0) {
      setOpen(false);
      setJson("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-1" /> Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk import questions</DialogTitle>
          <DialogDescription>
            Paste a JSON array. Each item needs <code>type</code> (coding | mcq | sql | subjective) and <code>title</code>. Options and test cases can be added after import.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder={SAMPLE}
          className="min-h-[260px] font-mono text-xs"
        />
        <div className="flex justify-between items-center">
          <button
            type="button"
            className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline-offset-2 hover:underline"
            onClick={() => setJson(SAMPLE)}
          >
            Insert sample
          </button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!json.trim() || busy}
            onClick={onImport}
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          >
            {busy ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewQuestionDialog({
  orgId,
  open: openProp,
  onOpenChange,
  forcedType,
  hideTrigger,
}: {
  orgId: string;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  forcedType?: QuestionType;
  hideTrigger?: boolean;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [type, setType] = useState<QuestionType>(forcedType ?? "mcq");
  useEffect(() => { if (forcedType) setType(forcedType); }, [forcedType]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [points, setPoints] = useState(10);
  const [language, setLanguage] = useState("");
  const create = useCreateQuestion();
  const upsertOption = useUpsertMcqOption();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
            <Plus className="h-4 w-4 mr-1" /> New question
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New question</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Prompt (Markdown)</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 min-h-[120px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Points</Label>
              <Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value) || 0)} className="mt-1" />
            </div>
            {(type === "coding" || type === "sql") && (
              <div>
                <Label>Language</Label>
                <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder={type === "sql" ? "postgres" : "javascript"} className="mt-1" />
              </div>
            )}
          </div>
          {type === "true_false" && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Two options (True / False) will be created. Choose the correct one from the editor.</p>
          )}
          {type === "matching" && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Add Left → Right pairs from the editor after creating.</p>
          )}
          {type === "short_answer" && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Add accepted answer variants from the editor after creating.</p>
          )}
          {type === "numerical" && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Set the expected number, tolerance, and unit from the editor after creating.</p>
          )}
          {type === "fill_blanks" && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Use <code>{`{{1}}`}</code>, <code>{`{{2}}`}</code>… placeholders in the prompt and define each blank's answer in the editor.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            disabled={!title.trim() || create.isPending}
            onClick={async () => {
              const meta: Record<string, unknown> =
                type === "matching" ? { pairs: [] } :
                type === "short_answer" ? { accepted: [], case_sensitive: false, max_length: 200 } :
                type === "true_false" ? { correct: true } :
                type === "numerical" ? { expected: "", tolerance: 0, unit: "" } :
                type === "fill_blanks" ? { blanks: [] } : {};
              const q = await create.mutateAsync({
                org_id: orgId,
                type,
                title: title.trim(),
                body_md: body || undefined,
                points,
                language: language || undefined,
                meta,
              });
              if (type === "true_false") {
                await upsertOption.mutateAsync({ question_id: q.id, body: "True", is_correct: true, order_index: 0 });
                await upsertOption.mutateAsync({ question_id: q.id, body: "False", is_correct: false, order_index: 1 });
              }
              toast.success("Question created");
              setOpen(false);
              setTitle(""); setBody(""); setLanguage(""); setPoints(10);
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuestionEditorDialog({ question, onClose }: { question: Question; onClose: () => void }) {
  const { data: options } = useMcqOptions(
    question.type === "true_false" || question.type === "mcq" ? question.id : undefined,
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline">{question.type}</Badge>
            {question.title}
          </DialogTitle>
          <DialogDescription>Edit the answer key below. Changes are saved automatically.</DialogDescription>
        </DialogHeader>
        {question.body_md && (
          <div className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap border rounded-md p-3 bg-[hsl(var(--secondary))]">
            {question.body_md}
          </div>
        )}
        {question.type === "mcq" && <McqEditor questionId={question.id} />}
        {question.type === "true_false" && <TrueFalseEditor question={question} />}
        {question.type === "matching" && <MatchingEditor question={question} />}
        {question.type === "short_answer" && <ShortAnswerEditor question={question} />}
        {question.type === "numerical" && <NumericalEditor question={question} />}
        {question.type === "fill_blanks" && <FillBlanksEditor question={question} />}
        {(question.type === "coding" || question.type === "sql") && <TestCaseEditor questionId={question.id} />}
        {question.type === "subjective" && (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Subjective answers are graded manually from the results dashboard.
          </p>
        )}

        <div className="border-t pt-4 mt-2">
          <h4 className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-2">Candidate preview</h4>
          <div className="border rounded-md p-3 bg-[hsl(var(--background))]">
            <CandidatePreview question={question} options={options ?? []} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function McqEditor({ questionId }: { questionId: string }) {
  const { data: options } = useMcqOptions(questionId);
  const upsert = useUpsertMcqOption();
  const del = useDeleteMcqOption();
  const [body, setBody] = useState("");
  const [correct, setCorrect] = useState(false);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Options</h4>
      <div className="space-y-2">
        {(options ?? []).map((o) => (
          <div key={o.id} className="flex items-center gap-2 border rounded-md px-3 py-2">
            <Checkbox
              checked={o.is_correct}
              onCheckedChange={(v) =>
                upsert.mutate({ id: o.id, question_id: questionId, body: o.body, is_correct: !!v, order_index: o.order_index })
              }
            />
            <span className="flex-1 text-sm">{o.body}</span>
            <Button variant="ghost" size="sm" onClick={() => del.mutate({ id: o.id, question_id: questionId })}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Checkbox checked={correct} onCheckedChange={(v) => setCorrect(!!v)} />
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="New option…" />
        <Button
          variant="outline"
          disabled={!body.trim()}
          onClick={async () => {
            await upsert.mutateAsync({
              question_id: questionId,
              body: body.trim(),
              is_correct: correct,
              order_index: options?.length ?? 0,
            });
            setBody(""); setCorrect(false);
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function TestCaseEditor({ questionId }: { questionId: string }) {
  const { data: cases } = useTestCases(questionId);
  const upsert = useUpsertTestCase();
  const del = useDeleteTestCase();
  const [input, setInput] = useState("");
  const [expected, setExpected] = useState("");
  const [hidden, setHidden] = useState(true);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Test cases</h4>
      <div className="space-y-2">
        {(cases ?? []).map((t) => (
          <div key={t.id} className="border rounded-md p-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant={t.is_hidden ? "secondary" : "outline"}>{t.is_hidden ? "Hidden" : "Sample"}</Badge>
              <Button variant="ghost" size="sm" onClick={() => del.mutate({ id: t.id, question_id: questionId })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div><span className="font-medium">In:</span> <pre className="inline whitespace-pre-wrap">{t.input}</pre></div>
            <div><span className="font-medium">Out:</span> <pre className="inline whitespace-pre-wrap">{t.expected_output}</pre></div>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t pt-3">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Input" className="min-h-[60px] font-mono text-xs" />
        <Textarea value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Expected output" className="min-h-[60px] font-mono text-xs" />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={hidden} onCheckedChange={(v) => setHidden(!!v)} />
            Hidden from candidates
          </label>
          <Button
            variant="outline"
            size="sm"
            disabled={!expected.trim()}
            onClick={async () => {
              await upsert.mutateAsync({
                question_id: questionId,
                input,
                expected_output: expected,
                is_hidden: hidden,
                weight: 1,
                order_index: cases?.length ?? 0,
              });
              setInput(""); setExpected("");
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add test case
          </Button>
        </div>
      </div>
    </div>
  );
}

function AIGenerateDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [type, setType] = useState<QuestionType>("mcq");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [busy, setBusy] = useState(false);
  const create = useCreateQuestion();
  const upsertOption = useUpsertMcqOption();
  const upsertTest = useUpsertTestCase();

  const onGenerate = async () => {
    if (!topic.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("parikshaa-generate-questions", {
        body: { topic: topic.trim(), type, count, difficulty },
      });
      if (error) throw error;
      const items: any[] = data?.questions ?? [];
      if (!items.length) {
        toast.error("AI returned no questions");
        return;
      }
      let ok = 0;
      for (const item of items) {
        try {
          const q = await create.mutateAsync({
            org_id: orgId,
            type: (item.type as QuestionType) ?? type,
            title: String(item.title ?? "Untitled"),
            body_md: item.body_md ? String(item.body_md) : undefined,
            language: item.language ? String(item.language) : undefined,
            points: Number(item.points) || 10,
          });
          if (Array.isArray(item.options)) {
            for (let i = 0; i < item.options.length; i++) {
              const o = item.options[i];
              await upsertOption.mutateAsync({
                question_id: q.id,
                body: String(o?.body ?? ""),
                is_correct: !!o?.is_correct,
                order_index: i,
              });
            }
          }
          if (Array.isArray(item.test_cases)) {
            for (let i = 0; i < item.test_cases.length; i++) {
              const t = item.test_cases[i];
              await upsertTest.mutateAsync({
                question_id: q.id,
                input: String(t?.input ?? ""),
                expected_output: String(t?.expected_output ?? ""),
                is_hidden: t?.is_hidden ?? i > 0,
                weight: 1,
                order_index: i,
              });
            }
          }
          ok++;
        } catch (e) {
          console.error("AI import item failed", e);
        }
      }
      toast.success(`Generated ${ok} of ${items.length} question${items.length === 1 ? "" : "s"}`);
      if (ok > 0) {
        setOpen(false);
        setTopic("");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1">
          <Sparkles className="h-4 w-4" /> AI generate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" /> Generate questions with AI
          </DialogTitle>
          <DialogDescription>
            Describe a topic. AI drafts questions (with options or test cases) you can review and edit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Topic</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. JavaScript closures, SQL joins, REST APIs…"
              className="mt-1"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Count</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Generation usually takes 5–20 seconds depending on count and complexity.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button
            disabled={!topic.trim() || busy}
            onClick={onGenerate}
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          >
            {busy ? "Generating…" : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ───────── True/False editor ─────────
function TrueFalseEditor({ question }: { question: Question }) {
  const { data: options } = useMcqOptions(question.id);
  const upsertOption = useUpsertMcqOption();
  const update = useUpdateQuestion();
  const metaCorrect = (question.meta as { correct?: boolean } | null)?.correct;
  const current = typeof metaCorrect === "boolean"
    ? metaCorrect
    : (options ?? []).find((o) => o.is_correct)?.body?.toLowerCase() === "true";

  const setCorrect = async (val: boolean) => {
    await update.mutateAsync({ id: question.id, patch: { meta: { ...(question.meta ?? {}), correct: val } } });
    // Sync mcq_options flags
    for (const o of options ?? []) {
      const shouldBe = o.body.trim().toLowerCase() === (val ? "true" : "false");
      if (o.is_correct !== shouldBe) {
        await upsertOption.mutateAsync({ id: o.id, question_id: question.id, body: o.body, is_correct: shouldBe, order_index: o.order_index });
      }
    }
    toast.success(`Correct answer: ${val ? "True" : "False"}`);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Correct answer</h4>
      <div className="flex gap-2">
        {[
          { v: true, label: "True" },
          { v: false, label: "False" },
        ].map(({ v, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => setCorrect(v)}
            className={`flex-1 px-3 py-2 rounded-md border text-sm font-medium transition ${
              current === v
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]"
                : "border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────── Matching editor ─────────
type MatchPair = { left: string; right: string };
function MatchingEditor({ question }: { question: Question }) {
  const update = useUpdateQuestion();
  const initial = ((question.meta as { pairs?: MatchPair[] } | null)?.pairs ?? []).map((p) => ({ ...p }));
  const [pairs, setPairs] = useState<MatchPair[]>(initial.length ? initial : [{ left: "", right: "" }]);
  const [dirty, setDirty] = useState(false);

  const updatePair = (idx: number, patch: Partial<MatchPair>) => {
    setPairs((arr) => arr.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
    setDirty(true);
  };
  const addPair = () => { setPairs((a) => [...a, { left: "", right: "" }]); setDirty(true); };
  const removePair = (idx: number) => { setPairs((a) => a.filter((_, i) => i !== idx)); setDirty(true); };

  const save = async () => {
    const clean = pairs
      .map((p) => ({ left: p.left.trim(), right: p.right.trim() }))
      .filter((p) => p.left && p.right);
    await update.mutateAsync({ id: question.id, patch: { meta: { ...(question.meta ?? {}), pairs: clean } } });
    setPairs(clean.length ? clean : [{ left: "", right: "" }]);
    setDirty(false);
    toast.success(`Saved ${clean.length} pair${clean.length === 1 ? "" : "s"}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Pairs</h4>
        <Button variant="outline" size="sm" onClick={addPair}><Plus className="h-4 w-4 mr-1" />Add pair</Button>
      </div>
      <div className="space-y-2">
        {pairs.map((p, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
            <Input value={p.left} onChange={(e) => updatePair(i, { left: e.target.value })} placeholder="Left item" maxLength={120} />
            <span className="text-[hsl(var(--muted-foreground))]">→</span>
            <Input value={p.right} onChange={(e) => updatePair(i, { right: e.target.value })} placeholder="Match (right)" maxLength={120} />
            <Button variant="ghost" size="sm" onClick={() => removePair(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={!dirty || update.isPending} className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
        {update.isPending ? "Saving…" : "Save pairs"}
      </Button>
    </div>
  );
}

// ───────── Short answer editor ─────────
function ShortAnswerEditor({ question }: { question: Question }) {
  const update = useUpdateQuestion();
  const meta = (question.meta as { accepted?: string[]; case_sensitive?: boolean; max_length?: number } | null) ?? {};
  const [accepted, setAccepted] = useState<string[]>(meta.accepted ?? []);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(!!meta.case_sensitive);
  const [maxLength, setMaxLength] = useState<number>(meta.max_length ?? 200);
  const [newVariant, setNewVariant] = useState("");
  const [dirty, setDirty] = useState(false);

  const addVariant = () => {
    const v = newVariant.trim();
    if (!v) return;
    if (accepted.includes(v)) { toast.info("Already in the accepted list"); return; }
    setAccepted((a) => [...a, v]);
    setNewVariant("");
    setDirty(true);
  };
  const removeVariant = (i: number) => { setAccepted((a) => a.filter((_, idx) => idx !== i)); setDirty(true); };

  const save = async () => {
    await update.mutateAsync({
      id: question.id,
      patch: { meta: { ...(question.meta ?? {}), accepted, case_sensitive: caseSensitive, max_length: Math.max(1, Math.min(1000, maxLength)) } },
    });
    setDirty(false);
    toast.success("Short answer saved");
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">Accepted answers</h4>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Any exact match (after trim & case rule) earns full points.</p>
      </div>
      <div className="space-y-2">
        {accepted.length === 0 && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] italic">No accepted answers yet — add at least one.</p>
        )}
        {accepted.map((a, i) => (
          <div key={i} className="flex items-center gap-2 border rounded-md px-3 py-2">
            <span className="flex-1 text-sm font-mono">{a}</span>
            <Button variant="ghost" size="sm" onClick={() => removeVariant(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={newVariant} onChange={(e) => setNewVariant(e.target.value)} placeholder="Add variant…" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVariant(); } }} />
        <Button variant="outline" onClick={addVariant} disabled={!newVariant.trim()}><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={caseSensitive} onCheckedChange={(v) => { setCaseSensitive(!!v); setDirty(true); }} />
          Case sensitive
        </label>
        <div className="flex items-center gap-2 text-sm">
          <Label className="text-xs">Max length</Label>
          <Input
            type="number"
            min={1}
            max={1000}
            value={maxLength}
            onChange={(e) => { setMaxLength(Number(e.target.value) || 1); setDirty(true); }}
            className="h-8 w-24"
          />
        </div>
      </div>
      <Button onClick={save} disabled={!dirty || update.isPending} className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
        {update.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

// ───────── Candidate preview (read-only render of what learners see) ─────────
function CandidatePreview({ question, options }: { question: Question; options: McqOption[] }) {
  if (question.type === "mcq" || question.type === "true_false") {
    return (
      <div className="space-y-1.5">
        {options.length === 0 && <p className="text-xs text-[hsl(var(--muted-foreground))]">Add options to preview.</p>}
        {options.map((o) => (
          <div key={o.id} className={`text-sm px-3 py-2 rounded border ${o.is_correct ? "border-emerald-500/60 bg-emerald-500/10" : "border-[hsl(var(--border))]"}`}>
            {o.body}{o.is_correct && <span className="ml-2 text-xs text-emerald-700 dark:text-emerald-300">✓ correct</span>}
          </div>
        ))}
      </div>
    );
  }
  if (question.type === "short_answer") {
    const m = (question.meta as { accepted?: string[]; max_length?: number } | null) ?? {};
    return (
      <div className="space-y-2">
        <Input disabled placeholder="Candidate types here…" maxLength={m.max_length ?? 200} />
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Accepts: {(m.accepted ?? []).join(", ") || "—"}</p>
      </div>
    );
  }
  if (question.type === "matching") {
    const pairs = ((question.meta as { pairs?: MatchPair[] } | null)?.pairs ?? []);
    const rights = [...new Set(pairs.map((p) => p.right))];
    if (!pairs.length) return <p className="text-xs text-[hsl(var(--muted-foreground))]">Add pairs to preview.</p>;
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          {pairs.map((p) => (
            <div key={`l-${p.left}`} className="text-sm px-3 py-2 rounded border bg-[hsl(var(--secondary))]">{p.left}</div>
          ))}
        </div>
        <div className="space-y-1.5">
          {rights.map((r) => (
            <div key={`r-${r}`} className="text-sm px-3 py-2 rounded border bg-[hsl(var(--secondary))]">{r}</div>
          ))}
        </div>
      </div>
    );
  }
  if (question.type === "subjective") {
    return <Textarea disabled placeholder="Candidate writes their answer here…" className="min-h-[80px]" />;
  }
  return (
    <pre className="text-xs whitespace-pre-wrap text-[hsl(var(--muted-foreground))]">
      {question.starter_code ?? `// ${question.type} preview not available here — use Take preview from the assessment page.`}
    </pre>
  );
}

// ───────── Numerical editor ─────────
function NumericalEditor({ question }: { question: Question }) {
  const update = useUpdateQuestion();
  const meta = (question.meta as { expected?: string | number; tolerance?: string | number; unit?: string } | null) ?? {};
  const [expected, setExpected] = useState(String(meta.expected ?? ""));
  const [tolerance, setTolerance] = useState(String(meta.tolerance ?? "0"));
  const [unit, setUnit] = useState(meta.unit ?? "");
  const [dirty, setDirty] = useState(false);

  const save = async () => {
    await update.mutateAsync({
      id: question.id,
      patch: { meta: { ...(question.meta ?? {}), expected, tolerance, unit } },
    });
    setDirty(false);
    toast.success("Numerical answer saved");
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Expected answer</h4>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Expected value</Label>
          <Input type="number" step="any" value={expected} onChange={(e) => { setExpected(e.target.value); setDirty(true); }} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">± Tolerance</Label>
          <Input type="number" step="any" min="0" value={tolerance} onChange={(e) => { setTolerance(e.target.value); setDirty(true); }} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Unit (optional)</Label>
          <Input value={unit} onChange={(e) => { setUnit(e.target.value); setDirty(true); }} placeholder="e.g. kg, %, m/s" className="mt-1" />
        </div>
      </div>
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Candidate answers within ± tolerance of the expected value earn full points.
      </p>
      <Button onClick={save} disabled={!dirty || update.isPending} className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
        {update.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

// ───────── Fill-in-the-blanks editor ─────────
type Blank = { id: string; answer: string; case_sensitive?: boolean };
function FillBlanksEditor({ question }: { question: Question }) {
  const update = useUpdateQuestion();
  const initial = ((question.meta as { blanks?: Blank[] } | null)?.blanks ?? []).map((b) => ({ ...b }));
  const [blanks, setBlanks] = useState<Blank[]>(initial.length ? initial : [{ id: "1", answer: "" }]);
  const [dirty, setDirty] = useState(false);

  const setBlank = (i: number, patch: Partial<Blank>) => {
    setBlanks((arr) => arr.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
    setDirty(true);
  };
  const addBlank = () => { setBlanks((a) => [...a, { id: String(a.length + 1), answer: "" }]); setDirty(true); };
  const removeBlank = (i: number) => { setBlanks((a) => a.filter((_, idx) => idx !== i)); setDirty(true); };

  const save = async () => {
    const clean = blanks.filter((b) => b.id && b.answer.trim());
    await update.mutateAsync({ id: question.id, patch: { meta: { ...(question.meta ?? {}), blanks: clean } } });
    setDirty(false);
    toast.success(`Saved ${clean.length} blank${clean.length === 1 ? "" : "s"}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Blanks</h4>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Reference each blank in the prompt with <code>{`{{id}}`}</code> (e.g. <code>{`{{1}}`}</code>).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addBlank}><Plus className="h-4 w-4 mr-1" />Add blank</Button>
      </div>
      <div className="space-y-2">
        {blanks.map((b, i) => (
          <div key={i} className="grid grid-cols-[80px_1fr_auto_auto] items-center gap-2">
            <Input value={b.id} onChange={(e) => setBlank(i, { id: e.target.value })} placeholder="id" />
            <Input value={b.answer} onChange={(e) => setBlank(i, { answer: e.target.value })} placeholder="Correct answer" />
            <label className="flex items-center gap-1 text-xs">
              <Checkbox checked={!!b.case_sensitive} onCheckedChange={(v) => setBlank(i, { case_sensitive: !!v })} />
              Case
            </label>
            <Button variant="ghost" size="sm" onClick={() => removeBlank(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={!dirty || update.isPending} className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
        {update.isPending ? "Saving…" : "Save blanks"}
      </Button>
    </div>
  );
}
