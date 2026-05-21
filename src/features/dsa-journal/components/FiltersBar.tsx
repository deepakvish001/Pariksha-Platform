import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import type { EntryWithDay } from "../types";
import { useMemo } from "react";

export interface FilterState {
  q: string;
  topic: string;
  pattern: string;
  difficulty: string;
  status: string;
  source: string;
  favoritesOnly: boolean;
  masteredOnly: boolean;
  sort: "newest" | "oldest" | "hardest" | "most-attempts" | "due-soon";
}

export const defaultFilters: FilterState = {
  q: "",
  topic: "",
  pattern: "",
  difficulty: "",
  status: "",
  source: "",
  favoritesOnly: false,
  masteredOnly: false,
  sort: "newest",
};

interface Props {
  value: FilterState;
  onChange: (next: FilterState) => void;
  entries: EntryWithDay[];
}

const ALL = "__all__";

export function FiltersBar({ value, onChange, entries }: Props) {
  const { topics, patterns, sources } = useMemo(() => {
    const t = new Set<string>();
    const p = new Set<string>();
    const s = new Set<string>();
    for (const e of entries) {
      if (e.topic) t.add(e.topic);
      if (e.pattern) p.add(e.pattern);
      if (e.source) s.add(e.source);
    }
    return {
      topics: [...t].sort(),
      patterns: [...p].sort(),
      sources: [...s].sort(),
    };
  }, [entries]);

  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });
  const active =
    value.q ||
    value.topic ||
    value.pattern ||
    value.difficulty ||
    value.status ||
    value.source ||
    value.favoritesOnly ||
    value.masteredOnly;

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search title, tag, note..."
            value={value.q}
            onChange={(e) => set({ q: e.target.value })}
            className="pl-8 h-9"
          />
        </div>
        <Select value={value.sort} onValueChange={(v) => set({ sort: v as any })}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="hardest">Hardest first</SelectItem>
            <SelectItem value="most-attempts">Most attempts</SelectItem>
            <SelectItem value="due-soon">Due soonest</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Mini label="Topic" value={value.topic} options={topics} onChange={(v) => set({ topic: v })} />
        <Mini label="Pattern" value={value.pattern} options={patterns} onChange={(v) => set({ pattern: v })} />
        <Mini
          label="Difficulty"
          value={value.difficulty}
          options={["Easy", "Medium", "Hard"]}
          onChange={(v) => set({ difficulty: v })}
        />
        <Mini
          label="Status"
          value={value.status}
          options={["solved", "partial", "stuck"]}
          onChange={(v) => set({ status: v })}
        />
        <Mini label="Source" value={value.source} options={sources} onChange={(v) => set({ source: v })} />
        <Toggle
          label="★ Favorites"
          on={value.favoritesOnly}
          onClick={() => set({ favoritesOnly: !value.favoritesOnly })}
        />
        <Toggle
          label="✓ Mastered"
          on={value.masteredOnly}
          onClick={() => set({ masteredOnly: !value.masteredOnly })}
        />
        {active && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => onChange(defaultFilters)}
          >
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
      <SelectTrigger className="h-7 text-xs w-auto min-w-[110px]">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label.toLowerCase()}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "h-7 px-2.5 rounded-md text-xs border transition " +
        (on
          ? "bg-primary/15 border-primary/40 text-primary"
          : "bg-card/40 border-border/40 text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </button>
  );
}

export function applyFilters(
  entries: EntryWithDay[],
  f: FilterState,
): EntryWithDay[] {
  const q = f.q.trim().toLowerCase();
  const diffOrder: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
  const filtered = entries.filter((e) => {
    if (f.favoritesOnly && !e.is_favorite) return false;
    if (f.masteredOnly && !e.mastered_at) return false;
    if (f.topic && e.topic !== f.topic) return false;
    if (f.pattern && e.pattern !== f.pattern) return false;
    if (f.difficulty && e.difficulty !== f.difficulty) return false;
    if (f.status && e.status !== f.status) return false;
    if (f.source && e.source !== f.source) return false;
    if (q) {
      const hay = [
        e.title,
        e.topic,
        e.pattern,
        e.algorithm,
        e.notes_md,
        e.mistakes,
        e.learnings,
        (e.tags ?? []).join(" "),
        (e.companies ?? []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  filtered.sort((a, b) => {
    switch (f.sort) {
      case "oldest":
        return a.created_at.localeCompare(b.created_at);
      case "hardest":
        return (diffOrder[b.difficulty ?? ""] ?? 0) - (diffOrder[a.difficulty ?? ""] ?? 0);
      case "most-attempts":
        return b.attempts - a.attempts;
      case "due-soon":
        return (a.next_revision_at ?? "9999").localeCompare(b.next_revision_at ?? "9999");
      default:
        return b.created_at.localeCompare(a.created_at);
    }
  });
  return filtered;
}
