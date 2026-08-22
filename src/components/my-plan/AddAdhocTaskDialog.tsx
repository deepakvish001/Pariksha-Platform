import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface AdhocTaskInput {
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  est_minutes: number;
  day_date: string;
  /** Optional ISO timestamp (with timezone). When set, exporters use exact times. */
  scheduled_start?: string | null;
  /** Optional ISO timestamp (with timezone). When set with scheduled_start, exporters use exact times. */
  scheduled_end?: string | null;
}

interface Props {
  defaultDay?: string;
  onAdd: (task: AdhocTaskInput) => Promise<void>;
  trigger?: React.ReactNode;
}

const todayIso = () => {
  const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10);
};

/** Combine "YYYY-MM-DD" + "HH:mm" into a full ISO string in local time. */
const combineLocal = (dayIso: string, time: string): string | null => {
  if (!dayIso || !time) return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const [y, mo, d] = dayIso.split("-").map(Number);
  return new Date(y, mo - 1, d, h, m, 0, 0).toISOString();
};

const minutesBetween = (startTime: string, endTime: string): number => {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
};

export const AddAdhocTaskDialog = ({ defaultDay, onAdd, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("Custom");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [day, setDay] = useState(defaultDay ?? todayIso());
  const [estMinutes, setEstMinutes] = useState(30);

  // Precise times (optional)
  const [usePreciseTime, setUsePreciseTime] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:30");

  // Keep est_minutes in sync when precise times are enabled
  useEffect(() => {
    if (!usePreciseTime) return;
    const m = minutesBetween(startTime, endTime);
    if (m > 0 && m !== estMinutes) setEstMinutes(m);
  }, [usePreciseTime, startTime, endTime]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setTitle("");
    setTopic("Custom");
    setDifficulty("medium");
    setDay(defaultDay ?? todayIso());
    setEstMinutes(30);
    setUsePreciseTime(false);
    setStartTime("09:00");
    setEndTime("09:30");
  };

  const submit = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    let scheduled_start: string | null = null;
    let scheduled_end: string | null = null;
    let finalMinutes = estMinutes;

    if (usePreciseTime) {
      const span = minutesBetween(startTime, endTime);
      if (span <= 0) {
        toast({ title: "End time must be after start time", variant: "destructive" });
        return;
      }
      scheduled_start = combineLocal(day, startTime);
      scheduled_end = combineLocal(day, endTime);
      finalMinutes = span;
    }

    setBusy(true);
    try {
      await onAdd({
        title: title.trim(),
        topic: topic.trim() || "Custom",
        difficulty,
        est_minutes: Math.max(5, finalMinutes),
        day_date: day,
        scheduled_start,
        scheduled_end,
      });
      toast({
        title: "Task added",
        description: usePreciseTime
          ? `Scheduled for ${day} at ${startTime}–${endTime}`
          : `Scheduled for ${day}`,
      });
      setOpen(false);
      reset();
    } catch (e) {
      toast({
        title: "Couldn't add task", variant: "destructive",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a custom task</DialogTitle>
          <DialogDescription>Drop something not in your AI plan into a specific day.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="adhoc-title">Title</Label>
            <Input
              id="adhoc-title" value={title} autoFocus
              placeholder="e.g. Review binary search notes"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="adhoc-topic">Topic</Label>
              <Input
                id="adhoc-topic" value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adhoc-min">Minutes</Label>
              <Input
                id="adhoc-min" type="number" min={5} max={480} value={estMinutes}
                disabled={usePreciseTime}
                onChange={(e) => setEstMinutes(Math.max(5, Number(e.target.value) || 30))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="adhoc-task-difficulty">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as "easy" | "medium" | "hard")}
              >
                <SelectTrigger id="adhoc-task-difficulty"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adhoc-day">Day</Label>
              <Input
                id="adhoc-day" type="date" value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </div>
          </div>

          {/* Optional precise time block */}
          <div className="rounded-lg border border-border/50 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="adhoc-precise" className="flex items-center gap-1.5 cursor-pointer">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Set exact start &amp; end time
              </Label>
              <Switch
                id="adhoc-precise"
                checked={usePreciseTime}
                onCheckedChange={setUsePreciseTime}
              />
            </div>
            {usePreciseTime && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="adhoc-start">Start</Label>
                  <Input
                    id="adhoc-start" type="time" value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adhoc-end">End</Label>
                  <Input
                    id="adhoc-end" type="time" value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}
            {usePreciseTime && (
              <p className="text-xs text-muted-foreground">
                Calendar export will use these exact times instead of stacking from 9 AM.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
