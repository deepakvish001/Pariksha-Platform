import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreateQuestion, useUpsertMcqOption, useUpsertTestCase, type QuestionType } from "../../hooks/useQuestions";
import { useAddQuestionToSection } from "../../hooks/useAssessments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

type GenType = "mcq" | "coding" | "sql" | "subjective";

type DraftMcq = {
  type: "mcq";
  title: string;
  body_md: string;
  points: number;
  options: { body: string; is_correct: boolean }[];
};
type DraftCoding = {
  type: "coding";
  title: string;
  body_md: string;
  points: number;
  language: string;
  test_cases: { input: string; expected_output: string; is_hidden: boolean }[];
};
type DraftSql = {
  type: "sql";
  title: string;
  body_md: string;
  points: number;
  language: string;
  test_cases: { input: string; expected_output: string; is_hidden: boolean }[];
};
type DraftSubjective = { type: "subjective"; title: string; body_md: string; points: number };
type Draft = DraftMcq | DraftCoding | DraftSql | DraftSubjective;

export function AiGenerateQuestionsDialog({
  open,
  onOpenChange,
  orgId,
  sectionId,
  existingCount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orgId: string;
  sectionId: string;
  existingCount: number;
}) {
  const [topic, setTopic] = useState("");
  const [type, setType] = useState<GenType>("mcq");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const createQuestion = useCreateQuestion();
  const upsertMcq = useUpsertMcqOption();
  const upsertTc = useUpsertTestCase();
  const addToSection = useAddQuestionToSection();

  async function generate() {
    if (!topic.trim()) {
      toast.error("Add a topic prompt to generate questions");
      return;
    }
    setLoading(true);
    setDrafts([]);
    setSelected(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("parikshaa-generate-questions", {
        body: { topic: topic.trim(), type, count, difficulty },
      });
      if (error) throw error;
      const arr = Array.isArray(data) ? data : data?.questions ?? [];
      if (!Array.isArray(arr) || !arr.length) throw new Error("No questions returned");
      setDrafts(arr as Draft[]);
      setSelected(new Set(arr.map((_, i) => i)));
    } catch (e: any) {
      toast.error(e?.message ?? "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveSelected() {
    if (!selected.size) {
      toast.error("Select at least one question");
      return;
    }
    setSaving(true);
    let order = existingCount;
    let saved = 0;
    try {
      for (let i = 0; i < drafts.length; i++) {
        if (!selected.has(i)) continue;
        const d = drafts[i];
        const q = await createQuestion.mutateAsync({
          org_id: orgId,
          type: d.type as QuestionType,
          title: d.title,
          body_md: d.body_md,
          points: d.points ?? 10,
          language: (d as DraftCoding).language ?? undefined,
          meta: { source: "ai", topic: topic.trim(), difficulty } as Record<string, unknown>,
        });
        if (d.type === "mcq") {
          for (let oi = 0; oi < d.options.length; oi++) {
            const opt = d.options[oi];
            await upsertMcq.mutateAsync({
              question_id: q.id,
              body: opt.body,
              is_correct: opt.is_correct,
              order_index: oi,
            });
          }
        } else if (d.type === "coding" || d.type === "sql") {
          for (let ti = 0; ti < d.test_cases.length; ti++) {
            const tc = d.test_cases[ti];
            await upsertTc.mutateAsync({
              question_id: q.id,
              input: tc.input,
              expected_output: tc.expected_output,
              is_hidden: tc.is_hidden,
              order_index: ti,
              weight: 1,
            });
          }
        }
        await addToSection.mutateAsync({
          section_id: sectionId,
          question_id: q.id,
          order_index: order++,
        });
        saved++;
      }
      toast.success(`Added ${saved} AI question${saved === 1 ? "" : "s"} to this section`);
      onOpenChange(false);
      setDrafts([]);
      setSelected(new Set());
      setTopic("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save questions");
    } finally {
      setSaving(false);
    }
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
            Generate questions with AI
          </DialogTitle>
          <DialogDescription>
            Drafts go to your org question bank and attach to this section. Review before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-4 space-y-1">
            <Label>Topic / Prompt</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Arrays & hashing for SDE-1 screening; or JD: 'React + Node + SQL fundamentals'"
              rows={2}
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as GenType)} disabled={loading || saving}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mcq">MCQ</SelectItem>
                <SelectItem value="coding">Coding</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="subjective">Subjective</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)} disabled={loading || saving}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Count</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              disabled={loading || saving}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={generate} disabled={loading || saving} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1" />}
              Generate
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2 min-h-[120px]">
          {!drafts.length && !loading && (
            <div className="text-center text-xs text-muted-foreground py-8 border border-dashed border-white/10 rounded-lg">
              Generated questions will appear here.
            </div>
          )}
          {loading && (
            <div className="text-center text-xs text-muted-foreground py-8">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Generating with Gemini…
            </div>
          )}
          {drafts.map((d, i) => (
            <div
              key={i}
              className={`rounded-lg border px-3 py-2 ${
                selected.has(i)
                  ? "border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/[0.04]"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start gap-2">
                <Checkbox checked={selected.has(i)} onCheckedChange={() => toggle(i)} className="mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{d.type.toUpperCase()}</Badge>
                    <span className="text-xs text-muted-foreground">{d.points} pts</span>
                    <span className="font-medium text-sm truncate">{d.title}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                    {d.body_md}
                  </div>
                  {d.type === "mcq" && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {d.options.map((o, oi) => (
                        <div
                          key={oi}
                          className={`text-[11px] px-2 py-1 rounded border ${
                            o.is_correct
                              ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/5"
                              : "border-white/10 text-muted-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}. {o.body}
                        </div>
                      ))}
                    </div>
                  )}
                  {(d.type === "coding" || d.type === "sql") && (
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      {d.test_cases.length} test case{d.test_cases.length === 1 ? "" : "s"} · {d.language ?? "—"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={saveSelected}
            disabled={!selected.size || saving || loading}
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Save {selected.size || ""} to section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
