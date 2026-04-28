import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  hints: string[];
  /** Optional slug — when provided, revealed-progress persists across reloads. */
  slug?: string;
}

const KEY = "byteskill:coding-hints-revealed:v1";

const readMap = (): Record<string, number> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
};

const writeMap = (map: Record<string, number>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
};

/**
 * Progressive hint disclosure — hints stay locked until the user explicitly
 * reveals them, one by one. When `slug` is provided the revealed count is
 * persisted to localStorage so it restores on reload.
 */
export const ProgressiveHints = ({ hints, slug }: Props) => {
  const [revealed, setRevealed] = useState<number>(() => {
    if (!slug) return 0;
    const v = readMap()[slug] ?? 0;
    return Math.min(hints.length, Math.max(0, v));
  });

  // Reload from storage when slug changes (navigation between problems).
  useEffect(() => {
    if (!slug) {
      setRevealed(0);
      return;
    }
    const v = readMap()[slug] ?? 0;
    setRevealed(Math.min(hints.length, Math.max(0, v)));
  }, [slug, hints.length]);

  // Persist whenever revealed count changes.
  useEffect(() => {
    if (!slug) return;
    const map = readMap();
    if (revealed > 0) map[slug] = revealed;
    else delete map[slug];
    writeMap(map);
  }, [slug, revealed]);

  if (hints.length === 0) return null;

  const pct = Math.round((revealed / hints.length) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-sm">Hints</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {revealed} / {hints.length} revealed
          </span>
          {revealed < hints.length && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevealed(hints.length)}
              className="h-6 px-2 text-xs"
            >
              Reveal all
            </Button>
          )}
          {revealed > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevealed(0)}
              className="h-6 px-2 text-xs text-muted-foreground"
            >
              Hide all
            </Button>
          )}
        </div>
      </div>

      <div
        className="h-1 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Hints revealed"
      >
        <div
          className="h-full bg-amber-500/70 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
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
