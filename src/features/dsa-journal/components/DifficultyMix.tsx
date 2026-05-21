import { useMemo } from "react";
import type { EntryWithDay } from "../types";

interface Props {
  entries: EntryWithDay[];
}

const COLORS: Record<string, string> = {
  Easy: "bg-emerald-500/70",
  Medium: "bg-amber-500/70",
  Hard: "bg-rose-500/70",
};

export default function DifficultyMix({ entries }: Props) {
  const { counts, total } = useMemo(() => {
    const c: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
    for (const e of entries) if (e.difficulty && c[e.difficulty] !== undefined) c[e.difficulty] += 1;
    return { counts: c, total: c.Easy + c.Medium + c.Hard };
  }, [entries]);

  if (total === 0) return null;

  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Difficulty mix
        </div>
        <div className="text-[11px] text-muted-foreground">{total} problems</div>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden flex bg-muted/30">
        {(["Easy", "Medium", "Hard"] as const).map((d) => {
          const pct = total ? (counts[d] / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={d}
              className={COLORS[d]}
              style={{ width: `${pct}%`, transition: "width 600ms ease" }}
              title={`${d}: ${counts[d]} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[11px]">
        {(["Easy", "Medium", "Hard"] as const).map((d) => (
          <span key={d} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-sm ${COLORS[d]}`} />
            <span className="text-muted-foreground">
              {d} <span className="text-foreground font-medium">{counts[d]}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
