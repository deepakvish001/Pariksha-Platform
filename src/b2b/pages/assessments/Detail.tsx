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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, ArrowLeft, Send, Archive } from "lucide-react";
import { toast } from "sonner";

const TYPE_LABEL: Record<string, string> = {
  coding: "Code",
  mcq: "MCQ",
  sql: "SQL",
  subjective: "Written",
};

export default function AssessmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: assessment, isLoading } = useAssessment(id);
  const update = useUpdateAssessment();
  const del = useDeleteAssessment();

  if (isLoading) return <OrgShell title="Assessment">Loading…</OrgShell>;
  if (!assessment) return <Navigate to="/b2b/assessments" replace />;

  const isPublished = assessment.status === "published";

  return (
    <OrgShell
      title={assessment.title}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/b2b/assessments")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Badge variant={isPublished ? "default" : "secondary"}>{assessment.status}</Badge>
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
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="sections">
          <SectionsPanel assessmentId={assessment.id} orgId={assessment.org_id} />
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

  return (
    <div className="b2b-card p-6 space-y-4 max-w-2xl">
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
      <div className="flex gap-2 pt-2">
        <Button
          className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          onClick={async () => {
            await update.mutateAsync({
              id: assessment.id,
              patch: { title, duration_min: duration, max_attempts: maxAttempts },
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
