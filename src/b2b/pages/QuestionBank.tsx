import { useState } from "react";
import { Navigate } from "react-router-dom";
import { OrgShell } from "../layouts/OrgShell";
import { useMyOrganizations } from "../hooks/useOrg";
import {
  useQuestions,
  useCreateQuestion,
  useDeleteQuestion,
  useMcqOptions,
  useUpsertMcqOption,
  useDeleteMcqOption,
  useTestCases,
  useUpsertTestCase,
  useDeleteTestCase,
  type QuestionType,
  type Question,
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
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Library } from "lucide-react";
import { toast } from "sonner";

const TYPES: { value: QuestionType; label: string }[] = [
  { value: "coding", label: "Coding" },
  { value: "mcq", label: "MCQ" },
  { value: "sql", label: "SQL" },
  { value: "subjective", label: "Subjective" },
];

export default function QuestionBank() {
  const { data: orgs, isLoading } = useMyOrganizations();
  const org = orgs?.[0];
  const { data: questions } = useQuestions(org?.id);
  const del = useDeleteQuestion();
  const [editing, setEditing] = useState<Question | null>(null);

  if (isLoading) return <OrgShell title="Question Bank">Loading…</OrgShell>;
  if (!orgs?.length) return <Navigate to="/b2b/onboarding" replace />;

  return (
    <OrgShell
      title="Question Bank"
      actions={<NewQuestionDialog orgId={org!.id} />}
    >
      {!questions?.length ? (
        <div className="b2b-card p-12 text-center">
          <Library className="h-8 w-8 mx-auto text-[hsl(var(--muted-foreground))]" />
          <p className="mt-3 font-medium">No questions yet</p>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Build a reusable bank of coding, MCQ, SQL, and subjective questions.
          </p>
          <div className="mt-4 flex justify-center">
            <NewQuestionDialog orgId={org!.id} />
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {questions.map((q) => (
            <div key={q.id} className="b2b-card p-4 flex items-center justify-between gap-3">
              <button
                onClick={() => setEditing(q)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{q.type}</Badge>
                  <span className="font-medium truncate">{q.title}</span>
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {q.points} pts {q.language ? `· ${q.language}` : ""}
                </div>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!confirm(`Delete "${q.title}"?`)) return;
                  del.mutate({ id: q.id, org_id: q.org_id });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <QuestionEditorDialog
          question={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </OrgShell>
  );
}

function NewQuestionDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<QuestionType>("mcq");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [points, setPoints] = useState(10);
  const [language, setLanguage] = useState("");
  const create = useCreateQuestion();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
          <Plus className="h-4 w-4 mr-1" /> New question
        </Button>
      </DialogTrigger>
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
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            disabled={!title.trim() || create.isPending}
            onClick={async () => {
              await create.mutateAsync({
                org_id: orgId,
                type,
                title: title.trim(),
                body_md: body || undefined,
                points,
                language: language || undefined,
              });
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
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline">{question.type}</Badge>
            {question.title}
          </DialogTitle>
        </DialogHeader>
        {question.body_md && (
          <div className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap border rounded-md p-3 bg-[hsl(var(--secondary))]">
            {question.body_md}
          </div>
        )}
        {question.type === "mcq" && <McqEditor questionId={question.id} />}
        {(question.type === "coding" || question.type === "sql") && <TestCaseEditor questionId={question.id} />}
        {question.type === "subjective" && (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Subjective answers are graded manually from the results dashboard.
          </p>
        )}
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
