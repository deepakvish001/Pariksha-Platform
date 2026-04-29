import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface AdhocTaskInput {
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  est_minutes: number;
  day_date: string;
}

interface Props {
  defaultDay?: string;
  onAdd: (task: AdhocTaskInput) => Promise<void>;
  trigger?: React.ReactNode;
}

const todayIso = () => {
  const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10);
};

export const AddAdhocTaskDialog = ({ defaultDay, onAdd, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<AdhocTaskInput>({
    title: "",
    topic: "Custom",
    difficulty: "medium",
    est_minutes: 30,
    day_date: defaultDay ?? todayIso(),
  });

  const reset = () => setForm({
    title: "", topic: "Custom", difficulty: "medium",
    est_minutes: 30, day_date: defaultDay ?? todayIso(),
  });

  const submit = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await onAdd({ ...form, title: form.title.trim(), topic: form.topic.trim() || "Custom" });
      toast({ title: "Task added", description: `Scheduled for ${form.day_date}` });
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
              id="adhoc-title" value={form.title} autoFocus
              placeholder="e.g. Review binary search notes"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="adhoc-topic">Topic</Label>
              <Input
                id="adhoc-topic" value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adhoc-min">Minutes</Label>
              <Input
                id="adhoc-min" type="number" min={5} max={480} value={form.est_minutes}
                onChange={(e) => setForm({ ...form, est_minutes: Math.max(5, Number(e.target.value) || 30) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v) => setForm({ ...form, difficulty: v as AdhocTaskInput["difficulty"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                id="adhoc-day" type="date" value={form.day_date}
                onChange={(e) => setForm({ ...form, day_date: e.target.value })}
              />
            </div>
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
