import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
  RotateCw,
  Clock,
  Repeat,
  CheckCircle2,
  Heart,
  Building2,
  Code2,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "../types";
import {
  useDeleteEntry,
  useToggleFavorite,
  useSnoozeEntry,
  useMarkMastered,
} from "../api";
import EntryForm from "./EntryForm";
import ReviseDialog from "./ReviseDialog";


const diffStyle: Record<string, string> = {
  Easy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Hard: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const statusStyle: Record<string, string> = {
  solved: "text-emerald-400",
  partial: "text-amber-400",
  stuck: "text-rose-400",
};

interface Props {
  entry: JournalEntry;
}

export default function EntryCard({ entry }: Props) {
  const del = useDeleteEntry();
  const fav = useToggleFavorite();
  const snooze = useSnoozeEntry();
  const master = useMarkMastered();
  const [editOpen, setEditOpen] = useState(false);
  const [reviseOpen, setReviseOpen] = useState(false);

  return (
    <div className="group rounded-xl border border-border/40 bg-card/40 p-4 hover:border-border transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fav.mutate({ id: entry.id, value: !entry.is_favorite })}
              aria-label="Toggle favorite"
              className="p-0.5"
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5",
                  entry.is_favorite ? "fill-rose-500 text-rose-500" : "text-muted-foreground/60",
                )}
              />
            </button>
            <h3 className="font-medium text-sm truncate">{entry.title}</h3>
            {entry.difficulty && (
              <Badge
                variant="outline"
                className={cn("h-5 text-[10px]", diffStyle[entry.difficulty])}
              >
                {entry.difficulty}
              </Badge>
            )}
            {entry.source && (
              <Badge variant="outline" className="h-5 text-[10px]">
                {entry.source}
              </Badge>
            )}
            {entry.mastered_at && (
              <Badge className="h-5 text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" /> Mastered
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {entry.topic && <span>📁 {entry.topic}</span>}
            {entry.pattern && <span>🧩 {entry.pattern}</span>}
            {entry.time_taken_min != null && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {entry.time_taken_min}m
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Repeat className="h-3 w-3" /> {entry.attempts} attempt
              {entry.attempts === 1 ? "" : "s"}
            </span>
            <span className={statusStyle[entry.status]}>● {entry.status}</span>
            {entry.solved_clean && (
              <span className="text-emerald-400">✓ clean</span>
            )}
            {(entry.time_complexity || entry.space_complexity) && (
              <span className="inline-flex items-center gap-1">
                <Code2 className="h-3 w-3" />
                {entry.time_complexity ?? "—"}
                {entry.space_complexity ? ` / ${entry.space_complexity}` : ""}
              </span>
            )}
            {entry.companies?.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {entry.companies.join(", ")}
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setReviseOpen(true)}>
              <RotateCw className="h-3.5 w-3.5 mr-2" /> Log revision
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => snooze.mutate({ id: entry.id, days: 1 })}>
              <CalendarClock className="h-3.5 w-3.5 mr-2" /> Snooze 1 day
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => snooze.mutate({ id: entry.id, days: 3 })}>
              <CalendarClock className="h-3.5 w-3.5 mr-2" /> Snooze 3 days
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => snooze.mutate({ id: entry.id, days: 7 })}>
              <CalendarClock className="h-3.5 w-3.5 mr-2" /> Snooze 1 week
            </DropdownMenuItem>
            {!entry.mastered_at && (
              <DropdownMenuItem onSelect={() => master.mutate(entry.id)}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Mark mastered
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onSelect={() => {
                if (confirm("Delete this entry?")) del.mutate(entry.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>


      {entry.links?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {entry.links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-border/50 bg-background/40 hover:border-primary/50 hover:text-primary transition"
            >
              {l.label || "Link"} <ExternalLink className="h-2.5 w-2.5" />
            </a>
          ))}
        </div>
      )}

      {(entry.learnings || entry.mistakes) && (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          {entry.learnings && (
            <p className="text-xs rounded-md bg-emerald-500/5 border border-emerald-500/20 p-2 text-emerald-100/80">
              <span className="font-semibold text-emerald-300">💡 Learned: </span>
              {entry.learnings}
            </p>
          )}
          {entry.mistakes && (
            <p className="text-xs rounded-md bg-rose-500/5 border border-rose-500/20 p-2 text-rose-100/80">
              <span className="font-semibold text-rose-300">⚠ Mistake: </span>
              {entry.mistakes}
            </p>
          )}
        </div>
      )}

      {entry.tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {entry.tags.map((t) => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {entry.next_revision_at && !entry.mastered_at && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          Next revision:{" "}
          <span className="text-foreground">{entry.next_revision_at}</span>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit problem</DialogTitle></DialogHeader>
          <EntryForm dayId={entry.day_id} entry={entry} onDone={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <ReviseDialog
        open={reviseOpen}
        onOpenChange={setReviseOpen}
        entry={entry}
      />
    </div>
  );
}
