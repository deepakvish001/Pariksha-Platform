import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { parseISO, differenceInCalendarDays } from "date-fns";
import { Trophy, Clock, Flame, AlertTriangle } from "lucide-react";
import type { EntryWithDay } from "../types";

interface Props {
  entries: EntryWithDay[];
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ActivityInsights({ entries }: Props) {
  const data = useMemo(() => {
    if (entries.length === 0) return null;

    const dowCount = [0, 0, 0, 0, 0, 0, 0];
    const windowCount = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    const topicStats = new Map<string, { total: number; clean: number }>();

    for (const e of entries) {
      const d = new Date(e.created_at);
      dowCount[d.getDay()] += 1;
      const h = d.getHours();
      if (h < 6) windowCount.Night += 1;
      else if (h < 12) windowCount.Morning += 1;
      else if (h < 18) windowCount.Afternoon += 1;
      else windowCount.Evening += 1;

      if (e.topic) {
        const cur = topicStats.get(e.topic) ?? { total: 0, clean: 0 };
        cur.total += 1;
        if (e.solved_clean) cur.clean += 1;
        topicStats.set(e.topic, cur);
      }
    }

    const bestDayIdx = dowCount.indexOf(Math.max(...dowCount));
    const bestWindow = (Object.entries(windowCount) as [string, number][]).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    // Streak (current + longest) from distinct calendar days
    const daySet = new Set(entries.map((e) => (e.day?.log_date ?? e.created_at.slice(0, 10))));
    const sortedDays = [...daySet].sort();
    let longest = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const ds of sortedDays) {
      const d = parseISO(ds);
      if (prev && differenceInCalendarDays(d, prev) === 1) run += 1;
      else run = 1;
      longest = Math.max(longest, run);
      prev = d;
    }
    let current = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let cursor = new Date(today);
    if (!daySet.has(cursor.toISOString().slice(0, 10))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (daySet.has(cursor.toISOString().slice(0, 10))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const hardest = [...topicStats.entries()]
      .filter(([, v]) => v.total >= 3)
      .map(([name, v]) => ({ name, rate: Math.round((v.clean / v.total) * 100) }))
      .sort((a, b) => a.rate - b.rate)[0];

    return {
      bestDay: DOW[bestDayIdx],
      bestWindow,
      current,
      longest,
      hardest,
    };
  }, [entries]);

  if (!data) return null;

  const tiles = [
    {
      icon: Trophy,
      label: "Best day",
      value: data.bestDay,
      accent: "text-emerald-400",
    },
    {
      icon: Clock,
      label: "Peak window",
      value: data.bestWindow,
      accent: "text-sky-400",
    },
    {
      icon: Flame,
      label: "Streak",
      value: `${data.current}d`,
      hint: `Longest ${data.longest}d`,
      accent: "text-orange-400",
    },
    {
      icon: AlertTriangle,
      label: "Hardest topic",
      value: data.hardest ? data.hardest.name : "—",
      hint: data.hardest ? `${data.hardest.rate}% clean` : "Need 3+ reps",
      accent: "text-rose-400",
    },
  ];

  return (
    <Card className="p-4 md:col-span-3">
      <div className="text-xs text-muted-foreground mb-3">Activity insights</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.label}
              className="rounded-lg border border-border/40 bg-card/40 p-3 flex items-start gap-3"
            >
              <div
                className={`h-8 w-8 rounded-md bg-card/60 border border-border/40 flex items-center justify-center ${t.accent}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{t.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {t.label}
                </div>
                {t.hint && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{t.hint}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
