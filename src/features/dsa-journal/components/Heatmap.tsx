import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { JournalDay } from "../types";

interface Props {
  days: JournalDay[];
  /** map of date → number of problems on that date */
  countsByDate: Map<string, number>;
  weeks?: number;
}

const fmt = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Simple GitHub-style heatmap for the last N weeks.
 * Intensity binned by problem count: 0 / 1 / 2-3 / 4-6 / 7+.
 */
export default function Heatmap({ days, countsByDate, weeks = 18 }: Props) {
  const grid = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    // align to Monday
    start.setDate(start.getDate() - weeks * 7 + 1);
    while (start.getDay() !== 1) start.setDate(start.getDate() - 1);
    const cols: { date: string; count: number }[][] = [];
    const cursor = new Date(start);
    for (let w = 0; w < weeks; w++) {
      const col: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const ds = fmt(cursor);
        col.push({ date: ds, count: countsByDate.get(ds) ?? 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(col);
    }
    return cols;
  }, [countsByDate, weeks]);

  const bin = (n: number) =>
    n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4;
  const cls = [
    "bg-muted/30",
    "bg-emerald-500/30",
    "bg-emerald-500/50",
    "bg-emerald-500/70",
    "bg-emerald-400",
  ];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]">
        {grid.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date} — ${cell.count} problem${cell.count === 1 ? "" : "s"}`}
                className={cn(
                  "h-3 w-3 rounded-[2px] border border-border/30",
                  cls[bin(cell.count)],
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        {cls.map((c, i) => (
          <span key={i} className={cn("h-2.5 w-2.5 rounded-[2px]", c)} />
        ))}
        <span>More</span>
        <span className="ml-auto">
          {days.length} active day{days.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
