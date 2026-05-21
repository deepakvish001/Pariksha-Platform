import { useMemo, useState } from "react";
import { Plus, Sunrise, Sun, Sunset, Moon, Sparkles, X, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "../types";

export interface SessionGroup {
  label: string;
  entries: JournalEntry[];
  startISO: string | null;
  endISO: string | null;
  totalMin: number;
  solved: number;
}

interface Props {
  /** Entries for the selected date. */
  entries: JournalEntry[];
  activeLabel: string | null;
  onChangeActive: (label: string | null) => void;
  /** Whether a live timer is running for the active session. */
  timerStartedAt: string | null;
  onStartTimer: () => void;
  onStopTimer: () => void;
}

const PRESETS = [
  { label: "Morning", icon: Sunrise, accent: "text-amber-300" },
  { label: "Afternoon", icon: Sun, accent: "text-orange-300" },
  { label: "Evening", icon: Sunset, accent: "text-rose-300" },
  { label: "Night", icon: Moon, accent: "text-violet-300" },
];

const iconFor = (label: string) => {
  const p = PRESETS.find((p) => p.label.toLowerCase() === label.toLowerCase());
  return p ? p.icon : Sparkles;
};
const accentFor = (label: string) => {
  const p = PRESETS.find((p) => p.label.toLowerCase() === label.toLowerCase());
  return p ? p.accent : "text-sky-300";
};

const fmtTime = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export function groupBySession(entries: JournalEntry[]): SessionGroup[] {
  const m = new Map<string, SessionGroup>();
  for (const e of entries) {
    const label = e.session_label?.trim() || "Unsorted";
    if (!m.has(label)) {
      m.set(label, {
        label,
        entries: [],
        startISO: null,
        endISO: null,
        totalMin: 0,
        solved: 0,
      });
    }
    const g = m.get(label)!;
    g.entries.push(e);
    if (e.started_at) {
      if (!g.startISO || e.started_at < g.startISO) g.startISO = e.started_at;
    }
    if (e.ended_at) {
      if (!g.endISO || e.ended_at > g.endISO) g.endISO = e.ended_at;
    }
    g.totalMin += e.time_taken_min ?? 0;
    if (e.solved_clean || e.status === "solved") g.solved += 1;
  }
  const list = [...m.values()];
  list.sort((a, b) => (a.startISO ?? "9").localeCompare(b.startISO ?? "9"));
  return list;
}

export default function SessionBar({
  entries,
  activeLabel,
  onChangeActive,
  timerStartedAt,
  onStartTimer,
  onStopTimer,
}: Props) {
  const groups = useMemo(() => groupBySession(entries), [entries]);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState("");

  const visibleLabels = new Set(groups.map((g) => g.label));
  // Always include the active label so it shows up as a chip even with 0 entries
  const allChips: { label: string; group?: SessionGroup }[] = [];
  groups.forEach((g) => allChips.push({ label: g.label, group: g }));
  if (activeLabel && !visibleLabels.has(activeLabel)) {
    allChips.push({ label: activeLabel });
  }

  const pickPreset = (label: string) => {
    onChangeActive(label);
  };

  const elapsed = timerStartedAt
    ? Math.max(0, Math.round((Date.now() - new Date(timerStartedAt).getTime()) / 60000))
    : 0;

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Sessions
        </div>
        <div className="flex items-center gap-1.5">
          {timerStartedAt ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-emerald-500/40 text-emerald-300"
              onClick={onStopTimer}
            >
              <Square className="h-3 w-3 mr-1 fill-current" /> Stop · {elapsed}m
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={onStartTimer}
              disabled={!activeLabel}
              title={!activeLabel ? "Pick a session first" : "Start session timer"}
            >
              <Play className="h-3 w-3 mr-1" /> Start timer
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {allChips.map(({ label, group }) => {
          const Icon = iconFor(label);
          const active = activeLabel === label;
          return (
            <button
              key={label}
              onClick={() => onChangeActive(active ? null : label)}
              className={cn(
                "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition",
                active
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border/40 bg-card/40 text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : accentFor(label))} />
              <span className="font-medium">{label}</span>
              {group && (
                <span className="text-[10px] opacity-80">
                  {group.startISO ? fmtTime(group.startISO) : "—"}
                  {group.endISO ? `–${fmtTime(group.endISO)}` : ""} ·{" "}
                  {group.entries.length} · {group.totalMin}m
                </span>
              )}
            </button>
          );
        })}

        {PRESETS.filter(
          (p) => !allChips.some((c) => c.label.toLowerCase() === p.label.toLowerCase()),
        ).map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.label}
              onClick={() => pickPreset(p.label)}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-dashed border-border/40 bg-card/20 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Icon className={cn("h-3.5 w-3.5", p.accent)} />
              {p.label}
            </button>
          );
        })}

        <Popover open={customOpen} onOpenChange={setCustomOpen}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border/40 bg-card/40 text-[11px] text-muted-foreground hover:text-foreground">
              <Plus className="h-3 w-3" /> Custom
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-2 space-y-2">
            <div className="text-[11px] text-muted-foreground">Name this session</div>
            <Input
              autoFocus
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="e.g. Library, Deep work"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && custom.trim()) {
                  onChangeActive(custom.trim());
                  setCustom("");
                  setCustomOpen(false);
                }
              }}
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                className="h-7 text-xs flex-1"
                disabled={!custom.trim()}
                onClick={() => {
                  onChangeActive(custom.trim());
                  setCustom("");
                  setCustomOpen(false);
                }}
              >
                Use
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {activeLabel && (
          <button
            onClick={() => onChangeActive(null)}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {activeLabel && (
        <div className="text-[11px] text-muted-foreground">
          New entries will be tagged{" "}
          <span className="text-foreground font-medium">{activeLabel}</span>
          {timerStartedAt && (
            <>
              {" "}
              and stamped from{" "}
              <span className="text-foreground font-medium">{fmtTime(timerStartedAt)}</span>
            </>
          )}
          .
        </div>
      )}
    </div>
  );
}
