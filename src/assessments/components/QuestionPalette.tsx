import { CheckCircle2, Flag, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaletteItem {
  id: string;
  answered: boolean;
  flagged: boolean;
}

interface Props {
  items: PaletteItem[];
  currentIndex: number;
  onJump: (idx: number) => void;
}

export function QuestionPalette({ items, currentIndex, onJump }: Props) {
  const answered = items.filter((i) => i.answered).length;
  const flagged = items.filter((i) => i.flagged).length;
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 space-y-3">
      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Questions</span>
          <span className="text-muted-foreground tabular-nums">
            {answered}/{items.length}
          </span>
        </div>
        {flagged > 0 && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
            <Flag className="h-3 w-3" /> {flagged} flagged for review
          </div>
        )}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {items.map((it, i) => {
          const active = i === currentIndex;
          return (
            <button
              key={it.id}
              onClick={() => onJump(i)}
              title={`Question ${i + 1}${it.answered ? " · answered" : ""}${it.flagged ? " · flagged" : ""}`}
              className={cn(
                "relative h-9 rounded-md border text-xs font-medium transition-all tabular-nums",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.05]"
                  : it.answered
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 text-muted-foreground hover:bg-[hsl(var(--muted))]"
              )}
            >
              {i + 1}
              {it.flagged && (
                <Flag
                  className={cn(
                    "absolute -top-1 -right-1 h-3 w-3 fill-amber-500 text-amber-500",
                    active && "fill-white text-white"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="pt-2 border-t border-[hsl(var(--border))] space-y-1.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-emerald-500/40 bg-emerald-500/10" />
          Answered
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40" />
          Not visited / blank
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
          Current
        </div>
        <div className="flex items-center gap-1.5">
          <Flag className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
          Flagged for review
        </div>
      </div>
    </div>
  );
}

export { CheckCircle2, Circle };
