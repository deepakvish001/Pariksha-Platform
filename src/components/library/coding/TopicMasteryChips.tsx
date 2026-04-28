import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CODING_PROBLEMS } from "@/data/codingProblemsData";
import type { CodingAttemptStats } from "@/hooks/useCodingAttemptStats";

interface Props {
  topics: string[];
  selectedTopics: string[];
  onToggle: (topic: string) => void;
  onShowOnlyWeak?: (weakTopics: string[]) => void;
  stats: CodingAttemptStats;
}

interface TopicMastery {
  topic: string;
  solved: number;
  total: number;
  ratio: number;
}

const masteryColor = (ratio: number) => {
  if (ratio >= 0.8) return "border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10";
  if (ratio >= 0.4) return "border-amber-500/40 text-amber-500 hover:bg-amber-500/10";
  if (ratio > 0) return "border-rose-500/40 text-rose-500 hover:bg-rose-500/10";
  return "border-border text-muted-foreground hover:bg-muted/40";
};

const selectedColor = (ratio: number) => {
  if (ratio >= 0.8) return "bg-emerald-500/15 border-emerald-500/60 text-emerald-500";
  if (ratio >= 0.4) return "bg-amber-500/15 border-amber-500/60 text-amber-500";
  if (ratio > 0) return "bg-rose-500/15 border-rose-500/60 text-rose-500";
  return "bg-primary/15 border-primary/50 text-primary";
};

const COLLAPSED_COUNT = 12;

export const TopicMasteryChips = ({
  topics,
  selectedTopics,
  onToggle,
  onShowOnlyWeak,
  stats,
}: Props) => {
  const [expanded, setExpanded] = useState(false);

  const items = useMemo<TopicMastery[]>(() => {
    const totals = new Map<string, { solved: number; total: number }>();
    for (const p of CODING_PROBLEMS) {
      for (const t of p.topics) {
        const cur = totals.get(t) ?? { solved: 0, total: 0 };
        cur.total += 1;
        if (stats.solved.has(p.slug)) cur.solved += 1;
        totals.set(t, cur);
      }
    }
    return topics
      .map((t) => {
        const c = totals.get(t) ?? { solved: 0, total: 0 };
        return {
          topic: t,
          solved: c.solved,
          total: c.total,
          ratio: c.total > 0 ? c.solved / c.total : 0,
        };
      })
      .sort((a, b) => {
        // Pinned: selected first, then weakest with attempts, then alphabetical.
        const aSel = selectedTopics.includes(a.topic) ? 0 : 1;
        const bSel = selectedTopics.includes(b.topic) ? 0 : 1;
        if (aSel !== bSel) return aSel - bSel;
        return a.topic.localeCompare(b.topic);
      });
  }, [topics, selectedTopics, stats.solved]);

  const weakTopics = useMemo(
    () =>
      items
        .filter((it) => it.total >= 2 && it.ratio < 0.5)
        .map((it) => it.topic),
    [items],
  );

  const visible = expanded ? items : items.slice(0, COLLAPSED_COUNT);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Topic mastery
        </p>
        <div className="flex items-center gap-2">
          {weakTopics.length > 0 && onShowOnlyWeak && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] gap-1 text-amber-500 hover:text-amber-500 hover:bg-amber-500/10"
              onClick={() => onShowOnlyWeak(weakTopics)}
              title="Filter to topics where your solve rate is below 50%"
            >
              <AlertTriangle className="h-3 w-3" />
              Show weak ({weakTopics.length})
            </Button>
          )}
          {items.length > COLLAPSED_COUNT && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] gap-1"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <>
                  Less <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  All ({items.length}) <ChevronDown className="h-3 w-3" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((it) => {
          const sel = selectedTopics.includes(it.topic);
          const pct = Math.round(it.ratio * 100);
          return (
            <button
              key={it.topic}
              type="button"
              onClick={() => onToggle(it.topic)}
              aria-pressed={sel}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
                sel ? selectedColor(it.ratio) : masteryColor(it.ratio),
              )}
              title={`${it.solved} of ${it.total} solved (${pct}%)`}
            >
              <span>{it.topic}</span>
              <Badge
                variant="outline"
                className="h-4 px-1 text-[10px] font-normal border-current/30 bg-background/30"
              >
                {it.solved}/{it.total}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
};
