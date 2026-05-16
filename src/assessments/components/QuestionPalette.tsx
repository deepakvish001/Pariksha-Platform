import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaletteItem {
  id: string;
  answered: boolean;
  flagged: boolean;
  visited?: boolean;
}

interface Props {
  items: PaletteItem[];
  currentIndex: number;
  onJump: (idx: number) => void;
  variant?: "rail" | "compact";
}

export function QuestionPalette({ items, currentIndex, onJump, variant = "rail" }: Props) {
  const answered = items.filter((i) => i.answered).length;
  const flagged = items.filter((i) => i.flagged).length;
  const unanswered = items.length - answered;
  const compact = variant === "compact";

  const grid = (
    <div className={cn("grid gap-1.5", compact ? "grid-cols-10" : "grid-cols-5 lg:grid-cols-6")}>
      {items.map((it, i) => {
        const active = i === currentIndex;
        return (
          <button
            key={it.id}
            onClick={() => onJump(i)}
            title={`Question ${i + 1}${it.answered ? " · answered" : it.visited ? " · visited" : ""}${
              it.flagged ? " · flagged" : ""
            }`}
            className={cn(
              "relative rounded-md border text-xs font-semibold transition-all tabular-nums grid place-items-center",
              compact ? "h-8" : "h-10",
              active
                ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/30 scale-[1.04]"
                : it.answered
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/70"
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
      })}
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
      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Question palette</span>
          <span className="text-muted-foreground tabular-nums">
            {answered}/{items.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <StatPill label="Done" value={answered} tone="emerald" />
        <StatPill label="Left" value={unanswered} tone={unanswered > 0 ? "amber" : "muted"} />
        <StatPill label="Flag" value={flagged} tone={flagged > 0 ? "amber" : "muted"} />
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
