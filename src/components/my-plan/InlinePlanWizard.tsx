import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2, Sparkles, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudyProfile } from "@/hooks/useStudyProfile";

interface Props {
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

const STEP_TITLES = ["Goal", "Level", "Time budget", "Review"];

export const InlinePlanWizard = ({ initial, onComplete }: Props) => {
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

  const submit = async () => {
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-4 sm:p-8 space-y-6 max-w-3xl mx-auto bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Set up your personalized plan</h2>
        <p className="text-sm text-muted-foreground">
          Takes about a minute — your goals, level, and weekly time budget power the AI scheduler.
        </p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center justify-between gap-2 px-2 sm:px-6">
        {STEP_TITLES.map((title, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li key={title} className="flex-1 flex items-center gap-2 min-w-0">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary/20 text-primary border border-primary",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs sm:text-sm truncate",
                  active ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {title}
              </span>
              {i < STEP_TITLES.length - 1 && (
                <div className={cn("flex-1 h-px", done ? "bg-primary" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>

      <div className="min-h-[300px]">
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
              <Label>Topics you already know (optional)</Label>
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
                <span className="text-sm text-muted-foreground">
                  {weekday} min/day · {(weekday * 5 / 60).toFixed(1)} hrs/week
                </span>
              </div>
              <Slider value={[weekday]} onValueChange={(v) => setWeekday(v[0])} min={15} max={300} step={15} aria-label="Weekday study time" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Weekend study time</Label>
                <span className="text-sm text-muted-foreground">
                  {weekend} min/day · {(weekend * 2 / 60).toFixed(1)} hrs/weekend
                </span>
              </div>
              <Slider value={[weekend]} onValueChange={(v) => setWeekend(v[0])} min={15} max={480} step={15} aria-label="Weekend study time" />
            </div>
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm">
              <strong>Total weekly:</strong>{" "}
              {(((weekday * 5) + (weekend * 2)) / 60).toFixed(1)} hours
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
              Save your profile, then connect coding profiles (optional) and generate your plan.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submitting}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => Math.min(3, s + 1))}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save & continue
          </Button>
        )}
      </div>
    </Card>
  );
};
