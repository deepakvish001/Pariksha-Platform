import { useMemo } from "react";
import type { EntryWithDay } from "../types";

interface Props {
  entries: EntryWithDay[];
  onPick?: (topic: string) => void;
}

export default function TopicMastery({ entries, onPick }: Props) {
  const rows = useMemo(() => {
    const m = new Map<string, { total: number; clean: number; mastered: number }>();
    for (const e of entries) {
      if (!e.topic) continue;
      const cur = m.get(e.topic) ?? { total: 0, clean: 0, mastered: 0 };
      cur.total += 1;
      if (e.solved_clean) cur.clean += 1;
      if (e.mastered_at) cur.mastered += 1;
      m.set(e.topic, cur);
    }
    const arr = [...m.entries()].map(([topic, v]) => {
      const cleanPct = v.total ? Math.round((v.clean / v.total) * 100) : 0;
      const mastery = v.total
        ? Math.round(((v.mastered / v.total) * 0.6 + (v.clean / v.total) * 0.4) * 100)
        : 0;
      const weakness = 100 - mastery;
      return { topic, ...v, cleanPct, mastery, weakness };
    });
    arr.sort((a, b) => b.weakness - a.weakness);
    return arr.slice(0, 8);
  }, [entries]);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">Topic mastery</div>
        <div className="text-[11px] text-muted-foreground">Click a topic to filter</div>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <button
            key={r.topic}
            onClick={() => onPick?.(r.topic)}
            className="w-full text-left group"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium group-hover:text-primary transition">{r.topic}</span>
              <span className="text-muted-foreground">
                {r.total} · {r.cleanPct}% clean · {r.mastered} mastered
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/40 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500/70"
                style={{ width: `${r.mastery}%`, transition: "width 600ms ease" }}
              />
              <div
                className="h-full bg-amber-500/40"
                style={{ width: `${Math.max(0, 100 - r.mastery)}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
