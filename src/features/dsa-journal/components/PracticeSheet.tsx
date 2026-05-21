import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Star,
  Trash2,
  MoreVertical,
  ExternalLink,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  RotateCw,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { JournalEntry, EntryWithDay, Difficulty, EntryStatus } from "../types";
import {
  useCreateEntry,
  useUpdateEntry,
  useDeleteEntry,
  useToggleFavorite,
  useSnoozeEntry,
  useMarkMastered,
} from "../api";
import { detectSource, inferTitleFromUrl } from "../source";
import ReviseInline from "./ReviseInline";

type Row = EntryWithDay;

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const STATUSES: EntryStatus[] = ["solved", "partial", "stuck"];

interface Props {
  entries: Row[];
  dayId?: string | null;
  showAddRow?: boolean;
  showDateCol?: boolean;
  loading?: boolean;
  emptyHint?: string;
}

export default function PracticeSheet({
  entries,
  dayId,
  showAddRow = false,
  showDateCol = true,
  loading,
  emptyHint = "No entries yet — add your first solve in the row below.",
}: Props) {
  const update = useUpdateEntry();
  const remove = useDeleteEntry();
  const fav = useToggleFavorite();
  const snooze = useSnoozeEntry();
  const master = useMarkMastered();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const saveField = (id: string, patch: Partial<JournalEntry>) =>
    update.mutate({ id, patch });

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-card/60 border-b border-border/40 text-muted-foreground">
            <tr className="[&>th]:px-2 [&>th]:py-2 [&>th]:font-medium [&>th]:text-left whitespace-nowrap">
              <th className="w-8"></th>
              <th className="w-8">#</th>
              {showDateCol && <th className="w-20">Date</th>}
              <th className="min-w-[220px]">Title</th>
              <th className="w-24">Topic</th>
              <th className="w-24">Pattern</th>
              <th className="w-24">Difficulty</th>
              <th className="w-16">Attempts</th>
              <th className="w-16">Time</th>
              <th className="w-24">Status</th>
              <th className="w-16">Conf.</th>
              <th className="w-20">T.C</th>
              <th className="w-20">S.C</th>
              <th className="w-28">Companies</th>
              <th className="w-28">Tags</th>
              <th className="w-24">Next rev.</th>
              <th className="w-8 text-center">★</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={18} className="text-center py-6 text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : entries.length === 0 && !showAddRow ? (
              <tr>
                <td colSpan={18} className="text-center py-6 text-muted-foreground">
                  {emptyHint}
                </td>
              </tr>
            ) : (
              entries.map((e, i) => (
                <SheetRow
                  key={e.id}
                  entry={e}
                  index={i + 1}
                  expanded={expanded.has(e.id)}
                  showDateCol={showDateCol}
                  onToggleExpand={() => toggleExpand(e.id)}
                  onSave={(patch) => saveField(e.id, patch)}
                  onDelete={() => {
                    if (confirm(`Delete "${e.title}"?`)) remove.mutate(e.id);
                  }}
                  onToggleFav={() =>
                    fav.mutate({ id: e.id, value: !e.is_favorite })
                  }
                  onSnooze={(d) => snooze.mutate({ id: e.id, days: d })}
                  onMaster={() => master.mutate(e.id)}
                />
              ))
            )}
            {showAddRow && dayId && (
              <DraftRow dayId={dayId} showDateCol={showDateCol} />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------- Row -----------------

function SheetRow({
  entry,
  index,
  expanded,
  showDateCol,
  onToggleExpand,
  onSave,
  onDelete,
  onToggleFav,
  onSnooze,
  onMaster,
}: {
  entry: Row;
  index: number;
  expanded: boolean;
  showDateCol: boolean;
  onToggleExpand: () => void;
  onSave: (patch: Partial<JournalEntry>) => void;
  onDelete: () => void;
  onToggleFav: () => void;
  onSnooze: (days: number) => void;
  onMaster: () => void;
}) {
  return (
    <>
      <tr
        className={cn(
          "border-b border-border/30 hover:bg-card/40 transition-colors [&>td]:px-2 [&>td]:py-1 align-middle",
          entry.mastered_at && "opacity-60",
        )}
      >
        <td>
          <button
            onClick={onToggleExpand}
            className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-card/60 text-muted-foreground"
            aria-label="Expand"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        </td>
        <td className="text-muted-foreground tabular-nums">{index}</td>
        {showDateCol && (
          <td className="text-muted-foreground whitespace-nowrap">
            {entry.day?.log_date ?? entry.created_at.slice(0, 10)}
          </td>
        )}
        <td>
          <TitleCell entry={entry} onSave={onSave} />
        </td>
        <td>
          <CellInput
            value={entry.topic ?? ""}
            onSave={(v) => onSave({ topic: v || null })}
            placeholder="Arrays"
          />
        </td>
        <td>
          <CellInput
            value={entry.pattern ?? ""}
            onSave={(v) => onSave({ pattern: v || null })}
            placeholder="Two ptr"
          />
        </td>
        <td>
          <CellSelect
            value={entry.difficulty ?? ""}
            options={["", ...DIFFICULTIES]}
            labels={{ "": "—" }}
            onSave={(v) => onSave({ difficulty: (v || null) as any })}
          />
        </td>
        <td>
          <CellNumber
            value={entry.attempts}
            min={1}
            onSave={(v) => onSave({ attempts: v ?? 1 })}
          />
        </td>
        <td>
          <CellNumber
            value={entry.time_taken_min ?? null}
            min={0}
            onSave={(v) => onSave({ time_taken_min: v })}
            placeholder="—"
          />
        </td>
        <td>
          <CellSelect
            value={entry.status}
            options={[...STATUSES]}
            onSave={(v) => onSave({ status: v as any })}
          />
        </td>
        <td>
          <CellNumber
            value={entry.confidence ?? null}
            min={1}
            max={5}
            onSave={(v) => onSave({ confidence: v })}
            placeholder="1-5"
          />
        </td>
        <td>
          <CellInput
            value={entry.time_complexity ?? ""}
            onSave={(v) => onSave({ time_complexity: v || null })}
            placeholder="O(n)"
          />
        </td>
        <td>
          <CellInput
            value={entry.space_complexity ?? ""}
            onSave={(v) => onSave({ space_complexity: v || null })}
            placeholder="O(1)"
          />
        </td>
        <td>
          <CellInput
            value={(entry.companies ?? []).join(", ")}
            onSave={(v) =>
              onSave({
                companies: v
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Google, Meta"
          />
        </td>
        <td>
          <CellInput
            value={(entry.tags ?? []).join(", ")}
            onSave={(v) =>
              onSave({
                tags: v
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="dp, hard"
          />
        </td>
        <td className="text-muted-foreground whitespace-nowrap">
          {entry.mastered_at ? (
            <span className="text-emerald-400 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Mastered
            </span>
          ) : (
            entry.next_revision_at ?? "—"
          )}
        </td>
        <td className="text-center">
          <button
            onClick={onToggleFav}
            className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-card/60"
            aria-label="Favorite"
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                entry.is_favorite
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground",
              )}
            />
          </button>
        </td>
        <td>
          <div className="flex items-center justify-end gap-0.5">
            <ReviseInline
              entry={entry}
              trigger={
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  title="Revise"
                >
                  <RotateCw className="h-3 w-3" />
                </Button>
              }
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onSnooze(1)}>
                  Snooze 1 day
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze(3)}>
                  Snooze 3 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze(7)}>
                  Snooze 1 week
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onMaster}>
                  <CheckCircle2 className="h-3 w-3 mr-2" /> Mark mastered
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-card/20 border-b border-border/30">
          <td colSpan={showDateCol ? 18 : 17} className="px-4 py-3">
            <ExpandedDetails entry={entry} onSave={onSave} />
          </td>
        </tr>
      )}
    </>
  );
}

function ExpandedDetails({
  entry,
  onSave,
}: {
  entry: JournalEntry;
  onSave: (patch: Partial<JournalEntry>) => void;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <LongField
        label="Mistakes"
        value={entry.mistakes ?? ""}
        onSave={(v) => onSave({ mistakes: v || null })}
        placeholder="What went wrong this time?"
      />
      <LongField
        label="Learnings"
        value={entry.learnings ?? ""}
        onSave={(v) => onSave({ learnings: v || null })}
        placeholder="Key insight, pattern, trick…"
      />
      <LongField
        label="Notes"
        value={entry.notes_md ?? ""}
        onSave={(v) => onSave({ notes_md: v || null })}
        placeholder="Markdown notes"
        rows={4}
      />
      <LongField
        label={`Code snippet${entry.language ? ` (${entry.language})` : ""}`}
        value={entry.code_snippet ?? ""}
        onSave={(v) => onSave({ code_snippet: v || null })}
        placeholder="Paste your solution"
        rows={4}
        mono
      />
      <div className="md:col-span-2">
        <div className="text-[11px] text-muted-foreground mb-1">Algorithm</div>
        <CellInput
          value={entry.algorithm ?? ""}
          onSave={(v) => onSave({ algorithm: v || null })}
          placeholder="e.g. Kadane, BFS, DP top-down"
          full
        />
      </div>
    </div>
  );
}

function LongField({
  label,
  value,
  onSave,
  placeholder,
  rows = 3,
  mono = false,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  const [v, setV] = useState(value);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    setV(value);
    setDirty(false);
  }, [value]);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        {dirty && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[11px]"
            onClick={() => {
              onSave(v);
              setDirty(false);
            }}
          >
            <Save className="h-3 w-3 mr-1" /> Save
          </Button>
        )}
      </div>
      <Textarea
        value={v}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => {
          setV(e.target.value);
          setDirty(true);
        }}
        onBlur={() => {
          if (dirty) {
            onSave(v);
            setDirty(false);
          }
        }}
        className={cn("text-xs", mono && "font-mono")}
      />
    </div>
  );
}

// ----------------- Cells -----------------

function CellInput({
  value,
  onSave,
  placeholder,
  full,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  full?: boolean;
}) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <Input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        if (v !== value) onSave(v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setV(value);
      }}
      placeholder={placeholder}
      className={cn(
        "h-7 px-1.5 text-xs bg-transparent border-transparent hover:border-border focus:border-border/80",
        full && "w-full",
      )}
    />
  );
}

function CellNumber({
  value,
  onSave,
  min,
  max,
  placeholder,
}: {
  value: number | null;
  onSave: (v: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  const [v, setV] = useState<string>(value == null ? "" : String(value));
  useEffect(() => setV(value == null ? "" : String(value)), [value]);
  return (
    <Input
      type="number"
      value={v}
      min={min}
      max={max}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        if (v === "") {
          if (value != null) onSave(null);
          return;
        }
        let n = Number(v);
        if (Number.isNaN(n)) return;
        if (min != null) n = Math.max(min, n);
        if (max != null) n = Math.min(max, n);
        if (n !== value) onSave(n);
      }}
      placeholder={placeholder}
      className="h-7 px-1.5 text-xs bg-transparent border-transparent hover:border-border focus:border-border/80 w-full"
    />
  );
}

function CellSelect({
  value,
  options,
  labels,
  onSave,
}: {
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onSave: (v: string) => void;
}) {
  return (
    <Select value={value || "__none__"} onValueChange={(v) => onSave(v === "__none__" ? "" : v)}>
      <SelectTrigger className="h-7 px-1.5 text-xs bg-transparent border-transparent hover:border-border">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o || "__none__"} value={o || "__none__"} className="text-xs capitalize">
            {labels?.[o] ?? (o || "—")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TitleCell({
  entry,
  onSave,
}: {
  entry: JournalEntry;
  onSave: (patch: Partial<JournalEntry>) => void;
}) {
  const primary = entry.links?.[0];
  const extras = (entry.links ?? []).slice(1);
  return (
    <div className="flex items-center gap-1 min-w-0">
      <CellInput
        value={entry.title}
        onSave={(v) => v && v !== entry.title && onSave({ title: v })}
        full
      />
      {primary?.url && (
        <a
          href={primary.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-muted-foreground hover:text-primary"
          title={primary.url}
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
      {extras.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="shrink-0 text-[10px] px-1.5 h-5 rounded bg-card/60 border border-border/40 text-muted-foreground hover:text-foreground">
              +{extras.length}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 text-xs">
            <div className="font-semibold text-[11px] text-muted-foreground mb-1">
              More links
            </div>
            <ul className="space-y-1">
              {extras.map((l, i) => (
                <li key={i}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate block"
                  >
                    {l.label || l.url}
                  </a>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

// ----------------- Draft (add) row -----------------

function DraftRow({
  dayId,
  showDateCol,
}: {
  dayId: string;
  showDateCol: boolean;
}) {
  const create = useCreateEntry();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [pattern, setPattern] = useState("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [attempts, setAttempts] = useState<string>("1");
  const [time, setTime] = useState<string>("");
  const titleRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setUrl("");
    setTopic("");
    setPattern("");
    setDifficulty("");
    setAttempts("1");
    setTime("");
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  const save = async () => {
    const finalTitle = title.trim() || (url ? inferTitleFromUrl(url) : "");
    if (!finalTitle) {
      toast.error("Title is required");
      return;
    }
    const links = url ? [{ label: detectSource(url) ?? "link", url }] : [];
    await create.mutateAsync({
      day_id: dayId,
      title: finalTitle,
      links,
      topic: topic || null,
      pattern: pattern || null,
      difficulty: (difficulty || null) as any,
      attempts: Math.max(1, Number(attempts) || 1),
      time_taken_min: time === "" ? null : Math.max(0, Number(time)),
      source: detectSource(url) ?? null,
    });
    reset();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    }
  };

  return (
    <tr className="bg-primary/[0.03] border-t-2 border-dashed border-border/40 [&>td]:px-2 [&>td]:py-1.5">
      <td className="text-muted-foreground">
        <Plus className="h-3 w-3" />
      </td>
      <td className="text-muted-foreground">+</td>
      {showDateCol && <td className="text-muted-foreground text-[10px]">today</td>}
      <td>
        <div className="flex gap-1">
          <Input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={onKey}
            placeholder="Problem title…"
            className="h-7 px-1.5 text-xs"
          />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={onKey}
            onBlur={() => {
              if (url && !title) setTitle(inferTitleFromUrl(url));
            }}
            placeholder="Paste link"
            className="h-7 px-1.5 text-xs w-32"
          />
        </div>
      </td>
      <td>
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={onKey}
          placeholder="Topic"
          className="h-7 px-1.5 text-xs"
        />
      </td>
      <td>
        <Input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          onKeyDown={onKey}
          placeholder="Pattern"
          className="h-7 px-1.5 text-xs"
        />
      </td>
      <td>
        <Select value={difficulty || "__none__"} onValueChange={(v) => setDifficulty(v === "__none__" ? "" : v)}>
          <SelectTrigger className="h-7 px-1.5 text-xs">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__" className="text-xs">—</SelectItem>
            {DIFFICULTIES.map((d) => (
              <SelectItem key={d} value={d} className="text-xs">
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td>
        <Input
          type="number"
          min={1}
          value={attempts}
          onChange={(e) => setAttempts(e.target.value)}
          onKeyDown={onKey}
          className="h-7 px-1.5 text-xs"
        />
      </td>
      <td>
        <Input
          type="number"
          min={0}
          value={time}
          onChange={(e) => setTime(e.target.value)}
          onKeyDown={onKey}
          placeholder="min"
          className="h-7 px-1.5 text-xs"
        />
      </td>
      <td colSpan={8} className="text-[10px] text-muted-foreground">
        Press Enter to save · expand row after to add notes, code & companies
      </td>
      <td colSpan={2} className="text-right">
        <Button
          size="sm"
          onClick={save}
          disabled={create.isPending}
          className="h-7 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </td>
    </tr>
  );
}
