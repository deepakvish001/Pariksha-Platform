import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  hints: string[];
}

/**
 * Progressive hint disclosure — hints stay locked until the user explicitly
 * reveals them, one by one. Encourages independent problem-solving while still
 * making help available.
 */
export const ProgressiveHints = ({ hints }: Props) => {
  const [revealed, setRevealed] = useState<number>(0);

  if (hints.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Hints</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {revealed} / {hints.length} revealed
        </span>
      </div>

      <div className="space-y-2">
        {hints.map((h, i) => {
          const isOpen = i < revealed;
          return (
            <div
              key={i}
              className={cn(
                "rounded-md border p-3 text-sm transition-colors",
                isOpen ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/30",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {isOpen ? (
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="font-medium text-xs">Hint {i + 1}</span>
              </div>
              {isOpen ? (
                <p className="text-muted-foreground leading-relaxed">{h}</p>
              ) : (
                <p className="text-muted-foreground/70 italic text-xs">
                  Locked — reveal previous hints to continue.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {revealed < hints.length && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRevealed((r) => Math.min(hints.length, r + 1))}
          className="gap-1.5"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          Reveal hint {revealed + 1}
        </Button>
      )}

      {revealed > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRevealed(0)}
          className="text-xs text-muted-foreground"
        >
          Hide all hints
        </Button>
      )}
    </div>
  );
};
