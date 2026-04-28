import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SmartChip {
  key: string;
  label: string;
  count?: number;
  active: boolean;
  tone?: "default" | "primary" | "amber" | "emerald" | "rose";
  onClick: () => void;
}

interface Props {
  chips: SmartChip[];
  activeCount: number;
  onClearAll?: () => void;
  className?: string;
}

const toneClass = (tone: SmartChip["tone"], active: boolean): string => {
  if (!active) return "bg-muted/40 text-muted-foreground hover:bg-muted/70 border-transparent";
  switch (tone) {
    case "primary":
      return "bg-primary/15 text-primary border-primary/30";
    case "amber":
      return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    case "emerald":
      return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
    case "rose":
      return "bg-rose-500/15 text-rose-500 border-rose-500/30";
    default:
      return "bg-foreground/10 text-foreground border-border";
  }
};

/**
 * Horizontally scrollable, multi-select chip rail that compounds with the
 * existing filter bar. Each chip simply toggles the same underlying filter
 * state (difficulty, status, topic, etc) so chips never replace the bar —
 * they just give a one-tap shortcut.
 */
export const SmartFilterChips = ({ chips, activeCount, onClearAll, className }: Props) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]",
        className,
      )}
      role="toolbar"
      aria-label="Smart filter chips"
    >
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClick}
          aria-pressed={chip.active}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
            toneClass(chip.tone, chip.active),
          )}
        >
          <span>{chip.label}</span>
          {typeof chip.count === "number" && (
            <Badge
              variant="outline"
              className="h-4 min-w-[18px] justify-center border-current/30 bg-background/60 px-1 text-[10px] tabular-nums"
            >
              {chip.count}
            </Badge>
          )}
        </button>
      ))}

      {activeCount > 0 && onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="shrink-0 h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Clear chips
        </Button>
      )}
    </div>
  );
};
