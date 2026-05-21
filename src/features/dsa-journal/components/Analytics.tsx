import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { EntryWithDay } from "../types";

interface Props {
  entries: EntryWithDay[];
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
  "#ec4899",
  "#84cc16",
];

export default function Analytics({ entries }: Props) {
  const { byDay, byTopic, byPattern, weakPatterns, totals } = useMemo(() => {
    const day = new Map<string, number>();
    const topic = new Map<string, number>();
    const pattern = new Map<string, { total: number; clean: number }>();
    let total = 0;
    let clean = 0;
    let mastered = 0;

    for (const e of entries) {
      const d = e.day?.log_date ?? e.created_at.slice(0, 10);
      day.set(d, (day.get(d) ?? 0) + 1);
      if (e.topic) topic.set(e.topic, (topic.get(e.topic) ?? 0) + 1);
      if (e.pattern) {
        const cur = pattern.get(e.pattern) ?? { total: 0, clean: 0 };
        cur.total += 1;
        if (e.solved_clean) cur.clean += 1;
        pattern.set(e.pattern, cur);
      }
      total += 1;
      if (e.solved_clean) clean += 1;
      if (e.mastered_at) mastered += 1;
    }

    const byDay = [...day.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-30)
      .map(([date, count]) => ({ date: date.slice(5), count }));

    const byTopic = [...topic.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    const byPattern = [...pattern.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8)
      .map(([name, v]) => ({ name, value: v.total }));

    const weakPatterns = [...pattern.entries()]
      .filter(([, v]) => v.total >= 2)
      .map(([name, v]) => ({
        name,
        rate: Math.round((v.clean / v.total) * 100),
        total: v.total,
      }))
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 6);

    return {
      byDay,
      byTopic,
      byPattern,
      weakPatterns,
      totals: { total, clean, mastered },
    };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Log a few problems to unlock your analytics.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Card className="p-4 md:col-span-3">
        <div className="text-xs text-muted-foreground mb-2">
          Problems per day (last 30 active days)
        </div>
        <div className="h-48">
          <ResponsiveContainer>
            <BarChart data={byDay}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-xs text-muted-foreground mb-2">Topic mix</div>
        <div className="h-56">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={byTopic} dataKey="value" nameKey="name" outerRadius={70} label>
                {byTopic.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-xs text-muted-foreground mb-2">Pattern mix</div>
        <div className="h-56">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={byPattern} dataKey="value" nameKey="name" outerRadius={70} label>
                {byPattern.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-xs text-muted-foreground mb-2">Weakest patterns</div>
        {weakPatterns.length === 0 ? (
          <div className="text-xs text-muted-foreground py-6 text-center">
            Need more reps to surface weak spots.
          </div>
        ) : (
          <ul className="space-y-2">
            {weakPatterns.map((p) => (
              <li key={p.name} className="text-xs">
                <div className="flex justify-between mb-0.5">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">
                    {p.rate}% clean · {p.total} problems
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full bg-rose-400/70"
                    style={{ width: `${p.rate}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4 md:col-span-2">
        <div className="text-xs text-muted-foreground mb-3">Totals</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Logged" value={totals.total} />
          <Stat label="Clean solves" value={totals.clean} accent="text-emerald-400" />
          <Stat label="Mastered" value={totals.mastered} accent="text-primary" />
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/40 p-3">
      <div className={`text-2xl font-bold ${accent ?? ""}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
