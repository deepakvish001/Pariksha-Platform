import { useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaletteItem {
  id: string;
  answered: boolean;
  flagged: boolean;
  visited?: boolean;
}

interface PaletteSection {
  title: string;
  /** Global indices (into the flat questions array) that belong to this section. */
  indices: number[];
}

interface Props {
  items: PaletteItem[];
  currentIndex: number;
  onJump: (idx: number) => void;
  variant?: "rail" | "compact";
  sections?: PaletteSection[];
}

type Filter = "all" | "unanswered" | "flagged";

export function QuestionPalette({
  items,
  currentIndex,
  onJump,
  variant = "rail",
  sections,
}: Props) {
  const answered = items.filter((i) => i.answered).length;
  const flagged = items.filter((i) => i.flagged).length;
  const unanswered = items.length - answered;
  const compact = variant === "compact";

  const [filter, setFilter] = useState<Filter>("all");

  const passes = (i: number) => {
    const it = items[i];
    if (!it) return false;
    if (filter === "unanswered") return !it.answered;
    if (filter === "flagged") return it.flagged;
    return true;
  };

  const effectiveSections = useMemo<PaletteSection[]>(() => {
    if (sections && sections.length > 0) return sections;
    return [{ title: "", indices: items.map((_, i) => i) }];
  }, [sections, items]);

  const renderChip = (i: number) => {
    const it = items[i];
    if (!it) return null;
    const active = i === currentIndex;
    const dim = !passes(i);
    return (
      <button
        key={it.id}
        onClick={() => onJump(i)}
        title={`Question ${i + 1}${it.answered ? " · answered" : it.visited ? " · visited" : ""}${
          it.flagged ? " · flagged" : ""
        }`}
        aria-current={active ? "true" : undefined}
        className={cn(
          "relative rounded-md border text-xs font-semibold transition-all tabular-nums grid place-items-center",
          compact ? "h-8" : "h-9",
          dim && "opacity-30 hover:opacity-100",
          active
            ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/30"
            : it.answered
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
            : it.visited
            ? "border-dashed border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
            : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        {i + 1}
        {it.flagged && (
          <Flag
            className={cn(
              "absolute -top-1 -right-1 h-3 w-3 fill-amber-500 text-amber-500 drop-shadow",
              active && "fill-amber-300 text-amber-300"
            )}
          />
        )}
      </button>
    );
  };

  const grid = (
    <div className="space-y-3">
      {effectiveSections.map((sec, sIdx) => (
        <div key={sIdx} className="space-y-1.5">
          {sec.title && (
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold">
              <span className="truncate">{sec.title}</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          )}
          <div className={cn("grid gap-1.5", compact ? "grid-cols-10" : "grid-cols-5 lg:grid-cols-6")}>
            {sec.indices.map(renderChip)}
          </div>
        </div>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className="rounded-lg border border-border bg-card p-2.5">
        <div className="flex items-center justify-between mb-2 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Questions</span>
          <span className="tabular-nums">
            {answered}/{items.length}
          </span>
        </div>
        {grid}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-3 shadow-sm">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold">Question palette</span>
        <span className="text-muted-foreground tabular-nums">
          {answered}/{items.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <StatPill label="Done" value={answered} tone="emerald" />
        <StatPill label="Left" value={unanswered} tone={unanswered > 0 ? "amber" : "muted"} />
        <StatPill label="Flag" value={flagged} tone={flagged > 0 ? "amber" : "muted"} />
      </div>

      {/* Filter row */}
      <div className="grid grid-cols-3 gap-1 p-0.5 rounded-md bg-muted/40 border border-border text-[11px] font-medium">
        {(["all", "unanswered", "flagged"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded px-1.5 py-1 capitalize transition-colors",
              filter === f
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {grid}

      <div className="pt-2.5 border-t border-border space-y-1.5 text-[11px] text-muted-foreground">
        <LegendRow swatch="bg-primary" label="Current" />
        <LegendRow swatch="border-emerald-500/50 bg-emerald-500/10 border" label="Answered" />
        <LegendRow swatch="border-dashed border-border bg-muted/30 border" label="Visited / blank" />
        <LegendRow swatch="border-border bg-muted/40 border" label="Not visited" />
        <div className="flex items-center gap-2">
          <Flag className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
          <span>Flagged for review</span>
        </div>
      </div>
    </div>
  );
}

function LegendRow({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-sm", swatch)} />
      <span>{label}</span>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "muted";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : tone === "amber"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-border bg-muted/40 text-muted-foreground";
  return (
    <div className={cn("rounded-md border px-1.5 py-1 text-center", toneClass)}>
      <div className="text-sm font-bold tabular-nums leading-none">{value}</div>
      <div className="text-[9px] uppercase tracking-wide mt-1 opacity-80">{label}</div>
    </div>
  );
}
