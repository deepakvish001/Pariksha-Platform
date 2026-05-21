import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import type { EntryWithDay } from "../types";

interface Props {
  entries: EntryWithDay[];
}

export default function TimeOfDayChart({ entries }: Props) {
  const data = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}`, count: 0 }));
    for (const e of entries) {
      const ts = e.started_at ?? e.created_at;
      const h = new Date(ts).getHours();
      buckets[h].count += 1;
    }
    return buckets;
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <Card className="p-4 md:col-span-3">
      <div className="text-xs text-muted-foreground mb-2">Time of day · when you solve</div>
      <div className="h-44">
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                fontSize: 11,
              }}
              labelFormatter={(l) => `${l}:00`}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
