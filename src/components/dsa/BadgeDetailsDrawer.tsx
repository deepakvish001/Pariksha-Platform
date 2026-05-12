import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Trophy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMMON_PATTERNS, PATTERN_TOTAL, type CommonPattern } from "@/data/dsaCommonPatternsData";
import { TIERS, type TierLabel } from "@/hooks/useDsaPatternAchievements";
import type { PatternHistoryEntry } from "@/hooks/useDsaPatternHistory";

export interface BadgeDrawerTarget {
  /** "overall" or category id */
  scope: string;
  /** Highest tier currently held; null = none */
  tier: TierLabel | null;
}

interface Props {
  target: BadgeDrawerTarget | null;
  onClose: () => void;
  done: Set<string>;
  history: PatternHistoryEntry[];
  onOpenPattern: (p: CommonPattern) => void;
}

const tierStyles: Record<TierLabel, string> = {
  Bronze: "border-amber-700/50 bg-amber-700/15 text-amber-300",
  Silver: "border-zinc-400/50 bg-zinc-400/15 text-zinc-200",
  Gold: "border-yellow-500/60 bg-yellow-500/20 text-yellow-300",
};

export default function BadgeDetailsDrawer({ target, onClose, done, history, onOpenPattern }: Props) {
  const open = target !== null;

  const data = useMemo(() => {
    if (!target) return null;
    const isOverall = target.scope === "overall";
    const cats = isOverall ? COMMON_PATTERNS : COMMON_PATTERNS.filter((c) => c.id === target.scope);
    const allPatterns = cats.flatMap((c) =>
      c.patterns.map((p) => ({ ...p, _categoryId: c.id, _categoryTitle: c.title, _categoryEmoji: c.emoji })),
    );
    const total = isOverall ? PATTERN_TOTAL : cats.reduce((n, c) => n + c.patterns.length, 0);
    const donePatterns = allPatterns.filter((p) => done.has(p.id));

    // Most-recent completion timestamp per pattern from history
    const lastTs = new Map<string, string>();
    history.forEach((h) => {
      lastTs.set(h.id, h.ts);
    });
    donePatterns.sort((a, b) => (lastTs.get(b.id) || "").localeCompare(lastTs.get(a.id) || ""));

    const pct = total > 0 ? (donePatterns.length / total) * 100 : 0;
    return {
      isOverall,
      cats,
      total,
      donePatterns,
      pct,
      lastTs,
    };
  }, [target, done, history]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {target && data && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                {data.isOverall ? "Grand Master" : data.cats[0]?.title}
                {target.tier && (
                  <Badge variant="outline" className={cn("text-[10px] h-5", tierStyles[target.tier])}>
                    {target.tier}
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription>
                {data.isOverall
                  ? "Patterns counted toward your overall mastery."
                  : "Patterns that contributed to this category's milestone."}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-4">
              {/* Tier ladder */}
              <div className="rounded-lg border border-border/40 bg-card/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-mono">
                    {data.donePatterns.length}/{data.total} • {Math.round(data.pct)}%
                  </span>
                </div>
                <Progress value={data.pct} className="h-2 bg-muted/40" />
                <div className="flex gap-2 pt-1">
                  {TIERS.map((t) => {
                    const reached = data.pct >= t.pct;
                    return (
                      <div
                        key={t.label}
                        className={cn(
                          "flex-1 rounded-md border px-2 py-1.5 text-center text-[11px] font-medium",
                          reached ? tierStyles[t.label] : "border-border/40 bg-card/40 text-muted-foreground",
                        )}
                      >
                        {t.label} • {t.pct}%
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pattern list */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Unlocked patterns ({data.donePatterns.length})
                </h4>
                {data.donePatterns.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/40 bg-card/20 p-6 text-center text-sm text-muted-foreground">
                    Mark patterns as done to start earning this badge.
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {data.donePatterns.map((p) => {
                      const ts = data.lastTs.get(p.id);
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => {
                              onOpenPattern(p);
                              onClose();
                            }}
                            className="w-full flex items-center gap-3 rounded-lg border border-border/40 bg-card/40 hover:border-emerald-500/40 hover:bg-card/60 px-3 py-2 text-left transition-colors"
                          >
                            <span className="text-lg shrink-0" aria-hidden>
                              {p.emoji}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                <span className="truncate">{p.title}</span>
                              </div>
                              {data.isOverall && (
                                <div className="text-[11px] text-muted-foreground truncate">
                                  {p._categoryEmoji} {p._categoryTitle}
                                </div>
                              )}
                              {ts && (
                                <div className="text-[10px] text-muted-foreground">
                                  Completed {new Date(ts).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
