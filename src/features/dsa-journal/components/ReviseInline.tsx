import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RotateCw } from "lucide-react";
import type { JournalEntry } from "../types";
import { useLogRevision, useEntryRevisions } from "../api";
import { formatRelative } from "@/lib/formatRelative";

export default function ReviseInline({
  entry,
  trigger,
}: {
  entry: JournalEntry;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
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
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
            <RotateCw className="h-3 w-3 mr-1" /> Revise
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-3" align="end">
        <div className="text-xs font-semibold mb-2 truncate">
          Log revision — {entry.title}
        </div>
        <form onSubmit={submit} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="revise-inline-attempts" className="text-[11px]">Attempts</Label>
              <Input
                id="revise-inline-attempts"
                type="number"
                min={1}
                className="h-8"
                value={attempts}
                onChange={(e) => setAttempts(Math.max(1, +e.target.value || 1))}
              />
            </div>
            <div>
              <Label htmlFor="revise-inline-time" className="text-[11px]">Time (min)</Label>
              <Input
                id="revise-inline-time"
                type="number"
                min={0}
                className="h-8"
                value={time}
                onChange={(e) =>
                  setTime(e.target.value === "" ? "" : Math.max(0, +e.target.value))
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-2">
            <div className="text-xs">Solved cleanly in 1 try?</div>
            <Switch checked={clean} onCheckedChange={setClean} aria-label="Solved cleanly in 1 try?" />
          </div>
          <div>
            <Label htmlFor="revise-inline-note" className="text-[11px]">Note</Label>
            <Textarea
              id="revise-inline-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything you noticed"
              className="text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={log.isPending}>
              Save
            </Button>
          </div>
        </form>
        {history.data && history.data.length > 0 && (
          <div className="border-t pt-2 mt-2">
            <div className="text-[10px] font-semibold mb-1 text-muted-foreground uppercase">
              Past revisions
            </div>
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {history.data.map((r) => (
                <li key={r.id} className="text-[11px] flex justify-between gap-2">
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
      </PopoverContent>
    </Popover>
  );
}
