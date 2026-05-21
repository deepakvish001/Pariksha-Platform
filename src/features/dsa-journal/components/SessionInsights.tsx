import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Layers, Timer, Trophy, Flame } from "lucide-react";
import type { EntryWithDay } from "../types";

interface Props {
  entries: EntryWithDay[];
}

interface Bucket {
  date: string;
  label: string;
  count: number;
  totalMin: number;
  startMs: number | null;
  endMs: number | null;
}

export default function SessionInsights({ entries }: Props) {
  const data = useMemo(() => {
    const tagged = entries.filter((e) => e.session_label);
    if (tagged.length === 0) return null;

    const map = new Map<string, Bucket>();
    for (const e of tagged) {
      const date = (e.day?.log_date ?? e.created_at.slice(0, 10)) as string;
      const key = `${date}|${e.session_label}`;
      const cur =
        map.get(key) ??
        ({
          date,
          label: e.session_label!,
          count: 0,
          totalMin: 0,
          startMs: null,
          endMs: null,
        } as Bucket);
      cur.count += 1;
      cur.totalMin += e.time_taken_min ?? 0;
      if (e.started_at) {
        const ms = new Date(e.started_at).getTime();
        cur.startMs = cur.startMs === null ? ms : Math.min(cur.startMs, ms);
      }
      if (e.ended_at) {
        const ms = new Date(e.ended_at).getTime();
        cur.endMs = cur.endMs === null ? ms : Math.max(cur.endMs, ms);
      }
      map.set(key, cur);
    }
    const buckets = [...map.values()];

    const avgPerSession = +(
      buckets.reduce((s, b) => s + b.count, 0) / buckets.length
    ).toFixed(1);

    const withTime = buckets.filter((b) => b.totalMin > 0);
    const avgLen = withTime.length
      ? Math.round(withTime.reduce((s, b) => s + b.totalMin, 0) / withTime.length)
      : 0;

    const longest = buckets.reduce(
      (best, b) => (b.totalMin > best.totalMin ? b : best),
      buckets[0],
    );

    const byLabel = new Map<string, number>();
    for (const b of buckets) byLabel.set(b.label, (byLabel.get(b.label) ?? 0) + b.count);
    const total = [...byLabel.values()].reduce((s, n) => s + n, 0);
    const top = [...byLabel.entries()].sort((a, b) => b[1] - a[1])[0];
    const topPct = top ? Math.round((top[1] / total) * 100) : 0;

    return { avgPerSession, avgLen, longest, top, topPct };
  }, [entries]);

  if (!data) return null;

  const tiles = [
    {
      icon: Layers,
      label: "Avg per session",
      value: data.avgPerSession,
      accent: "text-violet-400",
    },
    {
      icon: Timer,
      label: "Avg session length",
      value: data.avgLen ? `${data.avgLen}m` : "—",
      accent: "text-sky-400",
    },
    {
      icon: Trophy,
      label: "Top session",
      value: data.top ? data.top[0] : "—",
      hint: data.top ? `${data.topPct}% of solves` : undefined,
      accent: "text-emerald-400",
    },
    {
      icon: Flame,
      label: "Longest focus",
      value: data.longest ? `${data.longest.totalMin}m` : "—",
      hint: data.longest ? `${data.longest.label} · ${data.longest.date}` : undefined,
      accent: "text-orange-400",
    },
  ];

  return (
    <Card className="p-4 md:col-span-3">
      <div className="text-xs text-muted-foreground mb-3">Session insights</div>
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
                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{t.hint}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
