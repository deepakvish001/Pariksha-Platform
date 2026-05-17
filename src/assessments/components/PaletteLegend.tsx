import { CheckCircle2, Circle, CircleDot, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** Visual variant — `card` shows a bordered panel with header; `inline` is borderless for embedding. */
  variant?: "card" | "inline";
  className?: string;
  /** Optional title override. */
  title?: string;
}

interface LegendItem {
  swatch: React.ReactNode;
  label: string;
  hint: string;
}

const ITEMS: LegendItem[] = [
  {
    swatch: (
      <span className="h-6 w-6 grid place-items-center rounded-md border border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold tabular-nums">
        7
      </span>
    ),
    label: "Answered",
    hint: "You've saved an answer for this question.",
  },
  {
    swatch: (
      <span className="h-6 w-6 grid place-items-center rounded-md border-2 border-primary bg-primary text-primary-foreground text-[10px] font-bold tabular-nums shadow-sm">
        3
      </span>
    ),
    label: "Current",
    hint: "The question you're viewing right now.",
  },
  {
    swatch: (
      <span className="h-6 w-6 grid place-items-center rounded-md border border-dashed border-border bg-muted/30 text-muted-foreground text-[10px] font-bold tabular-nums">
        5
      </span>
    ),
    label: "Visited",
    hint: "Opened but not answered yet — come back to it.",
  },
  {
    swatch: (
      <span className="h-6 w-6 grid place-items-center rounded-md border border-border bg-muted/40 text-muted-foreground text-[10px] font-bold tabular-nums">
        9
      </span>
    ),
    label: "Not visited",
    hint: "You haven't opened this question yet.",
  },
  {
    swatch: (
      <span className="relative h-6 w-6 grid place-items-center rounded-md border border-border bg-muted/40 text-muted-foreground text-[10px] font-bold tabular-nums">
        2
        <Flag className="absolute -top-1 -right-1 h-3 w-3 fill-amber-500 text-amber-500" />
      </span>
    ),
    label: "Flagged",
    hint: "Marked for review — visible in the Flagged filter.",
  },
];

export function PaletteLegend({ variant = "card", className, title = "Palette color key" }: Props) {
  const isCard = variant === "card";
  return (
    <div
      className={cn(
        isCard && "rounded-lg border border-border bg-card/60 p-4",
        className
      )}
    >
      {isCard && (
        <div className="mb-3 flex items-center gap-2">
          <span className="h-7 w-7 rounded-md bg-primary/10 grid place-items-center text-primary">
            <CircleDot className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">{title}</div>
            <div className="text-[11px] text-muted-foreground">
              What each color means in the question navigator
            </div>
          </div>
        </div>
      )}
      <ul className="grid gap-2 sm:grid-cols-2">
        {ITEMS.map((it) => (
          <li
            key={it.label}
            className="flex items-start gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2"
          >
            <div className="shrink-0 pt-0.5">{it.swatch}</div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground leading-tight">
                {it.label}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {it.hint}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground border-t border-border/60 pt-2.5">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          Saved automatically
        </span>
        <span className="flex items-center gap-1.5">
          <Circle className="h-3 w-3 text-muted-foreground/60" />
          Tap any number to jump
        </span>
        <span className="flex items-center gap-1.5">
          <Flag className="h-3 w-3 fill-amber-500 text-amber-500" />
          Press <kbd className="px-1 rounded border border-border bg-muted text-[10px] font-mono">F</kbd> to flag
        </span>
      </div>
    </div>
  );
}
