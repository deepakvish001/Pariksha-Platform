import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { OrgShell } from "../../layouts/OrgShell";
import {
  useAssessment,
  useUpdateAssessment,
  useDeleteAssessment,
  useSections,
  useCreateSection,
  useDeleteSection,
  useSectionQuestions,
  useAddQuestionToSection,
  useRemoveQuestionFromSection,
} from "../../hooks/useAssessments";
import { useQuestions, type Question } from "../../hooks/useQuestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusPill, type StatusTone } from "../../components/ui/StatusPill";
import { EmptyState } from "../../components/ui/EmptyState";
import { FileQuestion } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, ArrowLeft, Send, Archive, Copy, Link as LinkIcon, Play, Activity, Eye, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AssessmentProctoringConfig } from "../../components/AssessmentProctoringConfig";
import ProctoringTriagePanel from "../../components/ProctoringTriagePanel";
import type { ProctoringConfig } from "@/assessments/lib/proctoringConfig";
import { useAttempts } from "../../hooks/useAttempts";
import { useAssessmentInsights } from "../../hooks/useInsights";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCanProctor } from "../../hooks/usePermissions";
import { useCurrentOrg, useOrgBasePath } from "../../context/OrgContext";
import { paths } from "@/lib/routing/paths";
import { ShieldAlert } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  coding: "Code",
  mcq: "MCQ",
  sql: "SQL",
  subjective: "Written",
};

export default function AssessmentDetail() {
  const { id: idOrSlug } = useParams();
  const navigate = useNavigate();
  const { org } = useCurrentOrg();
  const basePath = useOrgBasePath();
  const { data: assessment, isLoading } = useAssessment(idOrSlug, org?.id);
  const update = useUpdateAssessment();
  const del = useDeleteAssessment();
  const { canProctor } = useCanProctor(assessment?.org_id);

  if (isLoading) return null;
  if (!assessment) return <Navigate to={paths.b2b.assessmentsList(basePath)} replace />;
  if (assessment.slug && idOrSlug && idOrSlug !== assessment.slug) {
    return <Navigate to={paths.b2b.assessment(basePath, assessment)} replace />;
  }

  const isPublished = assessment.status === "published";
  const STATUS_TONE: Record<string, StatusTone> = {
    draft: "draft",
    published: "live",
    archived: "archived",
    closed: "closed",
  };

  return (
    <OrgShell
      title={assessment.title}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(paths.b2b.assessmentsList(basePath))}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(paths.b2b.assessmentManage(basePath, assessment))}>
            <Activity className="h-4 w-4 mr-1" /> Live monitor
          </Button>
          <StatusPill tone={STATUS_TONE[assessment.status] ?? "neutral"} pulse={isPublished}>
            {assessment.status}
          </StatusPill>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const { supabase } = await import("@/integrations/supabase/client");
              const { data, error } = await supabase.rpc("start_preview_attempt", { _assessment: assessment.id });
              if (error) { toast.error(error.message); return; }
              const attempt: any = data;
              navigate(paths.student.play(attempt, { preview: true }));
            }}
          >
            <Play className="h-4 w-4 mr-1" /> Take preview
          </Button>
          {!isPublished ? (
            <Button
              size="sm"
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
              onClick={async () => {
                await update.mutateAsync({ id: assessment.id, patch: { status: "published" } });
                toast.success("Published");
              }}
            >
              <Send className="h-4 w-4 mr-1" /> Publish
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await update.mutateAsync({ id: assessment.id, patch: { status: "archived" } });
                toast.success("Archived");
              }}
            >
              <Archive className="h-4 w-4 mr-1" /> Archive
            </Button>
          )}
        </div>
      }
    >
      <Tabs defaultValue="sections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sections">Sections & Questions</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          {canProctor && <TabsTrigger value="proctoring">Proctoring</TabsTrigger>}
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="sections">
          <SectionsPanel assessmentId={assessment.id} orgId={assessment.org_id} />
        </TabsContent>
        <TabsContent value="invites">
          <InvitesPanel assessmentId={assessment.id} />
        </TabsContent>
        <TabsContent value="results">
          <ResultsPanel assessment={assessment} basePath={basePath} />
        </TabsContent>
        <TabsContent value="proctoring">
          {canProctor ? (
            <ProctoringTriagePanel assessmentId={assessment.id} />
          ) : (
            <div className="b2b-card p-8 max-w-xl mx-auto text-center">
              <ShieldAlert className="h-10 w-10 mx-auto mb-3 text-amber-500" />
              <h2 className="text-base font-semibold mb-1">Restricted area</h2>
              <p className="text-sm text-muted-foreground">
                Proctoring evidence is limited to organization owners, admins, and members with the Proctor role.
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="insights">
          <InsightsPanel assessmentId={assessment.id} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsPanel assessment={assessment} onDelete={async () => {
            if (!confirm("Delete this assessment? This cannot be undone.")) return;
            await del.mutateAsync({ id: assessment.id, org_id: assessment.org_id });
            toast.success("Deleted");
            navigate("/b2b/assessments");
          }} />
        </TabsContent>
      </Tabs>
    </OrgShell>
  );
}

function SectionsPanel({ assessmentId, orgId }: { assessmentId: string; orgId: string }) {
  const { data: sections } = useSections(assessmentId);
  const create = useCreateSection();
  const del = useDeleteSection();
  const [newTitle, setNewTitle] = useState("");

  return (
    <div className="space-y-4">
      <div className="b2b-card p-4 flex gap-2">
        <Input
          placeholder="New section title (e.g. Coding round)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <Button
          className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          onClick={async () => {
            if (!newTitle.trim()) return;
            await create.mutateAsync({
              assessment_id: assessmentId,
              title: newTitle.trim(),
              order_index: sections?.length ?? 0,
            });
            setNewTitle("");
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Add section
        </Button>
      </div>

      {!sections?.length && (
        <div className="b2b-card p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No sections yet. Add one above to start composing the assessment.
        </div>
      )}

      <div className="space-y-3">
        {sections?.map((s) => (
          <div key={s.id} className="b2b-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">{s.title}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (!confirm(`Delete section "${s.title}"?`)) return;
                  await del.mutateAsync({ id: s.id, assessment_id: assessmentId });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <SectionQuestions sectionId={s.id} orgId={orgId} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionQuestions({ sectionId, orgId }: { sectionId: string; orgId: string }) {
  const { data: rows } = useSectionQuestions(sectionId);
  const { data: bank } = useQuestions(orgId);
  const add = useAddQuestionToSection();
  const remove = useRemoveQuestionFromSection();
  const [pick, setPick] = useState<string>("");

  const used = new Set((rows ?? []).map((r: any) => r.question?.id));
  const available = (bank ?? []).filter((q) => !used.has(q.id));

  return (
    <div className="space-y-2">
      {(rows ?? []).map((r: any) => {
        const q: Question = r.question;
        return (
          <div
            key={r.id}
            className="flex items-center justify-between border border-[hsl(var(--border))] rounded-md px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="outline">{TYPE_LABEL[q.type] ?? q.type}</Badge>
              <span className="truncate">{q.title}</span>
              <span className="text-[hsl(var(--muted-foreground))] text-xs">{q.points} pts</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => remove.mutate({ id: r.id, section_id: sectionId })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      <div className="flex gap-2">
        <Select value={pick} onValueChange={setPick}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={available.length ? "Add question from bank…" : "Question bank empty"} />
          </SelectTrigger>
          <SelectContent>
            {available.map((q) => (
              <SelectItem key={q.id} value={q.id}>
                [{TYPE_LABEL[q.type] ?? q.type}] {q.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          disabled={!pick}
          onClick={async () => {
            await add.mutateAsync({
              section_id: sectionId,
              question_id: pick,
              order_index: rows?.length ?? 0,
            });
            setPick("");
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function SettingsPanel({
  assessment,
  onDelete,
}: {
  assessment: any;
  onDelete: () => void;
}) {
  const update = useUpdateAssessment();
  const [title, setTitle] = useState(assessment.title);
  const [duration, setDuration] = useState(assessment.duration_min);
  const [maxAttempts, setMaxAttempts] = useState(assessment.max_attempts);
  const [proctoring, setProctoring] = useState<boolean>(!!assessment.proctoring_enabled);
  const [proctoringConfig, setProctoringConfig] = useState<ProctoringConfig | null>(
    (assessment.proctoring_config as ProctoringConfig | null) ?? null
  );
  const [showResults, setShowResults] = useState<boolean>(assessment.show_results_to_candidate !== false);
  const [startsAt, setStartsAt] = useState(toLocalInput(assessment.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalInput(assessment.ends_at));
  const [brandColor, setBrandColor] = useState<string>(
    typeof assessment.brand_color === "string" ? assessment.brand_color : ""
  );
  const normalizedBrand = brandColor.trim();
  const isValidBrand =
    normalizedBrand === "" || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalizedBrand);

  const now = Date.now();
  const startMs = startsAt ? new Date(startsAt).getTime() : null;
  const endMs = endsAt ? new Date(endsAt).getTime() : null;
  const windowError =
    startMs && endMs && endMs <= startMs ? "End time must be after start time." : null;

  let windowState = "Open immediately when published";
  if (startMs && endMs) {
    if (now < startMs) windowState = `Opens ${new Date(startMs).toLocaleString()}`;
    else if (now > endMs) windowState = `Closed at ${new Date(endMs).toLocaleString()}`;
    else windowState = `Live · closes ${new Date(endMs).toLocaleString()}`;
  } else if (startMs && now < startMs) {
    windowState = `Opens ${new Date(startMs).toLocaleString()}`;
  } else if (endMs && now > endMs) {
    windowState = `Closed at ${new Date(endMs).toLocaleString()}`;
  }

  return (
    <div className="b2b-card p-6 space-y-5 max-w-2xl">
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Duration (min)</label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 60)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Max attempts</label>
          <Input
            type="number"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Schedule window</div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Leave empty to open immediately when published. Times are in your local timezone.
            </p>
          </div>
          <Badge variant="outline" className="text-[10px]">{windowState}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))]">Opens at</label>
            <Input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))]">Closes at</label>
            <Input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        {windowError && (
          <p className="text-xs text-destructive">{windowError}</p>
        )}
      </div>

      <div className="border-t pt-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Proctoring</div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Tracks tab switches, copy/paste, and fullscreen exits. Penalties reduce integrity score.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={proctoring}
          onClick={() => setProctoring((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            proctoring ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--secondary))]"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              proctoring ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <AssessmentProctoringConfig
        value={proctoringConfig}
        enabled={proctoring}
        onChange={(cfg) => setProctoringConfig(cfg)}
      />

      <div className="border-t pt-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Show results to candidate</div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            When off, candidates only see a submission confirmation and feedback form — no score, breakdown, integrity, or receipt PDF.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showResults}
          onClick={() => setShowResults((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            showResults ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--secondary))]"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              showResults ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="text-sm font-medium">Brand color override</div>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Optional. When set, this color is used for the invitation email of this assessment instead of your organization's default.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalizedBrand) ? normalizedBrand : "#0f172a"}
            onChange={(e) => setBrandColor(e.target.value)}
            className="h-9 w-12 rounded border border-[hsl(var(--border))] bg-transparent p-0.5 cursor-pointer"
            aria-label="Pick brand color"
          />
          <Input
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            placeholder="#0f172a (leave empty to use org default)"
            className="max-w-xs font-mono text-sm"
          />
          {normalizedBrand && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setBrandColor("")}
            >
              Clear
            </Button>
          )}
        </div>
        {!isValidBrand && (
          <p className="text-xs text-destructive">Use a hex color like #1e40af or leave empty.</p>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button
          className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          disabled={!!windowError || !isValidBrand}
          onClick={async () => {
            await update.mutateAsync({
              id: assessment.id,
              patch: {
                title,
                duration_min: duration,
                max_attempts: maxAttempts,
                proctoring_enabled: proctoring,
                proctoring_config: (proctoringConfig as unknown as Record<string, unknown>) ?? null,
                show_results_to_candidate: showResults,
                starts_at: fromLocalInput(startsAt),
                ends_at: fromLocalInput(endsAt),
                brand_color: normalizedBrand === "" ? null : normalizedBrand,
              },
            });
            toast.success("Saved");
          }}
        >
          Save changes
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete assessment
        </Button>
      </div>
    </div>
  );
}

import { InvitesPanel } from "../../components/invites/InvitesPanel";
export { InvitesPanel };





function ResultsPanel({ assessment, basePath }: { assessment: { id: string; slug: string | null }; basePath: string }) {
  const assessmentId = assessment.id;
  const { data: attempts, isLoading } = useAttempts(assessmentId);
  if (isLoading) return null;
  if (!attempts?.length) {
    return (
      <div className="b2b-card p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        No attempts yet. Once invited candidates start the assessment, their progress will appear here.
      </div>
    );
  }

  function exportCsv() {
    const rows = [
      ["name", "email", "external_id", "status", "score", "integrity_score", "started_at", "submitted_at"],
      ...attempts.map((a) => [
        a.invite?.name ?? "",
        a.invite?.email ?? "",
        a.invite?.external_id ?? "",
        a.status,
        a.score?.toString() ?? "",
        a.integrity_score.toString(),
        a.started_at,
        a.submitted_at ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `results-${assessmentId.slice(0, 8)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={exportCsv}>Export CSV</Button>
      </div>
    <div className="b2b-card overflow-hidden">
      <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
        <div className="col-span-4">Candidate</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Score</div>
        <div className="col-span-2">Integrity</div>
        <div className="col-span-2 text-right">Action</div>
      </div>
      <div className="divide-y">
        {attempts.map((a) => (
          <div key={a.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
            <div className="col-span-4 min-w-0">
              <div className="font-medium truncate">{a.invite?.name ?? a.invite?.email ?? "Candidate"}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">{a.invite?.email}</div>
            </div>
            <div className="col-span-2"><Badge variant={a.status === "submitted" ? "default" : "secondary"}>{a.status}</Badge></div>
            <div className="col-span-2">{a.score ?? <span className="text-[hsl(var(--muted-foreground))]">—</span>}</div>
            <div className="col-span-2">{a.integrity_score}</div>
            <div className="col-span-2 text-right">
              <Link to={paths.b2b.attempt(basePath, assessment, a)}>
                <Button size="sm" variant="outline">Review</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}

function InsightsPanel({ assessmentId }: { assessmentId: string }) {
  const { data, isLoading, error } = useAssessmentInsights(assessmentId);

  if (isLoading) return null;
  if (error)
    return (
      <div className="b2b-card p-6 text-sm text-destructive">
        Failed to load insights: {(error as Error).message}
      </div>
    );
  if (!data) return null;

  const { totals, scoreDistribution, perQuestion } = data;
  const maxBucket = Math.max(1, ...scoreDistribution.map((b) => b.count));
  const fmtPct = (n: number) => `${Math.round(n * 100)}%`;
  const fmtNum = (n: number | null, digits = 1) =>
    n === null ? "—" : Number.isInteger(n) ? String(n) : n.toFixed(digits);

  const stat = (label: string, value: string, hint?: string) => (
    <div className="b2b-card p-4">
      <div className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{hint}</div>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stat("Invited", String(totals.invited))}
        {stat("Started", String(totals.started), `${totals.inProgress} in progress`)}
        {stat(
          "Submitted",
          String(totals.submitted),
          totals.invited > 0 ? `${fmtPct(totals.completionRate)} completion` : undefined
        )}
        {stat(
          "Avg score",
          totals.avgScore === null
            ? "—"
            : `${fmtNum(totals.avgScore)} / ${totals.maxPossible}`,
          totals.avgIntegrity !== null ? `Integrity ${fmtNum(totals.avgIntegrity)}` : undefined
        )}
      </div>

      <div className="b2b-card p-4">
        <div className="text-sm font-medium mb-3">Score distribution (submitted attempts)</div>
        {totals.maxPossible === 0 || totals.submitted === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            Not enough data yet — distribution appears once candidates submit.
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-3 items-end h-40">
            {scoreDistribution.map((b) => (
              <div key={b.bucket} className="flex flex-col items-center gap-1.5 h-full">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full rounded-t-md bg-[hsl(var(--primary))] transition-all"
                    style={{ height: `${(b.count / maxBucket) * 100}%`, minHeight: b.count > 0 ? 6 : 0 }}
                    title={`${b.count} attempt(s)`}
                  />
                </div>
                <div className="text-[10px] text-[hsl(var(--muted-foreground))]">{b.bucket}</div>
                <div className="text-xs font-medium">{b.count}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="b2b-card overflow-hidden">
        <div className="px-4 py-2 text-sm font-medium border-b border-[hsl(var(--border))]">
          Per-question performance
        </div>
        {perQuestion.length === 0 ? (
          <div className="p-6 text-sm text-[hsl(var(--muted-foreground))]">
            Add questions to sections to see per-question stats.
          </div>
        ) : (
          <div className="divide-y">
            <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              <div className="col-span-6">Question</div>
              <div className="col-span-2">Attempts</div>
              <div className="col-span-2">Avg score</div>
              <div className="col-span-2">Accuracy</div>
            </div>
            {perQuestion.map((q) => (
              <div key={q.question_id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                <div className="col-span-6 min-w-0 flex items-center gap-2">
                  <Badge variant="outline" className="uppercase">{q.type}</Badge>
                  <span className="truncate">{q.title}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{q.points} pts</span>
                </div>
                <div className="col-span-2">{q.attempts}</div>
                <div className="col-span-2">
                  {q.avgScore === null ? (
                    <span className="text-[hsl(var(--muted-foreground))]">—</span>
                  ) : (
                    <span>
                      {fmtNum(q.avgScore)} <span className="text-xs text-[hsl(var(--muted-foreground))]">/ {q.points}</span>
                    </span>
                  )}
                </div>
                <div className="col-span-2">
                  {q.accuracy === null ? (
                    <span className="text-[hsl(var(--muted-foreground))]">—</span>
                  ) : (
                    <span>{fmtPct(q.accuracy)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
