import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  event_type: string;
  char_count: number | null;
  paste_size: number | null;
  diff_summary: Record<string, unknown> | null;
  client_ts: string;
  server_ts: string;
  suspicious: boolean;
  reason: string | null;
}

/**
 * Code timeline replay player — scrubs through a session's
 * `contest_code_provenance` events, surfacing pastes, delete bursts
 * and snapshots on a horizontal timeline. Lets admins prove (or
 * disprove) that a solution was typed organically.
 */
export function CodeTimelineReplay({ sessionId }: { sessionId: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("contest_code_provenance")
        .select("id, event_type, char_count, paste_size, diff_summary, client_ts, server_ts, suspicious, reason")
        .eq("session_id", sessionId)
        .order("server_ts", { ascending: true })
        .limit(2000);
      if (!alive) return;
      setEvents((data ?? []) as unknown as Event[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [sessionId]);

  const stats = useMemo(() => {
    const totalKeys = events.reduce((s, e) => s + (e.event_type === "keystroke" ? (e.char_count ?? 0) : 0), 0);
    const totalPasted = events.reduce((s, e) => s + (e.event_type === "paste" ? (e.paste_size ?? 0) : 0), 0);
    const pasteCount = events.filter((e) => e.event_type === "paste").length;
    const largePastes = events.filter((e) => e.event_type === "paste" && (e.paste_size ?? 0) >= 80).length;
    const deleteBursts = events.filter((e) => e.event_type === "delete_block").length;
    const suspicious = events.filter((e) => e.suspicious).length;
    const ratio = totalKeys + totalPasted > 0 ? totalPasted / (totalKeys + totalPasted) : 0;
    return { totalKeys, totalPasted, pasteCount, largePastes, deleteBursts, suspicious, ratio };
  }, [events]);

  if (loading) return <Card className="p-4 text-sm text-muted-foreground"></Card>;
  if (events.length === 0) return <Card className="p-4 text-sm text-muted-foreground">No provenance recorded.</Card>;

  const current = events[Math.min(idx, events.length - 1)];
  const start = new Date(events[0].server_ts).getTime();
  const end = new Date(events[events.length - 1].server_ts).getTime();
  const span = Math.max(end - start, 1);

  return (
    <Card className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Stat label="Keys" value={stats.totalKeys} />
        <Stat label="Pasted chars" value={stats.totalPasted} tone={stats.ratio > 0.4 ? "bad" : undefined} />
        <Stat label="Large pastes" value={stats.largePastes} tone={stats.largePastes > 0 ? "warn" : undefined} />
        <Stat label="Delete bursts" value={stats.deleteBursts} tone={stats.deleteBursts > 2 ? "warn" : undefined} />
      </div>

      <div className="text-xs text-muted-foreground">
        Paste / total ratio:{" "}
        <span className={stats.ratio > 0.4 ? "font-bold text-destructive" : ""}>
          {(stats.ratio * 100).toFixed(1)}%
        </span>{" "}
        · {stats.suspicious} suspicious events
      </div>

      <div className="relative h-12 rounded bg-muted">
        {events.map((e, i) => {
          const t = new Date(e.server_ts).getTime();
          const left = ((t - start) / span) * 100;
          const color =
            e.event_type === "paste"
              ? e.suspicious ? "bg-destructive" : "bg-amber-500"
              : e.event_type === "delete_block"
                ? "bg-orange-500"
                : e.event_type === "snapshot"
                  ? "bg-primary/40"
                  : "bg-muted-foreground/30";
          return (
            <button
              key={e.id}
              type="button"
              className={`absolute top-1 h-10 w-1 ${color} ${i === idx ? "ring-2 ring-foreground" : ""}`}
              style={{ left: `${left}%` }}
              onClick={() => setIdx(i)}
              title={`${e.event_type} @ ${new Date(e.server_ts).toLocaleTimeString()}`}
            />
          );
        })}
      </div>

      <Slider min={0} max={events.length - 1} step={1} value={[idx]} onValueChange={(v) => setIdx(v[0] ?? 0)} aria-label="Timeline position" />

      <div className="space-y-2 rounded border p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={current.suspicious ? "destructive" : "outline"}>{current.event_type}</Badge>
          <span className="text-muted-foreground">{new Date(current.server_ts).toLocaleString()}</span>
          {current.reason && <Badge variant="secondary">{current.reason}</Badge>}
        </div>
        <pre className="max-h-40 overflow-auto rounded bg-muted p-2">
          {JSON.stringify({ char_count: current.char_count, paste_size: current.paste_size, diff_summary: current.diff_summary }, null, 2)}
        </pre>
      </div>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" | "bad" }) {
  return (
    <div className="rounded border p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold ${tone === "bad" ? "text-destructive" : tone === "warn" ? "text-amber-500" : ""}`}>{value}</div>
    </div>
  );
}
