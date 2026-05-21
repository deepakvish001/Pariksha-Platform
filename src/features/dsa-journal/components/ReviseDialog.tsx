import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { JournalEntry } from "../types";
import { useLogRevision, useEntryRevisions } from "../api";
import { formatRelative } from "@/lib/formatRelative";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entry: JournalEntry;
}

export default function ReviseDialog({ open, onOpenChange, entry }: Props) {
  const log = useLogRevision();
  const history = useEntryRevisions(open ? entry.id : "");
  const [attempts, setAttempts] = useState(1);
  const [time, setTime] = useState<number | "">("");
  const [clean, setClean] = useState(true);
  const [note, setNote] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await log.mutateAsync({
      entry,
      attempts,
      time_taken_min: typeof time === "number" ? time : null,
      solved_clean: clean,
      note: note.trim() || null,
    });
    setAttempts(1);
    setTime("");
    setClean(true);
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log revision — {entry.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Attempts</Label>
              <Input
                type="number"
                min={1}
                value={attempts}
                onChange={(e) => setAttempts(Math.max(1, +e.target.value || 1))}
              />
            </div>
            <div>
              <Label>Time (min)</Label>
              <Input
                type="number"
                min={0}
                value={time}
                onChange={(e) =>
                  setTime(e.target.value === "" ? "" : Math.max(0, +e.target.value))
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Solved cleanly in 1 try?</div>
              <div className="text-xs text-muted-foreground">
                Cleanly solved → next revision pushed further out.
              </div>
            </div>
            <Switch checked={clean} onCheckedChange={setClean} />
          </div>
          <div>
            <Label>Note</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything you noticed this time"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={log.isPending}>
              Save revision
            </Button>
          </div>
        </form>

        {history.data && history.data.length > 0 && (
          <div className="border-t pt-3 mt-2">
            <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
              Past revisions
            </div>
            <ul className="space-y-1.5 max-h-40 overflow-y-auto">
              {history.data.map((r) => (
                <li
                  key={r.id}
                  className="text-xs flex items-center justify-between gap-2"
                >
                  <span>
                    {r.revised_on} · {r.attempts}× ·{" "}
                    {r.solved_clean ? (
                      <span className="text-emerald-400">clean</span>
                    ) : (
                      <span className="text-amber-400">needs more</span>
                    )}
                    {r.time_taken_min != null && ` · ${r.time_taken_min}m`}
                  </span>
                  <span className="text-muted-foreground">
                    {formatRelative(r.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
