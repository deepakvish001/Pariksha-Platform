import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import type { StudyProfile } from "@/hooks/useStudyProfile";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<StudyProfile>;
  onComplete: (profile: Omit<StudyProfile, "user_id">) => Promise<void>;
}

const GOALS = [
  { value: "placement", label: "Campus placement" },
  { value: "internship", label: "Internship" },
  { value: "faang", label: "FAANG / top product companies" },
  { value: "switch", label: "Switch jobs" },
  { value: "competitive", label: "Competitive programming" },
];

const LEVELS = [
  { value: "beginner", label: "Beginner — just starting out" },
  { value: "intermediate", label: "Intermediate — solved 50-200 problems" },
  { value: "advanced", label: "Advanced — solved 200+ and ready for hard topics" },
];

const COMMON_TOPICS = [
  "Arrays", "Strings", "Linked List", "Stacks", "Queues", "Recursion",
  "Trees", "Graphs", "DP", "Greedy", "Sliding Window", "Backtracking",
  "Heap", "Tries", "OOP", "DBMS", "OS", "Networking", "SQL", "System Design",
];

export const PlanOnboardingWizard = ({ open, onOpenChange, initial, onComplete }: Props) => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [goal, setGoal] = useState(initial?.goal ?? "placement");
  const [targetDate, setTargetDate] = useState(initial?.target_date ?? "");
  const [level, setLevel] = useState(initial?.level ?? "beginner");
  const [weekday, setWeekday] = useState(initial?.weekday_minutes ?? 60);
  const [weekend, setWeekend] = useState(initial?.weekend_minutes ?? 120);
  const [topics, setTopics] = useState<string[]>(initial?.topics_known ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const toggleTopic = (t: string) =>
    setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onComplete({
        goal,
        target_date: targetDate || null,
        weekday_minutes: weekday,
        weekend_minutes: weekend,
        level,
        topics_known: topics,
        notes: notes || null,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalize your study plan</DialogTitle>
          <DialogDescription>Step {step + 1} of 4 — takes about a minute</DialogDescription>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-4">
            <Label className="text-base">What's your main goal?</Label>
            <RadioGroup value={goal} onValueChange={setGoal} className="gap-3">
              {GOALS.map((g) => (
                <Label
                  key={g.value}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50"
                >
                  <RadioGroupItem value={g.value} />
                  <span>{g.label}</span>
                </Label>
              ))}
            </RadioGroup>
            <div className="space-y-2">
              <Label htmlFor="target">Target date (optional)</Label>
              <Input id="target" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Label className="text-base">How would you describe your current level?</Label>
            <RadioGroup value={level} onValueChange={setLevel} className="gap-3">
              {LEVELS.map((l) => (
                <Label
                  key={l.value}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50"
                >
                  <RadioGroupItem value={l.value} />
                  <span>{l.label}</span>
                </Label>
              ))}
            </RadioGroup>
            <div className="space-y-2">
              <Label>Topics you're already comfortable with (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_TOPICS.map((t) => {
                  const active = topics.includes(t);
                  return (
                    <Badge
                      key={t}
                      variant={active ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTopic(t)}
                    >
                      {t}
                      {active && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Weekday study time</Label>
                <span className="text-sm text-muted-foreground">{weekday} min/day</span>
              </div>
              <Slider value={[weekday]} onValueChange={(v) => setWeekday(v[0])} min={15} max={300} step={15} aria-label="Weekday study time" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Weekend study time</Label>
                <span className="text-sm text-muted-foreground">{weekend} min/day</span>
              </div>
              <Slider value={[weekend]} onValueChange={(v) => setWeekend(v[0])} min={15} max={480} step={15} aria-label="Weekend study time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Anything else? (optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g. focus on graphs, weak in DP, prefer Python..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Label className="text-base">Review</Label>
            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <p><strong>Goal:</strong> {GOALS.find((g) => g.value === goal)?.label}</p>
              {targetDate && <p><strong>Target:</strong> {targetDate}</p>}
              <p><strong>Level:</strong> {LEVELS.find((l) => l.value === level)?.label}</p>
              <p><strong>Weekday:</strong> {weekday} min · <strong>Weekend:</strong> {weekend} min</p>
              <p><strong>Known topics:</strong> {topics.length ? topics.join(", ") : "none"}</p>
              {notes && <p><strong>Notes:</strong> {notes}</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              Next, you'll connect your coding profiles (optional) and we'll generate your plan.
            </p>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="ghost" onClick={prev} disabled={step === 0 || submitting}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < 3 ? (
            <Button onClick={next}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save profile
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
